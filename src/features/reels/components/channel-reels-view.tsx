'use client';

import { ExternalLink, Film, Heart, MessageCircle, Plus, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AmbientVideoPlayer } from '@/components/ambient-video-player';
import { AmbientShareModal } from '@/features/reels/components/ambient-share-modal';
import { useReelsFeedModal } from '@/features/reels/store/use-reels-feed-modal';
import { parseVideoUrl, type ParsedVideo } from '@/lib/video-parser';
import type { Id } from '@/../convex/_generated/dataModel';

interface ChannelReelsViewProps {
  channelName: string;
  messages: Array<{
    _id: Id<'messages'>;
    body: string;
    _creationTime: number;
    user?: {
      name?: string;
      image?: string;
    };
    reactions?: Array<{ value: string; count: number }>;
    threadCount?: number;
  }>;
  onOpenThread?: (messageId: Id<'messages'>) => void;
  onSendMessage?: (text: string) => void;
  isMemberDm?: boolean;
}

interface ParsedReelItem {
  messageId: Id<'messages'>;
  video: ParsedVideo;
  authorName: string;
  authorImage?: string;
  caption?: string;
  reactions: Array<{ value: string; count: number }>;
  threadCount: number;
}

export const ChannelReelsView = ({
  channelName,
  messages = [],
  onOpenThread,
  onSendMessage,
  isMemberDm = false,
}: ChannelReelsViewProps) => {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const { openReelsFeed } = useReelsFeedModal();

  const reels: ParsedReelItem[] = useMemo(() => {
    if (!messages) return [];

    const items: ParsedReelItem[] = [];

    messages.forEach((msg) => {
      try {
        let plainText = msg.body;
        try {
          const delta = JSON.parse(msg.body);
          if (delta.ops && Array.isArray(delta.ops)) {
            plainText = delta.ops.map((op: { insert?: string }) => op.insert || '').join('');
          }
        } catch {
          // not JSON
        }

        const urls = plainText.match(/https?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g) || [];
        for (const url of urls) {
          const parsed = parseVideoUrl(url);
          if (parsed && parsed.isVertical) {
            const caption = plainText.replace(url, '').trim();
            items.push({
              messageId: msg._id,
              video: parsed,
              authorName: msg.user?.name ?? 'Member',
              authorImage: msg.user?.image,
              caption: caption || undefined,
              reactions: msg.reactions || [],
              threadCount: msg.threadCount || 0,
            });
            break;
          }
        }
      } catch {
        // ignore malformed
      }
    });

    return items;
  }, [messages]);

  const handleShare = (formattedText: string) => {
    if (onSendMessage) {
      onSendMessage(formattedText);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-background/50 p-4">
      {onSendMessage && (
        <AmbientShareModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          onShare={handleShare}
        />
      )}

      {/* Top Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-pink-500/20 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 p-4 backdrop-blur-md">
        <div className="flex items-center gap-x-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-500">
            <Film className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {isMemberDm ? `Reels with ${channelName}` : `Reels in #${channelName}`}
            </h3>
            <p className="text-xs text-muted-foreground">
              {reels.length} {reels.length === 1 ? 'reel' : 'reels'} shared with ambient lighting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-x-2">
          {reels.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openReelsFeed(reels[0]?.video.id)}
              className="gap-x-1.5 border-pink-500/30 text-xs font-semibold text-pink-600 hover:bg-pink-500/10 dark:text-pink-400"
            >
              <Film className="size-3.5" />
              <span>Full Feed</span>
            </Button>
          )}

          {onSendMessage && (
            <Button
              size="sm"
              onClick={() => setShareModalOpen(true)}
              className="gap-x-1.5 bg-gradient-to-r from-pink-600 to-indigo-600 text-xs font-semibold text-white shadow-sm hover:from-pink-500 hover:to-indigo-500"
            >
              <Sparkles className="size-3.5" />
              <span>Share Reel</span>
            </Button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {reels.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-y-3 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <Film className="size-7" />
          </div>
          <h4 className="text-base font-semibold text-foreground">No Reels shared here yet</h4>
          <p className="max-w-xs text-xs text-muted-foreground">
            Paste a YouTube Short, Instagram Reel, or TikTok in this channel, or click below to share with Ambient Mode.
          </p>
          {onSendMessage && (
            <Button
              onClick={() => setShareModalOpen(true)}
              size="sm"
              className="mt-2 gap-x-1.5 bg-gradient-to-r from-pink-600 to-indigo-600 font-semibold text-white"
            >
              <Plus className="size-4" />
              <span>Share first Reel</span>
            </Button>
          )}
        </div>
      ) : (
        /* Reels Grid / Feed */
        <div className="flex flex-wrap items-start justify-center gap-6 sm:justify-start">
          {reels.map((reel) => (
            <div key={reel.messageId} className="flex flex-col">
              <div className="mb-2 flex items-center gap-x-2 px-1">
                <Avatar className="size-6">
                  <AvatarImage src={reel.authorImage} />
                  <AvatarFallback className="text-[10px]">
                    {reel.authorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-xs font-semibold text-foreground">
                  {reel.authorName}
                </span>
              </div>

              <AmbientVideoPlayer
                video={reel.video}
                onOpenThread={onOpenThread ? () => onOpenThread(reel.messageId) : undefined}
                threadCount={reel.threadCount}
                reactions={reel.reactions}
                onOpenReelsFeed={() => openReelsFeed(reel.video.id)}
              />

              {reel.caption && (
                <p className="mt-1 max-w-[340px] px-1 text-xs text-muted-foreground">
                  {reel.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
