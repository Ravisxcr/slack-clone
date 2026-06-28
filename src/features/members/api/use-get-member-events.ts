'use client';

import { useQuery } from 'convex/react';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

interface UseGetMemberEventsProps {
  workspaceId: Id<'workspaces'> | undefined;
}

export const useGetMemberEvents = ({ workspaceId }: UseGetMemberEventsProps) => {
  const data = useQuery(api.memberEvents.getByWorkspace, workspaceId ? { workspaceId } : 'skip');

  const isLoading = data === undefined;

  return { data, isLoading };
};
