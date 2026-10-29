'use client';

import { ExternalLink, Film, Heart, MessageCircle, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Hint } from '@/components/hint';
import { useReelsFeedModal } from '@/features/reels/store/use-reels-feed-modal';
import { type ParsedVideo } from '@/lib/video-parser';
import { notifyVideoPlay, pauseIframeElement, VIDEO_PLAY_EVENT, type VideoPlayEventDetail } from '@/lib/video-playback';
import { cn } from '@/lib/utils';

interface AmbientVideoPlayerProps {
  video: ParsedVideo;
  onOpenThread?: () => void;
  threadCount?: number;
  onToggleReaction?: (value: string) => void;
  reactions?: Array<{ value: string; count: number }>;
  onOpenReelsFeed?: (initialVideoId?: string) => void;
  className?: string;
  defaultAmbient?: boolean;
}

export const AmbientVideoPlayer = ({
  video,
  onOpenThread,
  threadCount = 0,
  onToggleReaction,
  reactions = [],
  onOpenReelsFeed,
  className,
  defaultAmbient = true,
}: AmbientVideoPlayerProps) => {
  const [ambientMode, setAmbientMode] = useState(defaultAmbient);
  const [liked, setLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Stable unique player ID to coordinate playback with all other players
  const playerIdRef = useRef<string>(`player_${video.platform}_${video.id}_${Math.random().toString(36).slice(2, 9)}`);
  const playerId = playerIdRef.current;

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // If the fullscreen Reels Feed Modal opens, immediately pause any background message video
  const { isOpen: isReelsModalOpen } = useReelsFeedModal();
  useEffect(() => {
    if (isReelsModalOpen) {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      if (iframeRef.current) {
        pauseIframeElement(iframeRef.current);
      }
    }
  }, [isReelsModalOpen]);

  // When another video begins playing elsewhere, pause this video immediately
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

  // Detect when user interacts with or plays the iframe
  useEffect(() => {
    const handleBlur = () => {
      setTimeout(() => {
        if (document.activeElement === iframeRef.current) {
          notifyVideoPlay(playerId);
        }
      }, 50);
    };

    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [playerId]);

  // Check if user reacted with heart
  const heartReaction = reactions.find((r) => r.value === '❤️' || r.value === 'heart');
  const heartCount = (heartReaction?.count ?? 0) + (liked && !heartReaction ? 1 : 0);

  const handleHeartClick = () => {
    setLiked((prev) => !prev);
    if (onToggleReaction) {
      onToggleReaction('❤️');
    }
  };

  const isVertical = video.isVertical;

  return (
    <div className={cn('relative my-3 flex flex-col', className)}>
      {/* Ambient Lighting Bleed Halo */}
      {ambientMode && (
        <div
          className={cn(
            'pointer-events-none absolute -inset-3 -z-10 rounded-3xl opacity-60 blur-2xl transition-all duration-700',
            video.platform === 'youtube_short' && 'bg-gradient-to-tr from-red-600/50 via-rose-500/40 to-amber-500/30',
            video.platform === 'youtube_video' && 'bg-gradient-to-tr from-red-600/40 via-orange-500/30 to-amber-500/20',
            video.platform === 'instagram_reel' && 'bg-gradient-to-tr from-purple-600/50 via-pink-600/40 to-amber-500/40',
            video.platform === 'tiktok' && 'bg-gradient-to-tr from-cyan-400/50 via-pink-500/40 to-slate-900/30',
            video.platform === 'x_video' && 'bg-gradient-to-tr from-sky-400/50 via-blue-600/40 to-indigo-950/30',
            video.platform === 'direct_video' && 'bg-gradient-to-tr from-violet-600/50 via-purple-500/40 to-indigo-500/30',
          )}
        />
      )}

      {/* Main Video Card Container */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-md transition-all',
          isVertical ? 'w-full max-w-[340px]' : 'w-full max-w-[560px]',
        )}
      >
        {/* Top Header / Ambient Mode Toggle & Platform Badge */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-black/80 via-black/40 to-black/80 px-3 py-2 text-xs backdrop-blur-sm">
          <div className="flex items-center gap-x-1.5">
            <span
              className={cn(
                'size-2 rounded-full animate-pulse',
                video.platform === 'youtube_short' && 'bg-red-500',
                video.platform === 'youtube_video' && 'bg-red-500',
                video.platform === 'instagram_reel' && 'bg-pink-500',
                video.platform === 'tiktok' && 'bg-cyan-400',
                video.platform === 'x_video' && 'bg-sky-400',
                video.platform === 'direct_video' && 'bg-purple-500',
              )}
            />
            <span className="font-semibold text-white/90">{video.platformName}</span>
          </div>

          <div className="flex items-center gap-x-1">
            <Hint label={ambientMode ? 'Disable ambient lighting' : 'Enable ambient glow'}>
              <button
                type="button"
                onClick={() => setAmbientMode((prev) => !prev)}
                className={cn(
                  'flex items-center gap-x-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all select-none',
                  ambientMode
                    ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40'
                    : 'bg-white/10 text-white/60 hover:text-white',
                )}
              >
                <Sparkles className="size-3" />
                <span>Ambient</span>
              </button>
            </Hint>

            <a
              href={video.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
              title="Open original video"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>

        {/* Video Player Display */}
        <div className={cn('relative w-full bg-black', isVertical ? 'aspect-[9/16]' : 'aspect-video')}>
          {video.platform === 'direct_video' ? (
            <div className="relative size-full">
              <video
                ref={videoRef}
                data-player-id={playerId}
                src={video.embedUrl}
                controls
                loop
                muted={isMuted}
                playsInline
                onPlay={() => notifyVideoPlay(playerId)}
                className="size-full object-contain"
              />
              <button
                type="button"
                onClick={() => setIsMuted((v) => !v)}
                className="absolute bottom-3 right-3 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-md hover:bg-black/80"
              >
                {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              data-player-id={playerId}
              src={video.embedUrl}
              title={video.platformName}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="size-full border-0"
              loading="lazy"
            />
          )}

          {/* Quick Floating Action Overlay (Right Side - Like TikTok/Instagram) */}
          <div className="pointer-events-none absolute bottom-4 right-2.5 z-20 flex flex-col items-center gap-y-3">
            {/* Heart / Like Button */}
            <Hint label="Like video" side="left">
              <button
                type="button"
                onClick={handleHeartClick}
                className="pointer-events-auto group flex flex-col items-center gap-y-0.5"
              >
                <div
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-md transition group-hover:scale-110 active:scale-95',
                    liked || heartCount > 0 ? 'text-rose-500' : 'text-white/80 group-hover:text-white',
                  )}
                >
                  <Heart className={cn('size-5', (liked || heartCount > 0) && 'fill-current')} />
                </div>
                {heartCount > 0 && (
                  <span className="text-[10px] font-semibold text-white drop-shadow-md">
                    {heartCount}
                  </span>
                )}
              </button>
            </Hint>

            {/* Comment Button (Opens thread comments!) */}
            {onOpenThread && (
              <Hint label="Comment on video" side="left">
                <button
                  type="button"
                  onClick={onOpenThread}
                  className="pointer-events-auto group flex flex-col items-center gap-y-0.5"
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-md transition group-hover:scale-110 group-hover:text-white active:scale-95">
                    <MessageCircle className="size-5" />
                  </div>
                  {threadCount > 0 && (
                    <span className="text-[10px] font-semibold text-white drop-shadow-md">
                      {threadCount}
                    </span>
                  )}
                </button>
              </Hint>
            )}

            {/* Open in Reels Scroll Feed Button */}
            {onOpenReelsFeed && isVertical && (
              <Hint label="Scroll all Reels" side="left">
                <button
                  type="button"
                  onClick={() => onOpenReelsFeed(video.id)}
                  className="pointer-events-auto flex size-9 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 text-white shadow-lg backdrop-blur-md transition hover:scale-110 active:scale-95"
                >
                  <Film className="size-4" />
                </button>
              </Hint>
            )}
          </div>
        </div>

        {/* Bottom Bar with In-App Interaction Info */}
        <div className="flex items-center justify-between bg-black/60 px-3 py-2 text-xs text-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-x-2">
            <span className="text-[11px] text-white/50">React or comment in thread</span>
          </div>

          {onOpenThread && (
            <button
              type="button"
              onClick={onOpenThread}
              className="text-[11px] font-medium text-pink-400 hover:text-pink-300 hover:underline"
            >
              {threadCount > 0 ? `${threadCount} comments` : 'Leave a comment...'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

