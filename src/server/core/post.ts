import { reddit } from '@devvit/web/server';

export const createPost = async (title = 'rate-it-1-10') => {
  return await reddit.submitCustomPost({
    title,
  });
};
