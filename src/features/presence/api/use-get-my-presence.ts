'use client';

import { useQuery } from 'convex/react';

import { api } from '@/../convex/_generated/api';

export const useGetMyPresence = () => {
  const data = useQuery(api.presence.getMyPresence);
  const isLoading = data === undefined;
  return { data, isLoading };
};
