import { Loader } from 'lucide-react';
import { useEffect } from 'react';

import type { Id } from '@/../convex/_generated/dataModel';
import { MessageList } from '@/components/message-list';
import { useGetConversationLastRead } from '@/features/conversations/api/use-get-conversation-last-read';
import { useGetMember } from '@/features/members/api/use-get-member';
import { useGetMessages } from '@/features/messages/api/use-get-messages';
import { useMarkConversationRead } from '@/features/messages/api/use-mark-conversation-read';
import { useChatTabs } from '@/features/tabs/store/use-chat-tabs';
import { useMemberId } from '@/hooks/use-member-id';
import { usePanel } from '@/hooks/use-panel';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

import { ChatInput } from './chat-input';
import { Header } from './header';

interface ConversationProps {
  id: Id<'conversations'>;
}

export const Conversation = ({ id }: ConversationProps) => {
  const memberId = useMemberId();
  const workspaceId = useWorkspaceId();
  const { addOrFocusTab } = useChatTabs();

  const { onOpenProfile } = usePanel();

  const { data: member, isLoading: memberLoading } = useGetMember({ id: memberId });

  const { results, status, loadMore } = useGetMessages({ conversationId: id });

  const { data: conversationLastRead } = useGetConversationLastRead({ conversationId: id });
  const otherMemberLastReadTime = conversationLastRead?.[memberId] ?? 0;

  const { mutate: markRead } = useMarkConversationRead();

  useEffect(() => {
    markRead({ conversationId: id, workspaceId });
  }, [id, workspaceId, markRead]);

  useEffect(() => {
    if (member?.user) {
      addOrFocusTab({
        id: memberId,
        type: 'member',
        name: member.user.name || 'Member',
        image: member.user.image,
        path: `/workspace/${workspaceId}/member/${memberId}`,
      });
    }
  }, [member?._id, member?.user?.name, member?.user?.image, memberId, workspaceId, addOrFocusTab]);

  if (memberLoading || status === 'LoadingFirstPage') {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Header memberName={member?.user.name} memberImage={member?.user.image} availability={member?.availability} onClick={() => onOpenProfile(memberId)} />

      <MessageList
        data={results}
        variant="conversation"
        memberName={member?.user.name}
        memberImage={member?.user.image}
        memberAvailability={member?.availability}
        loadMore={loadMore}
        canLoadMore={status === 'CanLoadMore'}
        isLoadingMore={status === 'LoadingMore'}
        otherMemberLastReadTime={otherMemberLastReadTime}
      />

      <ChatInput placeholder={`Message ${member?.user.name}`} conversationId={id} />
    </div>
  );
};
