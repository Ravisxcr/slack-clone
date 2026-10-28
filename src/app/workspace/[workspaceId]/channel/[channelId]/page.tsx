'use client';

import { Loader, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';

import { MessageList } from '@/components/message-list';
import { useGetChannel } from '@/features/channels/api/use-get-channel';
import { useCreateMessage } from '@/features/messages/api/use-create-message';
import { useGetMessages } from '@/features/messages/api/use-get-messages';
import { ChannelReelsView } from '@/features/reels/components/channel-reels-view';
import { useChannelId } from '@/hooks/use-channel-id';
import { usePanel } from '@/hooks/use-panel';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { parseVideoUrl } from '@/lib/video-parser';

import { ChatInput } from './chat-input';
import { Header } from './header';

const ChannelIdPage = () => {
  const channelId = useChannelId();
  const workspaceId = useWorkspaceId();
  const { onOpenMessage } = usePanel();

  const [activeTab, setActiveTab] = useState<'messages' | 'reels'>('messages');

  const { results, status, loadMore } = useGetMessages({ channelId });
  const { data: channel, isLoading: channelLoading } = useGetChannel({ id: channelId });
  const { mutate: createMessage } = useCreateMessage();

  const handleSendReelMessage = (text: string) => {
    createMessage({
      channelId,
      workspaceId,
      body: JSON.stringify({ ops: [{ insert: text + '\n' }] }),
    });
  };

  // Count vertical reels in this channel
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
    <div className="flex h-full flex-col">
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
            data={results}
            loadMore={loadMore}
            isLoadingMore={status === 'LoadingMore'}
            canLoadMore={status === 'CanLoadMore'}
          />

          <ChatInput placeholder={`Message # ${channel.name}`} />
        </>
      )}

      {activeTab === 'reels' && (
        <ChannelReelsView
          channelName={channel.name}
          messages={results}
          onOpenThread={onOpenMessage}
          onSendMessage={handleSendReelMessage}
        />
      )}
    </div>
  );
};

export default ChannelIdPage;
