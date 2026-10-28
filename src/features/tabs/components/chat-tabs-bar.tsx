'use client';

import { Film, Hash, User, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { cn } from '@/lib/utils';

import { type ChatTab, useChatTabs } from '../store/use-chat-tabs';

export const ChatTabsBar = () => {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const workspaceId = useWorkspaceId();
  const { tabs, activeTabId, setActiveTabId, closeTab, addOrFocusTab } = useChatTabs();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync active tab ID with current route safely
  useEffect(() => {
    if (!pathname || !tabs) return;

    const matchedTab = tabs.find((t) => t.path === pathname);
    if (matchedTab) {
      setActiveTabId((current) => (current === matchedTab.id ? current : matchedTab.id));
    }
  }, [pathname, tabs, setActiveTabId]);

  const handleTabClick = (tab: ChatTab) => {
    setActiveTabId(tab.id);
    router.push(tab.path);
  };

  const handleClose = (e: React.MouseEvent, tab: ChatTab) => {
    e.stopPropagation();
    const nextPath = closeTab(tab.id);
    if (nextPath) {
      router.push(nextPath);
    } else if (tab.id === activeTabId) {
      router.push(`/workspace/${workspaceId}`);
    }
  };

  const handleOpenReelsTab = () => {
    const reelsTab: ChatTab = {
      id: 'reels-feed',
      type: 'reels',
      name: 'Reels Feed',
      path: `/workspace/${workspaceId}?view=reels`,
    };
    addOrFocusTab(reelsTab);
    router.push(reelsTab.path);
  };

  // Prevent SSR hydration mismatch
  if (!mounted || !tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className="flex h-9 shrink-0 items-center gap-x-1 border-b bg-muted/30 px-2 text-xs">
      <div className="flex flex-1 items-center gap-x-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId || pathname === tab.path;

          return (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                'group flex h-7 max-w-[180px] shrink-0 cursor-pointer items-center gap-x-1.5 rounded-t-md px-2.5 transition-all select-none',
                isActive
                  ? 'border-t-2 border-primary bg-background font-medium text-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
              )}
              title={tab.name}
            >
              {tab.type === 'channel' && <Hash className="size-3.5 shrink-0 text-muted-foreground" />}

              {tab.type === 'member' && (
                <div className="shrink-0">
                  {tab.image ? (
                    <Avatar className="size-4">
                      <AvatarImage src={tab.image} />
                      <AvatarFallback className="text-[9px]">
                        {tab.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <User className="size-3.5 text-muted-foreground" />
                  )}
                </div>
              )}

              {tab.type === 'reels' && (
                <Film className="size-3.5 shrink-0 text-pink-500 animate-pulse" />
              )}

              <span className="truncate text-xs">{tab.name}</span>

              <button
                type="button"
                onClick={(e) => handleClose(e, tab)}
                className="ml-auto rounded-sm p-0.5 opacity-0 hover:bg-muted group-hover:opacity-100"
                aria-label={`Close ${tab.name}`}
              >
                <X className="size-3 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleOpenReelsTab}
        className="ml-auto flex shrink-0 items-center gap-x-1 rounded-md bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 px-2 py-1 text-[11px] font-medium text-pink-600 transition hover:from-pink-500/20 hover:to-indigo-500/20 dark:text-pink-400"
        title="Open Reels & Shorts Feed"
      >
        <Film className="size-3" />
        <span>Reels</span>
      </button>
    </div>
  );
};
