'use client';

import { useQueries, useQuery } from 'convex/react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Film,
  Heart,
  Loader,
  MessageCircle,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/hint';
import { useGetChannels } from '@/features/channels/api/use-get-channels';
import { useToggleReaction } from '@/features/reactions/api/use-toggle-reaction';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { isAmbientMessage, parseVideoUrl, type ParsedVideo } from '@/lib/video-parser';
import { notifyVideoPlay, pauseIframeElement, VIDEO_PLAY_EVENT, type VideoPlayEventDetail } from '@/lib/video-playback';
import { cn } from '@/lib/utils';

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

interface ReelFeedItemProps {
  reel: ReelItem;
  idx: number;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  isLiked: boolean;
  heartCount: number;
  onLike: () => void;
  onOpenThread?: (messageId: Id<'messages'>) => void;
  onCloseModal: () => void;
  onCopyLink: (url: string) => void;
  setRef: (el: HTMLDivElement | null) => void;
}

const getAutoplayEmbedUrl = (video: ParsedVideo, isMuted: boolean): string => {
  let url = video.embedUrl;

  if (video.platform === 'youtube_short' || video.platform === 'youtube_video') {
    url = url.replace('autoplay=0', 'autoplay=1');
    if (!url.includes('autoplay=')) {
      url += (url.includes('?') ? '&' : '?') + 'autoplay=1';
    }
    if (!url.includes('enablejsapi=')) {
      url += '&enablejsapi=1';
    }
    if (url.includes('mute=')) {
      url = url.replace(/mute=[01]/, `mute=${isMuted ? 1 : 0}`);
    } else {
      url += `&mute=${isMuted ? 1 : 0}`;
    }
  }

  return url;
};

