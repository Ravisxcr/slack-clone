'use client';

import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';

export interface ChatTab {
  id: string; // channelId, memberId, or 'reels'
  type: 'channel' | 'member' | 'reels';
  name: string;
  image?: string;
  path: string;
}

const STORAGE_KEY = 'slack_clone_chat_tabs';

const persistTabs = (tabs: ChatTab[]) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  } catch {
    // ignore
  }
};

// Initial state must be identical on server and client to prevent hydration mismatch
const baseTabsAtom = atom<ChatTab[]>([]);
const hasHydratedAtom = atom<boolean>(false);

export const chatTabsAtom = atom(
  (get) => get(baseTabsAtom),
  (_get, set, update: ChatTab[] | ((prev: ChatTab[]) => ChatTab[])) => {
    set(baseTabsAtom, (prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      persistTabs(next);
      return next;
    });
  },
);

export const activeTabIdAtom = atom<string | null>(null);

export const useChatTabs = () => {
  const [tabs, setTabs] = useAtom(chatTabsAtom);
  const [activeTabId, setActiveTabId] = useAtom(activeTabIdAtom);
  const [hasHydrated, setHasHydrated] = useAtom(hasHydratedAtom);

  // Safely restore tabs from sessionStorage after initial hydration
  useEffect(() => {
    if (!hasHydrated && typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw);
          if (Array.isArray(stored) && stored.length > 0) {
            setTabs(stored);
          }
        }
      } catch {
        // ignore
      }
      setHasHydrated(true);
    }
  }, [hasHydrated, setHasHydrated, setTabs]);

  const addOrFocusTab = useCallback(
    (tab: ChatTab) => {
      setTabs((prev) => {
        const exists = prev.find((t) => t.id === tab.id);
        if (exists) {
          // If values haven't changed, return the exact same array reference to prevent re-render loop
          if (
            exists.name === tab.name &&
            exists.path === tab.path &&
            exists.type === tab.type &&
            exists.image === tab.image
          ) {
            return prev;
          }
          return prev.map((t) => (t.id === tab.id ? { ...t, ...tab } : t));
        }
        return [...prev, tab];
      });

      setActiveTabId((current) => (current === tab.id ? current : tab.id));
    },
    [setTabs, setActiveTabId],
  );

  const closeTab = useCallback(
    (tabId: string): string | null => {
      let nextActivePath: string | null = null;
      setTabs((prev) => {
        const targetIndex = prev.findIndex((t) => t.id === tabId);
        if (targetIndex === -1) return prev;

        const nextTabs = prev.filter((t) => t.id !== tabId);

        // If closing the active tab, find an adjacent tab to activate
        if (activeTabId === tabId) {
          if (nextTabs.length > 0) {
            const nextIndex = Math.min(targetIndex, nextTabs.length - 1);
            const nextTab = nextTabs[nextIndex];
            setActiveTabId(nextTab.id);
            nextActivePath = nextTab.path;
          } else {
            setActiveTabId(null);
            nextActivePath = null;
          }
        }

        return nextTabs;
      });

      return nextActivePath;
    },
    [activeTabId, setTabs, setActiveTabId],
  );

  return {
    tabs,
    activeTabId,
    setActiveTabId,
    addOrFocusTab,
    closeTab,
  };
};
