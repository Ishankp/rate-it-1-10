import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PollResponse, PollScore, PollState, PollVoteResponse } from '../../shared/api';

type PollHookState = {
  poll: PollState | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
};

export const usePoll = () => {
  const [state, setState] = useState<PollHookState>({
    poll: null,
    loading: true,
    submitting: false,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      setState((previous) => ({ ...previous, loading: true, error: null }));
      const response = await fetch('/api/poll');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload: PollResponse = await response.json();

      if (payload.type !== 'poll') {
        throw new Error('Unexpected poll response');
      }

      setState({
        poll: payload.state,
        loading: false,
        submitting: false,
        error: null,
      });
    } catch (error) {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load poll',
      }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const vote = useCallback(async (score: PollScore) => {
    setState((previous) => ({ ...previous, submitting: true, error: null }));

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `HTTP ${response.status}`);
      }

      const payload: PollVoteResponse = await response.json();

      if (payload.type !== 'vote') {
        throw new Error('Unexpected vote response');
      }

      setState({
        poll: payload.state,
        loading: false,
        submitting: false,
        error: null,
      });

      return payload.state;
    } catch (error) {
      setState((previous) => ({
        ...previous,
        submitting: false,
        error: error instanceof Error ? error.message : 'Failed to vote',
      }));

      return null;
    }
  }, []);

  const refresh = useMemo(() => load, [load]);

  return {
    ...state,
    vote,
    refresh,
  } as const;
};