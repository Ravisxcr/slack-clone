'use client';

import { Loader } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { Id } from '@/../convex/_generated/dataModel';
import { MessageList } from '@/components/message-list';
import { useGetConversationLastRead } from '@/features/conversations/api/use-get-conversation-last-read';
import { useGetMember } from '@/features/members/api/use-get-member';
import { useCreateMessage } from '@/features/messages/api/use-create-message';
import { useGetMessages } from '@/features/messages/api/use-get-messages';
import { useMarkConversationRead } from '@/features/messages/api/use-mark-conversation-read';
import { ChannelReelsView } from '@/features/reels/components/channel-reels-view';
import { useMemberId } from '@/hooks/use-member-id';
import { usePanel } from '@/hooks/use-panel';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { parseVideoUrl } from '@/lib/video-parser';

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
  const { mutate: createMessage } = useCreateMessage();

  const { data: conversationLastRead } = useGetConversationLastRead({ conversationId: id });
  const otherMemberLastReadTime = conversationLastRead?.[memberId] ?? 0;

  const { mutate: markRead } = useMarkConversationRead();

  useEffect(() => {
    markRead({ conversationId: id, workspaceId });
  }, [id, workspaceId, markRead]);

  const handleSendReelMessage = (text: string) => {
    createMessage({
      conversationId: id,
      workspaceId,
      body: JSON.stringify({ ops: [{ insert: text + '\n' }] }),
    });
  };

  // Count vertical reels in this DM
  const reelsCount = useMemo(() => {
    if (!results) return 0;
    return results.filter((msg) => {
      try {
        let text = msg.body;
        try {
          const delta = JSON.parse(msg.body);
          if (delta.ops && Array.isArray(delta.ops)) {
            text = delta.ops.map((op: { insert?: string }) => op.insert || '').join('');
          }
        } catch {
          // ignore
        }
        const urls = text.match(/https?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g) || [];
        return urls.some((url) => {
          const parsed = parseVideoUrl(url);
          return parsed && parsed.isVertical;
        });
      } catch {
        return false;
      }
    }).length;
  }, [results]);

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
        </>
      )}

      {activeTab === 'reels' && (
        <ChannelReelsView
          channelName={member?.user.name ?? 'Member'}
          messages={results}
          onOpenThread={onOpenMessage}
          onSendMessage={handleSendReelMessage}
          isMemberDm
        />
      )}
    </div>
  );
};
