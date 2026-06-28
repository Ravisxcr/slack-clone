'use client';

import { useQuery } from 'convex/react';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

export const useGetConversationLastRead = ({ conversationId }: { conversationId: Id<'conversations'> }) => {
  const data = useQuery(api.conversations.getLastRead, { conversationId });
  const isLoading = data === undefined;
  return { data, isLoading };
};
