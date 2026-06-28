'use client';

import { useQuery } from 'convex/react';
import { useEffect, useRef } from 'react';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

export const useDesktopNotifications = (workspaceId: Id<'workspaces'>) => {
  const events = useQuery(api.activityEvents.getForCurrentUser, { workspaceId });
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!events) return;

    if (!initialized.current) {
      events.forEach((e) => seenIds.current.add(e._id));
      initialized.current = true;
      return;
    }

    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      Notification.permission !== 'granted' ||
      document.visibilityState === 'visible'
    ) {
      events.forEach((e) => seenIds.current.add(e._id));
      return;
    }

    const newEvents = events.filter((e) => !seenIds.current.has(e._id));

    for (const event of newEvents) {
      seenIds.current.add(event._id);

      let title: string;
      let body: string;

      switch (event.action) {
        case 'channel_message':
          title = `#${event.channelName ?? 'channel'}`;
          body = `${event.actorName}: ${event.messagePreview ?? 'New message'}`;
          break;
        case 'thread_reply':
          title = event.channelName ? `Thread reply in #${event.channelName}` : 'New thread reply';
          body = `${event.actorName}: ${event.messagePreview ?? 'New reply'}`;
          break;
        case 'emoji_reaction':
          title = event.emoji
            ? `${event.emoji} reaction from ${event.actorName}`
            : `${event.actorName} reacted to your message`;
          body = event.messagePreview ?? '';
          break;
        case 'message_mention':
          title = `${event.actorName} mentioned you`;
          body = event.messagePreview ?? '';
          break;
        case 'added_to_workspace':
          title = 'You were added to a workspace';
          body = `Added by ${event.actorName}`;
          break;
        case 'removed_from_workspace':
          title = 'Workspace update';
          body = `${event.actorName} removed you from the workspace`;
          break;
        default:
          continue;
      }

      const n = new Notification(title, {
        body,
        icon: event.actorImage ?? '/favicon.ico',
        tag: event._id,
      });

      n.onclick = () => {
        window.focus();
        n.close();
      };
    }
  }, [events]);
};
