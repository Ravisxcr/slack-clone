/**
 * Global Video Playback Coordination
 * Ensures that only ONE video is playing across the application at any given time.
 * When any video (HTML5 or embedded iframe) starts playing, all other videos are immediately paused.
 */

export const VIDEO_PLAY_EVENT = 'slack_video_play';

export interface VideoPlayEventDetail {
  playerId: string;
}

/**
 * Notify the application that a video with `playerId` has started playing.
 * Pauses all other HTML5 videos in the DOM and broadcasts an event for iframe players.
 */
export const notifyVideoPlay = (playerId: string) => {
  if (typeof window === 'undefined') return;

  // 1. Immediately pause any HTML5 <video> elements that do not belong to this player
  try {
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((v) => {
      const parentPlayerId = v.getAttribute('data-player-id');
      if (parentPlayerId !== playerId && !v.paused) {
        v.pause();
      }
    });
  } catch {
    // Ignore DOM query issues
  }

  // 2. Dispatch custom event for React components and iframes to react
  window.dispatchEvent(
    new CustomEvent<VideoPlayEventDetail>(VIDEO_PLAY_EVENT, {
      detail: { playerId },
    }),
  );
};

/**
 * Safely pauses an iframe.
 * - YouTube: sends official IFrame API `pauseVideo` postMessage.
 * - Other iframes (X/Twitter, Instagram, TikTok): resets src to immediately stop playback and audio.
 */
export const pauseIframeElement = (iframe: HTMLIFrameElement | null) => {
  if (!iframe) return;

  try {
    // YouTube IFrame Player API command
    iframe.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
      '*',
    );
  } catch {
    // ignore cross-origin postMessage errors
  }

  try {
    const currentSrc = iframe.getAttribute('src');
    if (currentSrc && !currentSrc.includes('youtube') && !currentSrc.includes('youtu.be')) {
      // Re-setting src immediately terminates playback and audio for Twitter/Instagram/TikTok embeds
      iframe.src = currentSrc;
    }
  } catch {
    // ignore
  }
};

