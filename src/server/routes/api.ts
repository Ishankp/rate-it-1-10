import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import type { ApiErrorResponse, PollResponse, PollVoteResponse, PollScore } from '../../shared/api';
import { getPollState, submitPollVote } from '../core/poll';

export const api = new Hono();

api.get('/poll', async (c) => {
  const { postId } = context;

  if (!postId) {
    return c.json<ApiErrorResponse>(
      {
        status: 'error',
        message: 'postId is required but missing from context',
      },
      400
    );
  }

  try {
    const username = (await reddit.getCurrentUsername()) ?? null;
    const state = await getPollState(postId, username);

    if (!state) {
      return c.json<ApiErrorResponse>(
        {
          status: 'error',
          message: 'Poll not found',
        },
        404
      );
    }

    return c.json<PollResponse>({
      type: 'poll',
      state,
    });
  } catch (error) {
    let errorMessage = 'Unknown error while loading the poll';

    if (error instanceof Error) {
      errorMessage = `Loading failed: ${error.message}`;
    }

    return c.json<ApiErrorResponse>(
      { status: 'error', message: errorMessage },
      400
    );
  }
});

api.post('/vote', async (c) => {
  const { postId } = context;

  if (!postId) {
    return c.json<ApiErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const username = (await reddit.getCurrentUsername()) ?? null;

  if (!username) {
    return c.json<ApiErrorResponse>(
      {
        status: 'error',
        message: 'You need to be logged in to vote',
      },
      401
    );
  }

  try {
    const body = await c.req.json<{ score: number }>();
    const score = Number(body.score) as PollScore;
    const state = await submitPollVote(postId, username, score);

    return c.json<PollVoteResponse>({
      type: 'vote',
      message: 'Vote recorded',
      state,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record vote';

    return c.json<ApiErrorResponse>(
      {
        status: 'error',
        message,
      },
      400
    );
  }
});
