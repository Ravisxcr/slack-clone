'use client';

import { useQuery } from 'convex/react';

import { api } from '@/../convex/_generated/api';

export const useGetAllDms = () => {
  const data = useQuery(api.conversations.getAllForCurrentUser);
  const isLoading = data === undefined;
  return { data, isLoading };
};
