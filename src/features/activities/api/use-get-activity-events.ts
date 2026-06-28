'use client';

import { useQuery } from 'convex/react';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

interface UseGetActivityEventsProps {
  workspaceId: Id<'workspaces'>;
}

export const useGetActivityEvents = ({ workspaceId }: UseGetActivityEventsProps) => {
  const data = useQuery(api.activityEvents.getForCurrentUser, workspaceId ? { workspaceId } : 'skip');
  const isLoading = data === undefined;
  return { data, isLoading };
};
