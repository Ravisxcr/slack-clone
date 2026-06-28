'use client';

import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck, ChevronLeft, Loader, MessagesSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { AvailabilityDot } from '@/components/availability-dot';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGetAllDms } from '@/features/conversations/api/use-get-all-dms';

const extractPlainText = (body: string): string => {
  try {
    const delta = JSON.parse(body) as { ops?: Array<{ insert?: string | object }> };
    if (!delta.ops || !Array.isArray(delta.ops)) return body;
    return delta.ops
      .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
      .join('')
      .replace(/\n+$/, '')
      .trim();
  } catch {
    return body;
  }
};

interface DmsPanelProps {
  onClose: () => void;
}

export const DmsPanel = ({ onClose }: DmsPanelProps) => {
  const router = useRouter();
  const { data: dms, isLoading } = useGetAllDms();

  const handleDmClick = (workspaceId: string, otherMemberId: string) => {
    onClose();
    router.push(`/workspace/${workspaceId}/member/${otherMemberId}`);
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
        <h2 className="text-base font-semibold text-white">Direct Messages</h2>
      </div>

      <div className="flex flex-col overflow-y-auto px-2 py-1">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader className="size-4 animate-spin text-white/60" />
          </div>
        )}

        {!isLoading && (!dms || dms.length === 0) && (
          <div className="flex flex-col items-center gap-y-2 py-10 text-center">
            <MessagesSquare className="size-8 text-white/20" />
            <p className="text-sm text-white/60">No direct messages yet.</p>
            <p className="text-xs text-white/40">Start a DM from any workspace channel list.</p>
          </div>
        )}

        {!isLoading && dms && dms.length > 0 && (
          <ul className="flex flex-col gap-y-0.5">
            {dms.map((dm) => (
              <li key={dm.conversationId}>
                <button
                  onClick={() => handleDmClick(dm.workspaceId, dm.otherMemberId)}
                  className={`flex w-full items-center gap-x-3 rounded-md px-2 py-2.5 text-left hover:bg-white/10 ${dm.isUnread ? 'bg-white/5' : ''}`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="size-8">
                      <AvatarImage src={dm.otherUserImage} />
                      <AvatarFallback className="text-xs">
                        {dm.otherUserName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 translate-x-0.5 translate-y-0.5">
                      <AvailabilityDot availability={dm.otherUserAvailability} />
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-y-0.5">
                    <div className="flex items-baseline justify-between gap-x-1">
                      <span className={`truncate text-sm text-white ${dm.isUnread ? 'font-semibold' : 'font-medium'}`}>
                        {dm.otherUserName}
                      </span>
                      {dm.lastMessage && (
                        <span className="shrink-0 text-[10px] text-white/40">
                          {formatDistanceToNow(dm.lastMessage.createdAt, { addSuffix: false })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-x-1">
                      <span className="truncate text-xs text-white/40">
                        {dm.otherUserCustomStatus || dm.workspaceName}
                      </span>
                      {dm.lastMessage && (
                        <>
                          <span className="text-white/30">·</span>
                          {dm.lastMessage.isMine && (
                            dm.lastMessageReadByOther
                              ? <CheckCheck className="size-3 shrink-0 text-blue-400" />
                              : <Check className="size-3 shrink-0 text-white/40" />
                          )}
                          <span className={`truncate text-xs ${dm.isUnread ? 'font-medium text-white/80' : 'text-white/40'}`}>
                            {dm.lastMessage.isMine ? 'You: ' : ''}{extractPlainText(dm.lastMessage.body)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {dm.isUnread && (
                    <span className="ml-auto mt-1 size-2 shrink-0 rounded-full bg-rose-500" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
