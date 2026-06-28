'use client';

import { formatDistanceToNow } from 'date-fns';
import { Bell, ChevronLeft, Loader, MessageSquare, UserMinus, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useGetActivityEvents } from '@/features/activities/api/use-get-activity-events';
import { useMarkActivityRead } from '@/features/activities/api/use-mark-activity-read';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

type ActivityAction = 'added_to_workspace' | 'removed_from_workspace' | 'message_mention' | 'channel_message';

interface ActivityEvent {
  _id: string;
  _creationTime: number;
  workspaceId: string;
  targetUserId: string;
  actorName: string;
  actorImage?: string;
  action: ActivityAction;
  channelId?: string;
  channelName?: string;
  messagePreview?: string;
  isRead: boolean;
}

interface ActivityPanelProps {
  onClose: () => void;
}

const ACTION_CONFIG: Record<
  ActivityAction,
  { icon: React.ElementType; badgeClass: string; label: (e: ActivityEvent) => string }
> = {
  added_to_workspace: {
    icon: UserPlus,
    badgeClass: 'bg-emerald-500',
    label: (e: ActivityEvent) => `${e.actorName} added you to the workspace`,
  },
  removed_from_workspace: {
    icon: UserMinus,
    badgeClass: 'bg-rose-500',
    label: (e: ActivityEvent) => `${e.actorName} removed you from the workspace`,
  },
  message_mention: {
    icon: MessageSquare,
    badgeClass: 'bg-blue-500',
    label: (e: ActivityEvent) =>
      e.channelName ? `${e.actorName} mentioned you in #${e.channelName}` : `${e.actorName} mentioned you`,
  },
  channel_message: {
    icon: MessageSquare,
    badgeClass: 'bg-indigo-500',
    label: (e: ActivityEvent) =>
      e.channelName ? `${e.actorName} sent a message in #${e.channelName}` : `${e.actorName} sent a message`,
  },
};

export const ActivityPanel = ({ onClose }: ActivityPanelProps) => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const { data: events, isLoading } = useGetActivityEvents({ workspaceId });
  const { mutate: markAllRead } = useMarkActivityRead();

  const unreadCount = events?.filter((e) => !e.isRead).length ?? 0;

  const handleMarkAllRead = async () => {
    try {
      await markAllRead({ workspaceId });
    } catch {
      toast.error('Failed to mark activity as read.');
    }
  };

  const handleEventClick = (event: ActivityEvent) => {
    if ((event.action === 'channel_message' || event.action === 'message_mention') && event.channelId) {
      router.push(`/workspace/${workspaceId}/channel/${event.channelId}`);
      onClose();
    }
  };

  return (
    <div className="flex h-full flex-col bg-[var(--workspace-sidebar)]">
      <div className="flex items-center gap-x-2 px-4 py-3">
        <button
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-white"
          aria-label="Back"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h2 className="flex-1 text-base font-semibold text-white">Activity</h2>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            className="h-auto px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white"
          >
            Mark all read
          </Button>
        )}
      </div>

      <div className="flex flex-col overflow-y-auto px-4 py-2">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader className="size-4 animate-spin text-white/60" />
          </div>
        )}

        {!isLoading && (!events || events.length === 0) && (
          <div className="flex flex-col items-center gap-y-2 py-10 text-center">
            <Bell className="size-8 text-white/20" />
            <p className="text-sm text-white/60">No activity yet.</p>
            <p className="text-xs text-white/40">We&apos;ll notify you when something happens.</p>
          </div>
        )}

        {!isLoading && events && events.length > 0 && (
          <ul className="flex flex-col gap-y-1">
            {(events as ActivityEvent[]).map((event) => {
              const config = ACTION_CONFIG[event.action];
              const ActionIcon = config.icon;
              const isNavigable =
                (event.action === 'channel_message' || event.action === 'message_mention') && !!event.channelId;
              return (
                <li
                  key={event._id}
                  onClick={() => handleEventClick(event)}
                  className={`flex items-start gap-x-3 rounded-md px-2 py-2.5 hover:bg-white/10 ${!event.isRead ? 'bg-white/5' : ''} ${isNavigable ? 'cursor-pointer' : ''}`}
                >
                  <div className="relative mt-0.5 shrink-0">
                    <Avatar className="size-8">
                      <AvatarImage src={event.actorImage} />
                      <AvatarFallback className="text-xs">
                        {event.actorName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full ${config.badgeClass}`}
                    >
                      <ActionIcon className="size-2 text-white" />
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-y-0.5">
                    <p className={`text-sm leading-snug text-white ${!event.isRead ? 'font-medium' : 'font-normal'}`}>
                      {config.label(event)}
                    </p>
                    {event.messagePreview && (
                      <p className="truncate text-xs italic text-white/60">
                        &ldquo;{event.messagePreview}&rdquo;
                      </p>
                    )}
                    <span className="text-xs text-white/40">
                      {formatDistanceToNow(event._creationTime, { addSuffix: true })}
                    </span>
                  </div>

                  {!event.isRead && (
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-rose-500" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
