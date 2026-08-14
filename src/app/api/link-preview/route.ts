import dns from 'node:dns/promises';

import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const FETCH_TIMEOUT_MS = 5_000;
const MAX_RESPONSE_BYTES = 1_000_000;

type LinkPreviewResponse = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

const decodeHtmlEntities = (text: string) =>
  text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");

const getMetaTags = (html: string) => {
  const metaTags: Record<string, string> = {};
  const metaTagPattern = /<meta\s+([^>]+)>/gi;

  let tagMatch: RegExpExecArray | null;

  while ((tagMatch = metaTagPattern.exec(html))) {
    const attrs = tagMatch[1];

    const nameMatch = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const contentMatch = /content\s*=\s*["']([^"']*)["']/i.exec(attrs);

    if (nameMatch && contentMatch) metaTags[nameMatch[1].toLowerCase()] = contentMatch[1];
  }

  return metaTags;
};

const getTitleTag = (html: string) => /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() || null;

const resolveUrl = (maybeRelativeUrl: string, baseUrl: string) => {
  try {
    return new URL(maybeRelativeUrl, baseUrl).toString();
  } catch {
    return null;
  }
};

const isPrivateIp = (ip: string) => {
  if (ip === '::1' || ip === '0.0.0.0') return true;
  if (/^127\./.test(ip)) return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true;
  if (/^fe80:/i.test(ip)) return true;

  return false;
};

const isSafeUrl = async (target: URL) => {
  if (target.protocol !== 'http:' && target.protocol !== 'https:') return false;

  const hostname = target.hostname.toLowerCase();

  if (hostname === 'localhost') return false;

  try {
    const { address } = await dns.lookup(hostname);

    return !isPrivateIp(address);
  } catch {
    return false;
  }
};

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');

  if (!rawUrl) return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });

  let target: URL;

  try {
    target = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (!(await isSafeUrl(target))) return NextResponse.json({ error: 'URL not allowed' }, { status: 400 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SlackCloneLinkPreview/1.0)',
        Accept: 'text/html',
      },
    });

    const contentType = response.headers.get('content-type') || '';

    if (!response.ok || !contentType.includes('text/html')) {
      return NextResponse.json({ error: 'Unable to fetch preview' }, { status: 422 });
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let html = '';
    let bytesRead = 0;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        bytesRead += value.byteLength;
        html += decoder.decode(value, { stream: true });

        if (bytesRead > MAX_RESPONSE_BYTES) {
          await reader.cancel();
          break;
        }
      }
    }

    const finalUrl = response.url || target.toString();
    const metaTags = getMetaTags(html);

    const rawTitle = metaTags['og:title'] || metaTags['twitter:title'] || getTitleTag(html);
    const rawDescription = metaTags['og:description'] || metaTags['twitter:description'] || metaTags['description'] || null;
    const rawImage = metaTags['og:image'] || metaTags['twitter:image'] || null;

    const body: LinkPreviewResponse = {
      url: finalUrl,
      title: rawTitle ? decodeHtmlEntities(rawTitle) : null,
      description: rawDescription ? decodeHtmlEntities(rawDescription) : null,
      image: rawImage ? resolveUrl(rawImage, finalUrl) : null,
      siteName: metaTags['og:site_name'] ? decodeHtmlEntities(metaTags['og:site_name']) : new URL(finalUrl).hostname,
    };

    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: 'Unable to fetch preview' }, { status: 422 });
  } finally {
    clearTimeout(timeout);
  }
}
