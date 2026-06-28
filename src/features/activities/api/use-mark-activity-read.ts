'use client';

import { useMutation } from 'convex/react';

import { api } from '@/../convex/_generated/api';

export const useMarkActivityRead = () => {
  const mutate = useMutation(api.activityEvents.markAllRead);
  return { mutate };
};
