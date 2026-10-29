'use client';

import { Film, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AmbientVideoPlayer } from '@/components/ambient-video-player';
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
  isAmbient?: boolean;
}

export const ChannelReelsView = ({
  channelName,
  messages = [],
  onOpenThread,
  isMemberDm = false,
}: ChannelReelsViewProps) => {
  const { openReelsFeed } = useReelsFeedModal();

  const handleFocusInput = () => {
    const editor = document.querySelector('.ql-editor') as HTMLElement;
    if (editor) {
      editor.scrollIntoView({ behavior: 'smooth', block: 'center' });
      editor.focus();
      toast.info('Paste your video link below to share with Ambient Mode!');
    }
  };

  const reels: ParsedReelItem[] = useMemo(() => {
    if (!messages) return [];

    const items: ParsedReelItem[] = [];

    messages.forEach((msg) => {
      try {
        let plainText = msg.body;
        let isReelAmbient = true;
        try {
          const delta = JSON.parse(msg.body);
          if (delta && typeof delta === 'object') {
            if ('ambient' in delta && delta.ambient === false) {
              isReelAmbient = false;
            }
            if (delta.ops && Array.isArray(delta.ops)) {
              plainText = delta.ops.map((op: { insert?: string }) => op.insert || '').join('');
            }
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
              isAmbient: isReelAmbient,
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

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-background/50 p-4">
      {/* Empty State */}
      {reels.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-y-3 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <Film className="size-7" />
          </div>
          <h4 className="text-base font-semibold text-foreground">No Reels shared here yet</h4>
          <p className="max-w-xs text-xs text-muted-foreground">
            Paste a YouTube Short, Instagram Reel, TikTok, X (Twitter) video, or direct video link in the message box below to share with Ambient Mode.
          </p>
          <Button
            onClick={handleFocusInput}
            size="sm"
            className="mt-2 gap-x-1.5 bg-gradient-to-r from-pink-600 to-indigo-600 font-semibold text-white"
          >
            <Plus className="size-4" />
            <span>Share first Reel</span>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="mb-4 flex items-center justify-between px-1">
            <span className="text-xs font-medium text-muted-foreground">
              {reels.length} {reels.length === 1 ? 'reel' : 'reels'} shared
            </span>
            <Button
              size="sm"
              onClick={() => openReelsFeed(reels[0]?.video.id)}
              className="gap-x-1.5 bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 text-xs font-semibold text-white shadow-md shadow-pink-500/20 hover:from-pink-500 hover:to-purple-500"
            >
              <Film className="size-3.5" />
              <span>Watch Snap Feed</span>
            </Button>
          </div>

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
                  defaultAmbient={reel.isAmbient}
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
        </div>
      )}
    </div>
  );
};
