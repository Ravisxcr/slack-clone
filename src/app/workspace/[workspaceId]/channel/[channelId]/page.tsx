'use client';

import { Loader, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';

import { MessageList } from '@/components/message-list';
import { useGetChannel } from '@/features/channels/api/use-get-channel';
import { useGetMessages } from '@/features/messages/api/use-get-messages';
import { ChannelReelsView } from '@/features/reels/components/channel-reels-view';
import { useChannelId } from '@/hooks/use-channel-id';
import { usePanel } from '@/hooks/use-panel';
import { isAmbientMessage } from '@/lib/video-parser';

import { ChatInput } from './chat-input';
import { Header } from './header';

const ChannelIdPage = () => {
  const channelId = useChannelId();
  const { onOpenMessage } = usePanel();

  const [activeTab, setActiveTab] = useState<'messages' | 'reels'>('messages');

  const { results, status, loadMore } = useGetMessages({ channelId });
  const { data: channel, isLoading: channelLoading } = useGetChannel({ id: channelId });

  // Regular conversation messages: ambient reels are excluded to prevent cluttering
  const chatMessages = useMemo(() => {
    if (!results) return [];
    return results.filter((msg) => !isAmbientMessage(msg.body));
  }, [results]);

  // Ambient reels for this channel
  const reelMessages = useMemo(() => {
    if (!results) return [];
    return results.filter((msg) => isAmbientMessage(msg.body));
  }, [results]);

  const reelsCount = reelMessages.length;

  if (channelLoading || status == 'LoadingFirstPage') {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-y-2">
        <TriangleAlert className="size-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Channel not found.</span>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <Header
        channelName={channel.name}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        reelsCount={reelsCount}
      />

      {activeTab === 'messages' && (
        <>
          <MessageList
            channelName={channel.name}
            channelCreationTime={channel._creationTime}
            data={chatMessages}
            loadMore={loadMore}
            isLoadingMore={status === 'LoadingMore'}
            canLoadMore={status === 'CanLoadMore'}
          />

          <ChatInput placeholder={`Message # ${channel.name}`} />
        </>
      )}

      {activeTab === 'reels' && (
        <>
          <ChannelReelsView
            channelName={channel.name}
            messages={reelMessages}
            onOpenThread={onOpenMessage}
          />

          <ChatInput placeholder={`Share a reel or short in #${channel.name} (paste link with optional comment)...`} />
        </>
      )}
    </div>
  );
};

export default ChannelIdPage;
