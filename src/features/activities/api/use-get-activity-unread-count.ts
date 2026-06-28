'use client';

import { useQuery } from 'convex/react';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

interface UseGetActivityUnreadCountProps {
  workspaceId: Id<'workspaces'>;
}

export const useGetActivityUnreadCount = ({ workspaceId }: UseGetActivityUnreadCountProps) => {
  const data = useQuery(api.activityEvents.getUnreadCount, workspaceId ? { workspaceId } : 'skip');
  const isLoading = data === undefined;
  return { data, isLoading };
};
