export type PollScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type PollPhase = 'active' | 'results';

export type PollFormValues = {
  prompt: string;
  opinion: string;
  oneLabel: string;
  tenLabel: string;
  durationHours: number;
};

export type PollBucket = {
  score: PollScore;
  count: number;
  percentage: number;
};

export type PollState = {
  postId: string;
  title: string;
  prompt: string;
  opinion: string;
  oneLabel: string;
  tenLabel: string;
  creator: string;
  createdAt: string;
  endsAt: string;
  phase: PollPhase;
  totalVotes: number;
  userVote: PollScore | null;
  resultsVisible: boolean;
  canVote: boolean;
  buckets: PollBucket[];
  username: string | null;
};

export type PollResponse = {
  type: 'poll';
  state: PollState;
};

export type PollVoteResponse = {
  type: 'vote';
  message: string;
  state: PollState;
};

export type ApiErrorResponse = {
  status: 'error';
  message: string;
};
