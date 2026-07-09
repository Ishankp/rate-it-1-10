import { redis, reddit, scheduler } from '@devvit/web/server';
import { createPost } from './post';
import type {
  PollBucket,
  PollFormValues,
  PollScore,
  PollState,
} from '../../shared/api';

const pollScores: PollScore[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const pollMetaKey = (postId: string) => `poll:${postId}:meta`;
const pollVotesKey = (postId: string) => `poll:${postId}:votes`;
const pollCountsKey = (postId: string) => `poll:${postId}:counts`;

const toStringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
};

const toDurationHours = (value: unknown): number => {
  const parsed =
    typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 24;
  }

  return Math.min(Math.max(parsed, 0.25), 168);
};

const isPollScore = (value: number): value is PollScore =>
  pollScores.includes(value as PollScore);

const toBuckets = (counts: Record<string, string>, totalVotes: number) => {
  return pollScores.map((score) => {
    const count = Number(counts[String(score)] ?? 0);
    const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

    return {
      score,
      count,
      percentage,
    } satisfies PollBucket;
  });
};

const readPollState = async (postId: string, username: string | null) => {
  const [meta, counts, userVoteRaw] = await Promise.all([
    redis.hGetAll(pollMetaKey(postId)),
    redis.hGetAll(pollCountsKey(postId)),
    username ? redis.hGet(pollVotesKey(postId), username) : Promise.resolve(null),
  ]);

  if (!meta) {
    return null;
  }

  const createdAt = Number(meta.createdAt ?? Date.now());
  const endsAt = Number(meta.endsAt ?? createdAt);
  const currentPhase = meta.phase === 'results' || Date.now() >= endsAt ? 'results' : 'active';

  const totalVotes = pollScores.reduce((total, score) => {
    return total + Number(counts?.[String(score)] ?? 0);
  }, 0);

  const userVote =
    userVoteRaw && isPollScore(Number(userVoteRaw))
      ? (Number(userVoteRaw) as PollScore)
      : null;

  return {
    postId,
    title: meta.title ?? meta.prompt ?? '1-10 poll',
    prompt: meta.prompt ?? '',
    opinion: meta.opinion ?? '',
    oneLabel: meta.oneLabel ?? '1',
    tenLabel: meta.tenLabel ?? '10',
    creator: meta.creator ?? 'anonymous',
    createdAt: new Date(createdAt).toISOString(),
    endsAt: new Date(endsAt).toISOString(),
    phase: currentPhase,
    totalVotes,
    userVote,
    resultsVisible: currentPhase === 'results',
    canVote: currentPhase === 'active' && !userVote,
    buckets: toBuckets(counts ?? {}, totalVotes),
    username,
  } satisfies PollState;
};

export const getPollState = async (postId: string, username: string | null) => {
  return await readPollState(postId, username);
};

export const createPoll = async (values: PollFormValues, creator: string) => {
  const prompt = toStringValue(values.prompt, 'Untitled 1-10 poll');
  const opinion = toStringValue(values.opinion, 'No opinion supplied');
  const oneLabel = toStringValue(values.oneLabel, 'The weaker side of the scale');
  const tenLabel = toStringValue(values.tenLabel, 'The stronger side of the scale');
  const durationHours = toDurationHours(values.durationHours);

  const post = await createPost(prompt);
  const postId = post.id;
  const createdAt = Date.now();
  const endsAt = createdAt + durationHours * 60 * 60 * 1000;

  await Promise.all([
    redis.hSet(pollMetaKey(postId), {
      creator,
      createdAt: String(createdAt),
      endsAt: String(endsAt),
      opinion,
      oneLabel,
      phase: 'active',
      prompt,
      title: prompt,
      totalVotes: '0',
      tenLabel,
    }),
    redis.hSet(pollCountsKey(postId), {
      1: '0',
      2: '0',
      3: '0',
      4: '0',
      5: '0',
      6: '0',
      7: '0',
      8: '0',
      9: '0',
      10: '0',
    }),
  ]);

  try {
    const jobId = await scheduler.runJob({
      id: `poll-reveal-${postId}`,
      name: 'poll-reveal',
      runAt: new Date(endsAt),
      data: { postId },
    });

    await redis.hSet(pollMetaKey(postId), { jobId });
  } catch (error) {
    console.error(`Failed to schedule reveal for ${postId}:`, error);
  }

  return {
    postId,
    state: await getPollState(postId, creator),
  };
};

export const submitPollVote = async (
  postId: string,
  username: string,
  score: PollScore
) => {
  if (!isPollScore(score)) {
    throw new Error('Vote must be a number between 1 and 10');
  }

  const stateBeforeVote = await readPollState(postId, username);

  if (!stateBeforeVote) {
    throw new Error('Poll not found');
  }

  if (!stateBeforeVote.canVote) {
    return stateBeforeVote;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const txn = await redis.watch(pollVotesKey(postId));

    try {
      const existingVote = await txn.hGet(pollVotesKey(postId), username);

      if (existingVote) {
        await txn.unwatch();
        return await readPollState(postId, username);
      }

      await txn.multi();
      await txn.hSet(pollVotesKey(postId), { [username]: String(score) });
      await txn.hIncrBy(pollCountsKey(postId), String(score), 1);
      await txn.hIncrBy(pollMetaKey(postId), 'totalVotes', 1);

      const committed = await txn.exec();

      if (committed) {
        return await readPollState(postId, username);
      }
    } catch (error) {
      await txn.discard();
      throw error;
    }
  }

  throw new Error('Failed to record vote after retrying');
};

export const markPollResultsReady = async (postId: string) => {
  await redis.hSet(pollMetaKey(postId), {
    phase: 'results',
  });

  const state = await getPollState(postId, null);

  if (!state) {
    return;
  }

  try {
    const topBucket = [...state.buckets].sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.score - right.score;
    })[0];

    const breakdown = state.buckets
      .map((bucket) => `${bucket.score}: ${bucket.count} (${bucket.percentage}%)`)
      .join(' | ');

    await reddit.submitComment({
      id: state.postId.startsWith('t3_') ? state.postId : `t3_${state.postId}`,
      text: [
        `Results are in for: ${state.prompt}`,
        '',
        `Top score: ${topBucket.score}/10 with ${topBucket.count} vote${topBucket.count === 1 ? '' : 's'} (${topBucket.percentage}%).`,
        '',
        `Full breakdown: ${breakdown}`,
        '',
        'Open the post and keep the discussion going.',
      ].join('\n'),
    });
  } catch (error) {
    console.error(`Failed to post results comment for ${postId}:`, error);
  }
};