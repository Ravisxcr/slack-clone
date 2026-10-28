'use client';

import { Loader, TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';

import { MessageList } from '@/components/message-list';
import { useGetChannel } from '@/features/channels/api/use-get-channel';
import { useGetMessages } from '@/features/messages/api/use-get-messages';
import { useChatTabs } from '@/features/tabs/store/use-chat-tabs';
import { useChannelId } from '@/hooks/use-channel-id';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

import { ChatInput } from './chat-input';
import { Header } from './header';

const ChannelIdPage = () => {
  const channelId = useChannelId();
  const workspaceId = useWorkspaceId();
  const { addOrFocusTab } = useChatTabs();

  const { results, status, loadMore } = useGetMessages({ channelId });
  const { data: channel, isLoading: channelLoading } = useGetChannel({ id: channelId });

  useEffect(() => {
    if (channel) {
      addOrFocusTab({
        id: channel._id,
        type: 'channel',
        name: channel.name,
        path: `/workspace/${workspaceId}/channel/${channel._id}`,
      });
    }
  }, [channel?._id, channel?.name, workspaceId, addOrFocusTab]);

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
      <Header channelName={channel.name} />

      <MessageList
        channelName={channel.name}
        channelCreationTime={channel._creationTime}
        data={results}
        loadMore={loadMore}
        isLoadingMore={status === 'LoadingMore'}
        canLoadMore={status === 'CanLoadMore'}
      />

      <ChatInput placeholder={`Message # ${channel.name}`} />
    </div>
  );
};

export default ChannelIdPage;
