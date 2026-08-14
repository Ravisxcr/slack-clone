'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

interface LinkPreviewProps {
  url: string;
}

const previewCache = new Map<string, LinkPreviewData | null>();

export const LinkPreview = ({ url }: LinkPreviewProps) => {
  const cached = previewCache.get(url);

  const [data, setData] = useState<LinkPreviewData | null>(cached ?? null);
  const [isDone, setIsDone] = useState(previewCache.has(url));

  useEffect(() => {
    if (previewCache.has(url)) {
      setData(previewCache.get(url) ?? null);
      setIsDone(true);

      return;
    }

    let cancelled = false;

    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then((res) => (res.ok ? (res.json() as Promise<LinkPreviewData>) : null))
      .then((result) => {
        if (cancelled) return;

        const preview = result && (result.title || result.description || result.image) ? result : null;

        previewCache.set(url, preview);
        setData(preview);
        setIsDone(true);
      })
      .catch(() => {
        if (cancelled) return;

        previewCache.set(url, null);
        setIsDone(true);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!isDone || !data) return null;

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex max-w-md overflow-hidden rounded-md border border-border bg-background transition hover:bg-muted/40"
    >
      {data.image && (
        <div className="relative hidden w-32 shrink-0 sm:block">
          <Image src={data.image} alt={data.title ?? data.url} fill unoptimized className="object-cover" />
        </div>
      )}

      <div className="flex min-w-0 flex-col justify-center gap-0.5 p-3">
        {data.siteName && <span className="truncate text-xs text-muted-foreground">{data.siteName}</span>}
        {data.title && <span className="truncate text-sm font-semibold text-primary">{data.title}</span>}
        {data.description && <span className="line-clamp-2 text-xs text-muted-foreground">{data.description}</span>}
      </div>
    </a>
  );
};
