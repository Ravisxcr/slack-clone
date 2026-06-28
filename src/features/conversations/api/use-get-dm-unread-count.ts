'use client';

import { useQuery } from 'convex/react';

import { api } from '@/../convex/_generated/api';

export const useGetDmUnreadCount = () => {
  const data = useQuery(api.conversations.getUnreadDmCountGlobal);
  const isLoading = data === undefined;
  return { data, isLoading };
};
