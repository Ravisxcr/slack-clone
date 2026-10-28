export type VideoPlatform =
  | 'youtube_short'
  | 'youtube_video'
  | 'instagram_reel'
  | 'tiktok'
  | 'direct_video';

export interface ParsedVideo {
  platform: VideoPlatform;
  id: string;
  originalUrl: string;
  embedUrl: string;
  thumbnailUrl?: string;
  isVertical: boolean;
  platformName: string;
  platformColor: string; // for ambient glow and badge
  accentGradient: string;
}

const YOUTUBE_SHORT_REGEX =
  /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:[^\s]*)/i;

const YOUTUBE_VIDEO_REGEX =
  /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s]*)/i;

const INSTAGRAM_REEL_REGEX =
  /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|reels|p)\/([a-zA-Z0-9_-]+)/i;

const TIKTOK_REGEX =
  /(?:https?:\/\/)?(?:www\.|vm\.|m\.)?tiktok\.com\/(?:@[a-zA-Z0-9_.-]+\/video\/|v\/|t\/)?([0-9a-zA-Z_-]+)/i;

const DIRECT_VIDEO_REGEX =
  /^https?:\/\/.+\.(mp4|webm|mov|m4v|ogg)(?:\?.*)?$/i;

export const parseVideoUrl = (rawUrl: string): ParsedVideo | null => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim();

  // 1. YouTube Shorts
  const ytShortMatch = url.match(YOUTUBE_SHORT_REGEX);
  if (ytShortMatch && ytShortMatch[1]) {
    const id = ytShortMatch[1];
    return {
      platform: 'youtube_short',
      id,
      originalUrl: url,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=0&loop=1&playlist=${id}&rel=0&modestbranding=1`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      isVertical: true,
      platformName: 'YouTube Shorts',
      platformColor: '#FF0000',
      accentGradient: 'from-red-600 via-rose-500 to-amber-500',
    };
  }

  // 2. YouTube Video
  const ytVideoMatch = url.match(YOUTUBE_VIDEO_REGEX);
  if (ytVideoMatch && ytVideoMatch[1]) {
    const id = ytVideoMatch[1];
    return {
      platform: 'youtube_video',
      id,
      originalUrl: url,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      isVertical: false,
      platformName: 'YouTube',
      platformColor: '#FF0000',
      accentGradient: 'from-red-600 via-rose-500 to-orange-500',
    };
  }

  // 3. Instagram Reels
  const igMatch = url.match(INSTAGRAM_REEL_REGEX);
  if (igMatch && igMatch[1]) {
    const id = igMatch[1];
    return {
      platform: 'instagram_reel',
      id,
      originalUrl: url,
      embedUrl: `https://www.instagram.com/reel/${id}/embed`,
      isVertical: true,
      platformName: 'Instagram Reel',
      platformColor: '#E1306C',
      accentGradient: 'from-purple-600 via-pink-600 to-amber-500',
    };
  }

  // 4. TikTok
  const tiktokMatch = url.match(TIKTOK_REGEX);
  if (tiktokMatch && tiktokMatch[1] && /^\d+$/.test(tiktokMatch[1])) {
    const id = tiktokMatch[1];
    return {
      platform: 'tiktok',
      id,
      originalUrl: url,
      embedUrl: `https://www.tiktok.com/embed/v2/${id}`,
      isVertical: true,
      platformName: 'TikTok',
      platformColor: '#00F2FE',
      accentGradient: 'from-cyan-400 via-slate-900 to-rose-500',
    };
  }

  // 5. Direct MP4 / WebM / Video
  const directMatch = url.match(DIRECT_VIDEO_REGEX);
  if (directMatch) {
    return {
      platform: 'direct_video',
      id: url,
      originalUrl: url,
      embedUrl: url,
      isVertical: true,
      platformName: 'Direct Video',
      platformColor: '#8B5CF6',
      accentGradient: 'from-violet-600 via-purple-600 to-indigo-600',
    };
  }

  return null;
};

/**
 * Determines whether a message was sent in Ambient Mode.
 * Ambient messages are routed exclusively to the Reels tab so they
 * do not clutter the main Messages conversation.
 */
export const isAmbientMessage = (body: string): boolean => {
  if (!body) return false;
  try {
    let plainText = body;
    let explicitAmbient: boolean | undefined = undefined;

    try {
      const data = JSON.parse(body);
      if (data && typeof data === 'object') {
        if ('ambient' in data) {
          explicitAmbient = Boolean(data.ambient);
        }
        if (data.ops && Array.isArray(data.ops)) {
          plainText = data.ops.map((op: { insert?: string }) => op.insert || '').join('');
        }
      }
    } catch {
      // not JSON
    }

    // If explicit ambient flag is set
    if (explicitAmbient === false) {
      return false; // explicitly turned off ambient mode -> normal message
    }
    if (explicitAmbient === true) {
      return true; // explicitly sent in ambient mode -> ambient reel
    }

    // If no explicit ambient property (e.g. legacy message with reel/short link)
    const urls = plainText.match(/https?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g) || [];
    for (const url of urls) {
      const parsed = parseVideoUrl(url);
      if (parsed && (parsed.isVertical || parsed.platform === 'youtube_short' || parsed.platform === 'instagram_reel' || parsed.platform === 'tiktok')) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
};

