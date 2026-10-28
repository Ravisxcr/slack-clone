'use client';

import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Film,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/hint';
import { useGetMessages } from '@/features/messages/api/use-get-messages';
import { useToggleReaction } from '@/features/reactions/api/use-toggle-reaction';
import { useChannelId } from '@/hooks/use-channel-id';
import { parseVideoUrl, type ParsedVideo } from '@/lib/video-parser';
import { cn } from '@/lib/utils';
import type { Id } from '@/../convex/_generated/dataModel';

import { useReelsFeedModal } from '../store/use-reels-feed-modal';

interface ReelItem {
  messageId: Id<'messages'>;
  video: ParsedVideo;
  authorName: string;
  authorImage?: string;
  caption?: string;
  reactions: Array<{ value: string; count: number }>;
  threadCount: number;
}

interface ReelsFeedModalProps {
  onOpenThread?: (messageId: Id<'messages'>) => void;
}

export const ReelsFeedModal = ({ onOpenThread }: ReelsFeedModalProps) => {
  const { isOpen, closeReelsFeed, initialVideoUrl, channelId: modalChannelId } = useReelsFeedModal();
  const currentChannelId = useChannelId();
  const channelId = modalChannelId || currentChannelId;

  const { results: messages } = useGetMessages({ channelId: channelId as Id<'channels'> });
  const { mutate: toggleReaction } = useToggleReaction();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [ambientGlow, setAmbientGlow] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  // Extract all reels from messages
  const reels: ReelItem[] = useMemo(() => {
    if (!messages) return [];

    const items: ReelItem[] = [];

    messages.forEach((msg) => {
      try {
        let plainText = msg.body;
        // Parse Quill delta if JSON
        try {
          const delta = JSON.parse(msg.body);
          if (delta.ops && Array.isArray(delta.ops)) {
            plainText = delta.ops.map((op: { insert?: string }) => op.insert || '').join('');
          }
        } catch {
          // not JSON, use as-is
        }

        const urls = plainText.match(/https?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g) || [];
        for (const url of urls) {
          const parsed = parseVideoUrl(url);
          if (parsed && parsed.isVertical) {
            // Found a vertical reel / short!
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
            break; // take first reel per message
          }
        }
      } catch {
        // ignore malformed
      }
    });

    return items;
  }, [messages]);

  // Jump to initial video if specified
  useEffect(() => {
    if (initialVideoUrl && reels.length > 0) {
      const idx = reels.findIndex((r) => r.video.originalUrl === initialVideoUrl || r.video.id === initialVideoUrl);
      if (idx !== -1) {
        setCurrentIndex(idx);
      }
    }
  }, [initialVideoUrl, reels]);

  // Keyboard navigation (ArrowUp, ArrowDown, Escape, M, L)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeReelsFeed();
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(prev + 1, reels.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, reels.length, closeReelsFeed]);

  if (!isOpen) return null;

  const currentReel = reels[currentIndex];

  const handleLike = (item: ReelItem) => {
    const isLiked = !likedMap[item.messageId];
    setLikedMap((prev) => ({ ...prev, [item.messageId]: isLiked }));

    toggleReaction({
      messageId: item.messageId,
      value: '❤️',
    });
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Reel link copied!'))
      .catch(() => toast.error('Failed to copy link.'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Background Ambient Aura based on current reel */}
      {ambientGlow && currentReel && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 -z-10 opacity-30 blur-3xl transition-all duration-1000',
            currentReel.video.platform === 'youtube_short' && 'bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500',
            currentReel.video.platform === 'instagram_reel' && 'bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500',
            currentReel.video.platform === 'tiktok' && 'bg-gradient-to-tr from-cyan-400 via-pink-500 to-slate-900',
            currentReel.video.platform === 'direct_video' && 'bg-gradient-to-tr from-violet-600 via-purple-500 to-indigo-500',
          )}
        />
      )}

      {/* Top Header Bar */}
      <div className="absolute top-4 left-6 right-6 z-50 flex items-center justify-between text-white">
        <div className="flex items-center gap-x-2">
          <Film className="size-5 text-pink-500 animate-pulse" />
          <h1 className="text-base font-bold tracking-tight">Reels & Shorts Feed</h1>
          {reels.length > 0 && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
              {currentIndex + 1} of {reels.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-x-2">
          <Hint label={ambientGlow ? 'Turn off ambient glow' : 'Turn on ambient glow'}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAmbientGlow((v) => !v)}
              className={cn(
                'h-8 gap-x-1.5 rounded-full px-3 text-xs font-medium text-white transition',
                ambientGlow ? 'bg-pink-500/20 text-pink-300 ring-1 ring-pink-500/40' : 'bg-white/10 hover:bg-white/20',
              )}
            >
              <Sparkles className="size-3.5" />
              <span>Ambient</span>
            </Button>
          </Hint>

          <Button
            variant="ghost"
            size="icon"
            onClick={closeReelsFeed}
            className="size-8 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Feed Container */}
      {reels.length === 0 ? (
        <div className="flex flex-col items-center gap-y-4 px-6 text-center text-white">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 text-pink-400 ring-1 ring-pink-500/30">
            <Film className="size-8" />
          </div>
          <h2 className="text-xl font-bold">No Reels in this channel yet</h2>
          <p className="max-w-sm text-sm text-white/60">
            Share a YouTube Short, Instagram Reel, or TikTok in Ambient Mode to start building your video feed.
          </p>
          <Button
            onClick={closeReelsFeed}
            className="bg-gradient-to-r from-pink-600 to-indigo-600 font-semibold text-white hover:from-pink-500 hover:to-indigo-500"
          >
            Back to Chat
          </Button>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="relative flex h-[82vh] max-h-[750px] w-full max-w-[390px] items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl"
        >
          {/* Active Reel Player */}
          {currentReel && (
            <div className="relative size-full bg-black">
              {currentReel.video.platform === 'direct_video' ? (
                <div className="relative size-full">
                  <video
                    src={currentReel.video.embedUrl}
                    controls
                    loop
                    autoPlay
                    muted={isMuted}
                    playsInline
                    className="size-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMuted((v) => !v)}
                    className="absolute top-4 left-4 z-20 rounded-full bg-black/60 p-2 text-white backdrop-blur-md hover:bg-black/80"
                  >
                    {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                  </button>
                </div>
              ) : (
                <iframe
                  src={currentReel.video.embedUrl}
                  title={currentReel.video.platformName}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="size-full border-0"
                />
              )}

              {/* Reel Metadata Overlay (Bottom Left) */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-16 z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 text-white">
                <div className="pointer-events-auto flex items-center gap-x-2">
                  <Avatar className="size-7 ring-2 ring-white/20">
                    <AvatarImage src={currentReel.authorImage} />
                    <AvatarFallback className="text-xs">
                      {currentReel.authorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold">{currentReel.authorName}</span>
                  <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] text-white/80">
                    {currentReel.video.platformName}
                  </span>
                </div>

                {currentReel.caption && (
                  <p className="mt-1.5 line-clamp-2 text-xs text-white/90 drop-shadow-md">
                    {currentReel.caption}
                  </p>
                )}
              </div>

              {/* Floating Social Actions (Right Side) */}
              <div className="absolute bottom-6 right-3 z-30 flex flex-col items-center gap-y-4">
                {/* Heart Button */}
                <button
                  type="button"
                  onClick={() => handleLike(currentReel)}
                  className="group flex flex-col items-center gap-y-1"
                >
                  <div
                    className={cn(
                      'flex size-11 items-center justify-center rounded-full bg-black/50 backdrop-blur-md transition group-hover:scale-110 active:scale-90',
                      likedMap[currentReel.messageId] ? 'text-rose-500' : 'text-white group-hover:text-rose-400',
                    )}
                  >
                    <Heart
                      className={cn(
                        'size-6',
                        likedMap[currentReel.messageId] && 'fill-current animate-bounce',
                      )}
                    />
                  </div>
                  <span className="text-xs font-semibold text-white drop-shadow-md">
                    {(currentReel.reactions.find((r) => r.value === '❤️')?.count ?? 0) +
                      (likedMap[currentReel.messageId] ? 1 : 0)}
                  </span>
                </button>

                {/* Comment Button */}
                <button
                  type="button"
                  onClick={() => {
                    closeReelsFeed();
                    if (onOpenThread) {
                      onOpenThread(currentReel.messageId);
                    }
                  }}
                  className="group flex flex-col items-center gap-y-1"
                >
                  <div className="flex size-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition group-hover:scale-110 group-hover:text-pink-400 active:scale-90">
                    <MessageCircle className="size-6" />
                  </div>
                  <span className="text-xs font-semibold text-white drop-shadow-md">
                    {currentReel.threadCount}
                  </span>
                </button>

                {/* Share Link Button */}
                <button
                  type="button"
                  onClick={() => handleCopyLink(currentReel.video.originalUrl)}
                  className="group flex flex-col items-center gap-y-1"
                  title="Copy video link"
                >
                  <div className="flex size-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition group-hover:scale-110 group-hover:text-indigo-400 active:scale-90">
                    <Share2 className="size-5" />
                  </div>
                  <span className="text-[10px] text-white/70">Share</span>
                </button>

                {/* External Link Button */}
                <a
                  href={currentReel.video.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-y-1"
                  title="Open on original platform"
                >
                  <div className="flex size-11 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-md transition group-hover:scale-110 group-hover:text-white active:scale-90">
                    <ExternalLink className="size-5" />
                  </div>
                </a>
              </div>
            </div>
          )}

          {/* Up & Down Scroll Arrows (Floating) */}
          <div className="absolute right-[-60px] top-1/2 hidden -translate-y-1/2 flex-col gap-y-3 sm:flex">
            <Button
              variant="ghost"
              size="icon"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              className="size-10 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 disabled:opacity-30"
              title="Previous Reel (Up Arrow)"
            >
              <ChevronUp className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={currentIndex >= reels.length - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, reels.length - 1))}
              className="size-10 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 disabled:opacity-30"
              title="Next Reel (Down Arrow)"
            >
              <ChevronDown className="size-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