const ReelFeedItem = ({
  reel,
  idx,
  isActive,
  isMuted,
  onToggleMute,
  isLiked,
  heartCount,
  onLike,
  onOpenThread,
  onCloseModal,
  onCopyLink,
  setRef,
}: ReelFeedItemProps) => {
  const playerId = `reel_${reel.messageId}`;
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Synchronize playback with isActive state
  useEffect(() => {
    if (isActive) {
      notifyVideoPlay(playerId);

      if (videoRef.current) {
        videoRef.current.muted = isMuted;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay might need mute
          });
        }
      }
    } else {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [isActive, isMuted, playerId]);

  // Synchronize mute state on active video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
    if (iframeRef.current && isActive) {
      try {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({
            event: 'command',
            func: isMuted ? 'mute' : 'unMute',
            args: [],
          }),
          '*',
        );
      } catch {
        // ignore
      }
    }
  }, [isMuted, isActive]);

  // Listen for global play events from other videos
  useEffect(() => {
    const handleOtherPlay = (e: Event) => {
      const detail = (e as CustomEvent<VideoPlayEventDetail>).detail;
      if (detail && detail.playerId !== playerId) {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
        if (iframeRef.current) {
          pauseIframeElement(iframeRef.current);
        }
      }
    };

    window.addEventListener(VIDEO_PLAY_EVENT, handleOtherPlay);
    return () => {
      window.removeEventListener(VIDEO_PLAY_EVENT, handleOtherPlay);
    };
  }, [playerId]);

  return (
    <div
      data-index={idx}
      ref={setRef}
      className="relative flex h-[86vh] min-h-[86vh] max-h-[800px] w-full shrink-0 snap-start snap-always items-center justify-center p-2"
    >
      <div className="relative size-full overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl">
        {/* Video Player: ONLY mounted when isActive is true! When inactive, no iframe/video exists -> 0% background sound */}
        {isActive ? (
          reel.video.platform === 'direct_video' ? (
            <div className="relative size-full bg-black">
              <video
                ref={videoRef}
                data-player-id={playerId}
                src={reel.video.embedUrl}
                controls
                loop
                autoPlay
                muted={isMuted}
                playsInline
                onPlay={() => notifyVideoPlay(playerId)}
                className="size-full object-contain"
              />
              <button
                type="button"
                onClick={onToggleMute}
                className="absolute top-4 left-4 z-20 rounded-full bg-black/60 p-2 text-white backdrop-blur-md hover:bg-black/80"
              >
                {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              data-player-id={playerId}
              src={getAutoplayEmbedUrl(reel.video, isMuted)}
              title={reel.video.platformName}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="size-full border-0"
              loading="eager"
            />
          )
        ) : (
          /* Inactive Reel Poster: NO video or iframe in DOM -> Impossible for multiple sounds to play! */
          <div className="relative size-full flex items-center justify-center bg-black">
            {reel.video.thumbnailUrl ? (
              <img
                src={reel.video.thumbnailUrl}
                alt={reel.caption || reel.video.platformName}
                className="size-full object-cover opacity-60"
              />
            ) : (
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-b opacity-40',
                  reel.video.accentGradient,
                )}
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-3">
              <div className="flex size-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-md text-white shadow-xl">
                <Film className="size-7 text-white/80" />
              </div>
              <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur-md">
                {reel.video.platformName}
              </span>
            </div>
          </div>
        )}

        {/* Bottom Metadata Overlay */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-16 z-20 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-4 text-white">
          <div className="pointer-events-auto flex items-center gap-x-2">
            <Avatar className="size-7 ring-2 ring-white/20">
              <AvatarImage src={reel.authorImage} />
              <AvatarFallback className="text-xs">
                {reel.authorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold truncate">{reel.authorName}</span>
            <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white/80">
              {reel.video.platformName}
            </span>
          </div>

          {reel.caption && (
            <p className="mt-1.5 line-clamp-2 text-xs text-white/90 drop-shadow-md">
              {reel.caption}
            </p>
          )}
        </div>

        {/* Floating Actions on the Right (Like, Comment, Share, Link) */}
        <div className="absolute bottom-6 right-3 z-30 flex flex-col items-center gap-y-3.5">
          {/* Heart / Like Button */}
          <button
            type="button"
            onClick={onLike}
            className="group flex flex-col items-center gap-y-0.5"
          >
            <div
              className={cn(
                'flex size-11 items-center justify-center rounded-full bg-black/55 backdrop-blur-md transition group-hover:scale-110 active:scale-90',
                isLiked ? 'text-rose-500' : 'text-white group-hover:text-rose-400',
              )}
            >
              <Heart className={cn('size-6', isLiked && 'fill-current animate-bounce')} />
            </div>
            {heartCount > 0 && (
              <span className="text-xs font-semibold text-white drop-shadow-md">
                {heartCount}
              </span>
            )}
          </button>

          {/* Comment Thread Button */}
          <button
            type="button"
            onClick={() => {
              onCloseModal();
              if (onOpenThread) {
                onOpenThread(reel.messageId);
              }
            }}
            className="group flex flex-col items-center gap-y-0.5"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition group-hover:scale-110 group-hover:text-pink-400 active:scale-90">
              <MessageCircle className="size-6" />
            </div>
            {reel.threadCount > 0 && (
              <span className="text-xs font-semibold text-white drop-shadow-md">
                {reel.threadCount}
              </span>
            )}
          </button>

          {/* Share Link Button */}
          <button
            type="button"
            onClick={() => onCopyLink(reel.video.originalUrl)}
            className="group flex flex-col items-center gap-y-0.5"
            title="Copy video link"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition group-hover:scale-110 group-hover:text-indigo-400 active:scale-90">
              <Share2 className="size-4" />
            </div>
            <span className="text-[9px] text-white/70">Share</span>
          </button>

          {/* External Link Button */}
          <a
            href={reel.video.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-y-0.5"
            title="Open on original platform"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-black/55 text-white/80 backdrop-blur-md transition group-hover:scale-110 group-hover:text-white active:scale-90">
              <ExternalLink className="size-4" />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

interface ReelsFeedModalProps {
  onOpenThread?: (messageId: Id<'messages'>) => void;
}

export const ReelsFeedModal = ({ onOpenThread }: ReelsFeedModalProps) => {
  const { isOpen, closeReelsFeed, initialVideoUrl, channelId: modalChannelId } = useReelsFeedModal();
  const workspaceId = useWorkspaceId();

  // 1. Fetch all channels in workspace
  const { data: channels, isLoading: channelsLoading } = useGetChannels({ workspaceId });

  // 2. Fetch all DM conversations for the current user
  const allConversations = useQuery(api.conversations.getAllForCurrentUser);
  const userDms = useMemo(() => {
    return (allConversations || []).filter((dm) => dm.workspaceId === workspaceId);
  }, [allConversations, workspaceId]);

  // 3. Build multi-query map for all channels and DMs
  const queries = useMemo(() => {
    const qMap: Record<string, { query: typeof api.messages.get; args: any }> = {};

    if (modalChannelId) {
      qMap[`ch_${modalChannelId}`] = {
        query: api.messages.get,
        args: {
          channelId: modalChannelId as Id<'channels'>,
          paginationOpts: { numItems: 60, cursor: null },
        },
      };
      return qMap;
    }

    // Include all channels in the workspace
    (channels || []).forEach((c) => {
      qMap[`ch_${c._id}`] = {
        query: api.messages.get,
        args: {
          channelId: c._id,
          paginationOpts: { numItems: 40, cursor: null },
        },
      };
    });

    // Include all user DMs in the workspace
    (userDms || []).forEach((dm) => {
      qMap[`dm_${dm.conversationId}`] = {
        query: api.messages.get,
        args: {
          conversationId: dm.conversationId as Id<'conversations'>,
          paginationOpts: { numItems: 40, cursor: null },
        },
      };
    });

    return qMap;
  }, [modalChannelId, channels, userDms]);

  const queryResults = useQueries(queries);
  const { mutate: toggleReaction } = useToggleReaction();

  const [activeIndex, setActiveIndex] = useState(0);
  const [ambientGlow, setAmbientGlow] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Collect and deduplicate all messages across channels and DMs
  const reels: ReelItem[] = useMemo(() => {
    if (!queryResults) return [];

    const rawList: any[] = [];
    Object.values(queryResults).forEach((res) => {
      if (res && typeof res === 'object' && 'page' in res && Array.isArray((res as any).page)) {
        rawList.push(...(res as any).page);
      }
    });

    // Sort newest first
    rawList.sort((a, b) => (b._creationTime || 0) - (a._creationTime || 0));

    const seenMessageIds = new Set<string>();
    const items: ReelItem[] = [];

    rawList.forEach((msg) => {
      if (seenMessageIds.has(msg._id)) return;
      seenMessageIds.add(msg._id);

      try {
        let plainText = msg.body;
        try {
          const delta = JSON.parse(msg.body);
          if (delta && typeof delta === 'object' && delta.ops && Array.isArray(delta.ops)) {
            plainText = delta.ops
              .map((op: { insert?: string }) => (typeof op.insert === 'string' ? op.insert : ''))
              .join('');
          }
        } catch {
          // not JSON
        }

        const urls = plainText.match(/https?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g) || [];
        for (const url of urls) {
          const parsed = parseVideoUrl(url);
          if (parsed && (parsed.isVertical || isAmbientMessage(msg.body))) {
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
  }, [queryResults]);

  const scrollToReel = useCallback(
    (index: number) => {
      if (index < 0 || index >= reels.length) return;
      const targetEl = reelRefs.current[index];
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [reels.length],
  );

  // Real-time scroll handler to immediately switch active index and mute/pause other reels
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || reels.length === 0) return;

    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;
    if (clientHeight > 0) {
      const idx = Math.round(scrollTop / clientHeight);
      if (idx >= 0 && idx < reels.length && idx !== activeIndex) {
        setActiveIndex(idx);
      }
    }
  }, [reels.length, activeIndex]);

  // Jump to initial video if specified
  useEffect(() => {
    if (initialVideoUrl && reels.length > 0) {
      const idx = reels.findIndex(
        (r) =>
          r.video.originalUrl === initialVideoUrl ||
          r.video.id === initialVideoUrl ||
          r.messageId === initialVideoUrl,
      );
      if (idx !== -1) {
        setActiveIndex(idx);
        setTimeout(() => {
          reelRefs.current[idx]?.scrollIntoView({ behavior: 'auto', block: 'center' });
        }, 100);
      }
    }
  }, [initialVideoUrl, reels]);

  // IntersectionObserver to detect currently active centered reel during scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || reels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idx = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(idx)) {
              setActiveIndex(idx);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.5,
      },
    );

    const elements = container.querySelectorAll('[data-index]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [reels]);

  // Keyboard navigation (ArrowUp, ArrowDown, j, k, M, L, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeReelsFeed();
      } else if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToReel(activeIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToReel(activeIndex - 1);
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        const item = reels[activeIndex];
        if (item) {
          handleLike(item);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, reels, activeIndex, closeReelsFeed, scrollToReel]);

  if (!isOpen) return null;

  const currentReel = reels[activeIndex];
  const isLoading = channelsLoading || (allConversations === undefined && Object.keys(queries).length === 0);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-200">
      {/* Dynamic Background Ambient Aura */}
      {ambientGlow && currentReel && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 -z-10 opacity-35 blur-3xl transition-all duration-700',
            currentReel.video.platform === 'youtube_short' && 'bg-gradient-to-tr from-red-600/50 via-rose-500/40 to-amber-500/30',
            currentReel.video.platform === 'youtube_video' && 'bg-gradient-to-tr from-red-600/40 via-orange-500/30 to-amber-500/20',
            currentReel.video.platform === 'instagram_reel' && 'bg-gradient-to-tr from-purple-600/50 via-pink-600/40 to-amber-500/40',
            currentReel.video.platform === 'tiktok' && 'bg-gradient-to-tr from-cyan-400/50 via-pink-500/40 to-slate-900/30',
            currentReel.video.platform === 'x_video' && 'bg-gradient-to-tr from-sky-400/50 via-blue-600/40 to-indigo-950/30',
            currentReel.video.platform === 'direct_video' && 'bg-gradient-to-tr from-violet-600/50 via-purple-500/40 to-indigo-500/30',
          )}
        />
      )}

      {/* Top Header Bar */}
      <div className="absolute top-4 left-6 right-6 z-50 flex items-center justify-between text-white">
        <div className="flex items-center gap-x-2.5">
          <Film className="size-5 text-pink-500 animate-pulse" />
          <h1 className="text-base font-bold tracking-tight">Reels & Shorts Feed</h1>
          {reels.length > 0 && (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/70 font-medium">
              {activeIndex + 1} of {reels.length}
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
                ambientGlow ? 'bg-pink-500/25 text-pink-300 ring-1 ring-pink-500/40' : 'bg-white/10 hover:bg-white/20',
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

      {/* Main Body */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-y-3 text-white">
          <Loader className="size-8 animate-spin text-pink-500" />
          <p className="text-sm text-white/60">Loading reels & shorts from your channels & DMs...</p>
        </div>
      ) : reels.length === 0 ? (
        <div className="flex flex-col items-center gap-y-4 px-6 text-center text-white">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 text-pink-400 ring-1 ring-pink-500/30">
            <Film className="size-8" />
          </div>
          <h2 className="text-xl font-bold">No Reels in your channels or DMs yet</h2>
          <p className="max-w-sm text-sm text-white/60">
            Share a YouTube Short, Instagram Reel, TikTok, or X (Twitter) video in Ambient Mode to start building your video feed.
          </p>
          <Button
            onClick={closeReelsFeed}
            className="bg-gradient-to-r from-pink-600 to-indigo-600 font-semibold text-white hover:from-pink-500 hover:to-indigo-500"
          >
            Back to Chat
          </Button>
        </div>
      ) : (
        <div className="relative flex items-center justify-center">
          {/* Infinite Vertical Snap-Scroll Reel Feed Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="relative flex h-[86vh] max-h-[800px] w-full max-w-[400px] flex-col overflow-y-scroll snap-y snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {reels.map((reel, idx) => {
              const isActive = activeIndex === idx;
              const isLiked = likedMap[reel.messageId];
              const heartCount =
                (reel.reactions.find((r) => r.value === '❤️')?.count ?? 0) +
                (isLiked ? 1 : 0);

              return (
                <ReelFeedItem
                  key={reel.messageId}
                  reel={reel}
                  idx={idx}
                  isActive={isActive}
                  isMuted={isMuted}
                  onToggleMute={() => setIsMuted((v) => !v)}
                  isLiked={isLiked}
                  heartCount={heartCount}
                  onLike={() => handleLike(reel)}
                  onOpenThread={onOpenThread}
                  onCloseModal={closeReelsFeed}
                  onCopyLink={handleCopyLink}
                  setRef={(el) => {
                    reelRefs.current[idx] = el;
                  }}
                />
              );
            })}
          </div>

          {/* Floating Up & Down Chevrons on Desktop */}
          <div className="absolute right-[-62px] top-1/2 hidden -translate-y-1/2 flex-col gap-y-3 md:flex">
            <Button
              variant="ghost"
              size="icon"
              disabled={activeIndex === 0}
              onClick={() => scrollToReel(activeIndex - 1)}
              className="size-10 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 disabled:opacity-30"
              title="Previous Reel (Up Arrow / k)"
            >
              <ChevronUp className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={activeIndex >= reels.length - 1}
              onClick={() => scrollToReel(activeIndex + 1)}
              className="size-10 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 disabled:opacity-30"
              title="Next Reel (Down Arrow / j)"
            >
              <ChevronDown className="size-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
