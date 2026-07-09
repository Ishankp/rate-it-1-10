import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { reddit } from '@devvit/web/server';
import { createPoll } from '../core/poll';
import type { PollFormValues } from '../../shared/api';

export const forms = new Hono();

forms.post('/poll-create', async (c) => {
  try {
    const body = await c.req.json<Partial<PollFormValues>>();
    const creator = (await reddit.getCurrentUsername()) ?? 'anonymous';
    const { postId } = await createPoll(
      {
        prompt: body.prompt ?? '',
        opinion: body.opinion ?? '',
        oneLabel: body.oneLabel ?? '',
        tenLabel: body.tenLabel ?? '',
        durationHours: body.durationHours ?? 24,
      },
      creator
    );

    return c.json<UiResponse>(
      {
        navigateTo: `https://www.reddit.com/comments/${postId}`,
      },
      200
    );
  } catch (error) {
    console.error('Failed to create poll:', error);

    return c.json<UiResponse>(
      {
        showToast: 'Failed to create poll',
      },
      400
    );
  }
});
