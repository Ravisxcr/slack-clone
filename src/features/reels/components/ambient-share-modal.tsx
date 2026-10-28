'use client';

import { Film, Loader, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { parseVideoUrl } from '@/lib/video-parser';
import { cn } from '@/lib/utils';

interface AmbientShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: (formattedText: string) => void;
  disabled?: boolean;
}

export const AmbientShareModal = ({
  open,
  onOpenChange,
  onShare,
  disabled = false,
}: AmbientShareModalProps) => {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');

  const parsedVideo = parseVideoUrl(url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error('Please enter a video URL.');
      return;
    }

    if (!parsedVideo) {
      toast.error('Supported links: YouTube Shorts, Instagram Reels, TikTok, or direct video (.mp4).');
      return;
    }

    // Format message with caption and video link
    const messageContent = caption.trim()
      ? `${caption.trim()}\n${parsedVideo.originalUrl}`
      : parsedVideo.originalUrl;

    onShare(messageContent);
    setUrl('');
    setCaption('');
    onOpenChange(false);
    toast.success(`Shared ${parsedVideo.platformName} in Ambient Mode!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/10 bg-slate-950 text-white sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-x-2 text-pink-400">
            <Sparkles className="size-5 animate-pulse" />
            <DialogTitle className="text-lg font-bold text-white">Share in Ambient Mode</DialogTitle>
          </div>
          <DialogDescription className="text-white/60">
            Share Reels, Shorts, and TikToks with immersive ambient lighting and in-app interaction.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Video or Reel URL
            </label>
            <Input
              type="url"
              placeholder="https://www.youtube.com/shorts/... or https://www.instagram.com/reel/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={disabled}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-pink-500"
              autoFocus
              required
            />
          </div>

          {/* Live Preview Card */}
          {parsedVideo ? (
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/60 p-3 shadow-lg">
              <div
                className={cn(
                  'absolute -inset-1 -z-10 rounded-xl opacity-40 blur-xl',
                  parsedVideo.platform === 'youtube_short' && 'bg-red-500',
                  parsedVideo.platform === 'youtube_video' && 'bg-red-500',
                  parsedVideo.platform === 'instagram_reel' && 'bg-pink-500',
                  parsedVideo.platform === 'tiktok' && 'bg-cyan-400',
                  parsedVideo.platform === 'direct_video' && 'bg-purple-500',
                )}
              />
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-x-1.5 font-semibold text-white">
                  <Film className="size-4 text-pink-400" />
                  {parsedVideo.platformName} detected
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                  Ready for Ambient View
                </span>
              </div>
            </div>
          ) : url.trim() ? (
            <div className="rounded-md bg-amber-500/10 p-2.5 text-xs text-amber-300">
              Supported: YouTube Shorts, Instagram Reels, TikTok, and direct video links (.mp4).
            </div>
          ) : null}

          <div className="flex flex-col gap-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Caption (Optional)
            </label>
            <textarea
              placeholder="Add your thoughts or what to watch for..."
              value={caption}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCaption(e.target.value)}
              disabled={disabled}
              rows={2}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 resize-none"
            />
          </div>

          <DialogFooter className="mt-2 flex items-center justify-end gap-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={disabled}
              className="text-white/70 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={disabled || !url.trim() || !parsedVideo}
              className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 font-semibold text-white shadow-md hover:from-pink-500 hover:to-indigo-500"
            >
              {disabled ? (
                <Loader className="size-4 animate-spin" />
              ) : (
                <div className="flex items-center gap-x-1.5">
                  <Sparkles className="size-4" />
                  <span>Share in Ambient Mode</span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
