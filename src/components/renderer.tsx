import Quill from 'quill';
import { useEffect, useRef, useState } from 'react';

import { LinkPreview } from './link-preview';

interface RendererProps {
  value: string;
}

const URL_TEST_PATTERN = /https?:\/\/\S+/;
const URL_MATCH_PATTERN = /https?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g;

// Quill only turns typed text into a clickable <a> when it was inserted through the
// toolbar/paste link flow. Most users just type or paste a bare URL, so we linkify any
// remaining plain-text URLs here to make them clickable and previewable too.
const linkifyPlainTextUrls = (root: HTMLElement) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (node.parentElement?.closest('a')) return NodeFilter.FILTER_REJECT;

      return URL_TEST_PATTERN.test(node.textContent || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });

  const textNodes: Text[] = [];
  let node = walker.nextNode();

  while (node) {
    textNodes.push(node as Text);
    node = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    const text = textNode.textContent || '';
    const matches = Array.from(text.matchAll(URL_MATCH_PATTERN));

    if (!matches.length) return;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    matches.forEach((match) => {
      const url = match[0];
      const index = match.index ?? 0;

      if (index > lastIndex) fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)));

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.textContent = url;
      fragment.appendChild(anchor);

      lastIndex = index + url.length;
    });

    if (lastIndex < text.length) fragment.appendChild(document.createTextNode(text.slice(lastIndex)));

    textNode.replaceWith(fragment);
  });
};

const Renderer = ({ value }: RendererProps) => {
  const [isEmpty, setIsEmpty] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const rendererRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rendererRef.current) return;

    const container = rendererRef.current;

    const quill = new Quill(document.createElement('div'), {
      theme: 'snow',
    });

    quill.enable(false);

    const contents = JSON.parse(value);
    quill.setContents(contents);

    const isEmpty =
      quill
        .getText()
        .replace(/<(.|\n)*?>/g, '')
        .trim().length === 0;

    setIsEmpty(isEmpty);

    container.innerHTML = quill.root.innerHTML;

    container.querySelectorAll('.ql-ui').forEach((el) => el.remove());

    linkifyPlainTextUrls(container);

    let firstLink: string | null = null;

    container.querySelectorAll('a').forEach((a) => {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');

      if (!firstLink && (a.href.startsWith('http://') || a.href.startsWith('https://'))) firstLink = a.href;
    });

    setPreviewUrl(firstLink);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [value]);

  if (isEmpty) return null;

  return (
    <div className="ql-snow">
      <div ref={rendererRef} className="ql-editor ql-renderer" />

      {previewUrl && <LinkPreview url={previewUrl} />}
    </div>
  );
};

export default Renderer;
