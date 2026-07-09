import { Hono } from 'hono';
import type { TaskRequest, TaskResponse } from '@devvit/web/server';
import { markPollResultsReady } from '../core/poll';

type PollRevealJobData = {
  postId: string;
};

export const scheduler = new Hono();

scheduler.post('/poll-reveal', async (c) => {
  try {
    const body = await c.req.json<TaskRequest<PollRevealJobData>>();
    const postId = body.data?.postId;

    if (!postId) {
      return c.json<TaskResponse>({ status: 'error', message: 'postId is required' }, 400);
    }

    await markPollResultsReady(postId);

    return c.json<TaskResponse>({ status: 'ok' }, 200);
  } catch (error) {
    console.error('Failed to reveal poll results:', error);
    return c.json<TaskResponse>({ status: 'error', message: 'Failed to reveal poll results' }, 400);
  }
});