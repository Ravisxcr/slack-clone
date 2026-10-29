'use client';

import { ImageIcon, Smile, Sparkles, XIcon } from 'lucide-react';
import Image from 'next/image';
import Quill, { type QuillOptions } from 'quill';
import type { Delta, Op } from 'quill/core';
import 'quill/dist/quill.snow.css';
import { type MutableRefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MdSend } from 'react-icons/md';
import { PiTextAa } from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import { parseVideoUrl, type ParsedVideo } from '@/lib/video-parser';
import { cn } from '@/lib/utils';

import { EmojiPopover } from './emoji-popover';
import { Hint } from './hint';

type EditorValue = {
  image: File | null;
  body: string;
};

interface EditorProps {
  onSubmit: ({ image, body }: EditorValue) => void;
  onCancel?: () => void;
  placeholder?: string;
  defaultValue?: Delta | Op[];
  disabled?: boolean;
  innerRef?: MutableRefObject<Quill | null>;
  variant?: 'create' | 'update';
}

const Editor = ({
  onCancel,
  onSubmit,
  placeholder = 'Write something...',
  defaultValue = [],
  disabled = false,
  innerRef,
  variant = 'create',
}: EditorProps) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [ambientMode, setAmbientMode] = useState(true);

  // Detect video link (YouTube Shorts, YouTube, Instagram Reels, TikTok, Direct Video, X Video)
  const detectedVideo: ParsedVideo | null = useMemo(() => {
    if (!text) return null;
    const urls = text.match(/https?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g) || [];
    for (const url of urls) {
      const parsed = parseVideoUrl(url);
      if (parsed) return parsed;
    }
    return null;
  }, [text]);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<Quill | null>(null);

  const submitRef = useRef(onSubmit);
  const placeholderRef = useRef(placeholder);
  const defaultValueRef = useRef(defaultValue);
  const disabledRef = useRef(disabled);
  const ambientModeRef = useRef(ambientMode);

  useLayoutEffect(() => {
    submitRef.current = onSubmit;
    placeholderRef.current = placeholder;
    defaultValueRef.current = defaultValue;
    disabledRef.current = disabled;
    ambientModeRef.current = ambientMode;
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const editorContainer = container.appendChild(container.ownerDocument.createElement('div'));

    const options: QuillOptions = {
      modules: {
        toolbar: [
          ['bold', 'italic', 'strike'],
          ['link', 'code'],
          [{ list: 'ordered' }, { list: 'bullet' }],
        ],
        keyboard: {
          bindings: {
            enter: {
              key: 'Enter',
              handler: () => {
                const text = quill.getText();
                const addedImage = imageElementRef.current?.files?.[0] || null;

                const isEmpty = !addedImage && text.replace(/<(.|\n)*?>/g, '').trim().length === 0;

                if (isEmpty) return;

                const urls = text.match(/https?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g) || [];
                const hasVideo = urls.some((u) => parseVideoUrl(u));

                const contents = quill.getContents();
                const payload = {
                  ...contents,
                  ambient: hasVideo ? ambientModeRef.current : undefined,
                };
                const body = JSON.stringify(payload);
                submitRef.current?.({ body, image: addedImage });
              },
            },
            shift_enter: {
              key: 'Enter',
              shiftKey: true,
              handler: () => {
                quill.insertText(quill.getSelection()?.index || 0, '\n');
              },
            },
          },
        },
      },
      placeholder: placeholderRef.current,
      theme: 'snow',
    };

    const quill = new Quill(editorContainer, options);

    quillRef.current = quill;
    quillRef.current.focus();

    if (innerRef) innerRef.current = quill;

    quill.setContents(defaultValueRef.current);
    setText(quill.getText());

    quill.on(Quill.events.TEXT_CHANGE, () => {
      setText(quill.getText());
    });

    // Start with formatting toolbar hidden by default to keep input compact on all devices
    const toolbarElement = containerRef.current?.querySelector('.ql-toolbar');
    if (toolbarElement) {
      toolbarElement.classList.add('hidden');
    }

    // Scroll into view on mobile focus when keyboard opens
    const handleFocus = () => {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    };

    quill.root.addEventListener('focus', handleFocus);

    return () => {
      quill.root.removeEventListener('focus', handleFocus);
      if (container) container.innerHTML = '';

      quill.off(Quill.events.TEXT_CHANGE);

      if (quillRef) quillRef.current = null;
      if (innerRef) innerRef.current = null;
    };
  }, [innerRef]);

  const toggleToolbar = () => {
    setIsToolbarVisible((current) => {
      const next = !current;
      const toolbarElement = containerRef.current?.querySelector('.ql-toolbar');
      if (toolbarElement) {
        if (next) {
          toolbarElement.classList.remove('hidden');
        } else {
          toolbarElement.classList.add('hidden');
        }
      }
      return next;
    });
  };

  const onEmojiSelect = (emoji: string) => {
    const quill = quillRef.current;

    if (!quill) return;

    quill.insertText(quill.getSelection()?.index || 0, emoji);
  };

  const handleSend = () => {
    if (!quillRef.current) return;

    const text = quillRef.current.getText();
    const addedImage = imageElementRef.current?.files?.[0] || null;
    const isCurrentEmpty = !addedImage && text.replace(/<(.|\n)*?>/g, '').trim().length === 0;

    if (isCurrentEmpty) return;

    const contents = quillRef.current.getContents();
    const payload = {
      ...contents,
      ambient: detectedVideo ? ambientMode : undefined,
    };
    const body = JSON.stringify(payload);
    onSubmit({ body, image: addedImage });
  };

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod|Mac/.test(navigator.userAgent);

  const isEmpty = !image && text.replace(/<(.|\n)*?>/g, '').trim().length === 0;

  return (
    <div className="flex flex-col">
      <input type="file" accept="image/*" ref={imageElementRef} onChange={(e) => setImage(e.target.files![0])} className="hidden" />

      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-md border border-border bg-background transition focus-within:border-ring focus-within:shadow-sm',
          disabled && 'opacity-50',
          detectedVideo && ambientMode && 'border-pink-500/50 shadow-[0_0_15px_-3px_rgba(236,72,153,0.15)]',
        )}
      >
        <div ref={containerRef} className="h-full" />

        {!!image && (
          <div className="p-2">
            <div className="group/image relative flex size-[62px] items-center justify-center">
              <Hint label="Remove image">
                <button
                  onClick={() => {
                    setImage(null);

                    imageElementRef.current!.value = '';
                  }}
                  className="absolute -right-2.5 -top-2.5 z-[4] hidden size-6 items-center justify-center rounded-full border-2 border-white bg-black/70 text-white hover:bg-black group-hover/image:flex"
                >
                  <XIcon className="size-3.5" />
                </button>
              </Hint>

              <Image
                src={URL.createObjectURL(image)}
                alt="Uploaded image"
                fill
                className="overflow-hidden rounded-xl border object-cover"
              />
            </div>
          </div>
        )}

        <div className="z-[5] flex flex-wrap items-center gap-1 px-2 pb-2">
          <Hint label={isToolbarVisible ? 'Hide formatting' : 'Show formatting'}>
            <Button
              disabled={disabled}
              size="iconSm"
              variant="ghost"
              onClick={toggleToolbar}
              className={cn(isToolbarVisible && 'bg-muted text-foreground')}
            >
              <PiTextAa className="size-4" />
            </Button>
          </Hint>

          <EmojiPopover onEmojiSelect={onEmojiSelect}>
            <Button disabled={disabled} size="iconSm" variant="ghost">
              <Smile className="size-4" />
            </Button>
          </EmojiPopover>

          {variant === 'create' && (
            <Hint label="Image">
              <Button disabled={disabled} size="iconSm" variant="ghost" onClick={() => imageElementRef.current?.click()}>
                <ImageIcon className="size-4" />
              </Button>
            </Hint>
          )}

          {/* Frictionless Ambient Mode Toggle: appears when video link is detected */}
          {variant === 'create' && detectedVideo && (
            <Hint
              label={
                ambientMode
                  ? 'Ambient Mode ON: Shared to Reels tab (keeps chat clean)'
                  : 'Ambient Mode OFF: Shared directly in Messages'
              }
            >
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setAmbientMode((prev) => !prev)}
                className={cn(
                  'h-7 gap-x-1.5 rounded-full px-2.5 text-xs font-medium transition-all select-none',
                  ambientMode
                    ? 'border border-pink-500/40 bg-gradient-to-r from-pink-500/15 via-rose-500/15 to-purple-500/15 text-pink-600 shadow-xs hover:bg-pink-500/25 dark:text-pink-300'
                    : 'border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Sparkles className={cn('size-3.5', ambientMode ? 'animate-pulse text-pink-500' : 'text-muted-foreground')} />
                <span>Ambient {ambientMode ? 'ON' : 'OFF'}</span>
              </Button>
            </Hint>
          )}

          {variant === 'update' && (
            <div className="ml-auto flex items-center gap-x-2">
              <Button variant="outline" size="sm" onClick={onCancel} disabled={disabled}>
                Cancel
              </Button>

              <Button
                disabled={disabled || isEmpty}
                onClick={handleSend}
                size="sm"
                className="bg-[#007a5a] text-white hover:bg-[#007a5a]/80"
              >
                Save
              </Button>
            </div>
          )}

          {variant === 'create' && (
            <Button
              title={
                detectedVideo
                  ? ambientMode
                    ? 'Send to Reels tab (keeps chat clean)'
                    : 'Send in Messages'
                  : 'Send Message'
              }
              disabled={disabled || isEmpty}
              onClick={handleSend}
              className={cn(
                'ml-auto transition-all',
                isEmpty
                  ? 'bg-background text-muted-foreground hover:bg-muted/80'
                  : detectedVideo && ambientMode
                    ? 'bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 text-white shadow-md shadow-pink-500/25 hover:from-pink-500 hover:to-purple-500'
                    : 'bg-[#007a5a] text-white hover:bg-[#007a5a]/80',
              )}
              size="iconSm"
            >
              <MdSend className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {variant === 'create' && !isEmpty && (
        <div className="hidden md:flex justify-end pt-1 pr-1 text-[10px] text-muted-foreground transition">
          <p>
            <strong>Shift + {isIOS ? 'Return' : 'Enter'}</strong> to add a new line.
          </p>
        </div>
      )}
    </div>
  );
};

export default Editor;
