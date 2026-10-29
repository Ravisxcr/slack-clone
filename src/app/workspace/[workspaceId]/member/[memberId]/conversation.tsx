'use client';

import { Loader } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { Id } from '@/../convex/_generated/dataModel';
import { MessageList } from '@/components/message-list';
import { useGetConversationLastRead } from '@/features/conversations/api/use-get-conversation-last-read';
import { useGetMember } from '@/features/members/api/use-get-member';
import { useGetMessages } from '@/features/messages/api/use-get-messages';
import { useMarkConversationRead } from '@/features/messages/api/use-mark-conversation-read';
import { ChannelReelsView } from '@/features/reels/components/channel-reels-view';
import { useMemberId } from '@/hooks/use-member-id';
import { usePanel } from '@/hooks/use-panel';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { isAmbientMessage } from '@/lib/video-parser';

import { ChatInput } from './chat-input';
import { Header } from './header';

interface ConversationProps {
  id: Id<'conversations'>;
}

export const Conversation = ({ id }: ConversationProps) => {
  const memberId = useMemberId();
  const workspaceId = useWorkspaceId();
  const { onOpenProfile, onOpenMessage } = usePanel();

  const [activeTab, setActiveTab] = useState<'messages' | 'reels'>('messages');

  const { data: member, isLoading: memberLoading } = useGetMember({ id: memberId });
  const { results, status, loadMore } = useGetMessages({ conversationId: id });

  const { data: conversationLastRead } = useGetConversationLastRead({ conversationId: id });
  const otherMemberLastReadTime = conversationLastRead?.[memberId] ?? 0;

  const { mutate: markRead } = useMarkConversationRead();

  useEffect(() => {
    markRead({ conversationId: id, workspaceId });
  }, [id, workspaceId, markRead]);

  // Regular conversation messages: ambient reels are excluded to prevent cluttering
  const chatMessages = useMemo(() => {
    if (!results) return [];
    return results.filter((msg) => !isAmbientMessage(msg.body));
  }, [results]);

  // Ambient reels for this DM
  const reelMessages = useMemo(() => {
    if (!results) return [];
    return results.filter((msg) => isAmbientMessage(msg.body));
  }, [results]);

  const reelsCount = reelMessages.length;

  if (memberLoading || status === 'LoadingFirstPage') {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Header
        memberName={member?.user.name}
        memberImage={member?.user.image}
        availability={member?.availability}
        onClick={() => onOpenProfile(memberId)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        reelsCount={reelsCount}
      />

      {activeTab === 'messages' && (
        <>
          <MessageList
            data={chatMessages}
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
        </>
      )}

      {activeTab === 'reels' && (
        <>
          <ChannelReelsView
            channelName={member?.user.name ?? 'Member'}
            messages={reelMessages}
            onOpenThread={onOpenMessage}
            isMemberDm
          />

          <ChatInput placeholder={`Share a reel with ${member?.user.name}...`} conversationId={id} />
        </>
      )}
    </div>
  );
};
