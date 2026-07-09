import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';

export const menu = new Hono();

menu.post('/create-poll', async (c) => {
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'pollForm',
        form: {
          title: 'Create a 1-10 poll',
          acceptLabel: 'Create poll',
          fields: [
            {
              name: 'prompt',
              label: 'Prompt',
              type: 'string',
              defaultValue: 'Who is the strongest character in Avatar: The Last Airbender?',
            },
            {
              name: 'opinion',
              label: 'Opinion',
              type: 'string',
              defaultValue: 'Sokka',
            },
            {
              name: 'oneLabel',
              label: 'What is a 1?',
              type: 'string',
              defaultValue: 'The weakest possible opinion on this topic',
            },
            {
              name: 'tenLabel',
              label: 'What is a 10?',
              type: 'string',
              defaultValue: 'The strongest possible opinion on this topic',
            },
            {
              name: 'durationHours',
              label: 'How long (hours)',
              type: 'number',
              defaultValue: 24,
            },
          ],
        },
      },
    },
    200
  );
});
