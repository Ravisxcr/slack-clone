'use client';

import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { formatDistanceToNow } from 'date-fns';
import { Loader, Settings, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useGetMemberEvents } from '@/features/members/api/use-get-member-events';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useRemoveMember } from '@/features/members/api/use-remove-member';
import { useCurrentMember } from '@/features/members/api/use-current-member';
import { useGetWorkspace } from '@/features/workspaces/api/use-get-workspace';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import type { Id } from '@/../convex/_generated/dataModel';

import { PreferencesModal } from './preferences-modal';

interface MemberEvent {
  _id: string;
  _creationTime: number;
  workspaceId: string;
  actorName: string;
  targetName: string;
  targetImage?: string;
  action: 'joined' | 'removed';
}

interface MorePanelProps {
  open: boolean;
  onClose: () => void;
}

export const MorePanel = ({ open, onClose }: MorePanelProps) => {
  const workspaceId = useWorkspaceId();
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: Id<'members'>; name: string } | null>(null);

  const { data: workspace } = useGetWorkspace({ id: workspaceId });
  const { data: currentMember } = useCurrentMember({ workspaceId });
  const { data: members, isLoading: membersLoading } = useGetMembers({ workspaceId });
  const { data: events, isLoading: eventsLoading } = useGetMemberEvents({ workspaceId });
  const { mutate: removeMember, isPending: isRemoving } = useRemoveMember();

  const isAdmin = currentMember?.role === 'admin';

  const handleRemoveConfirm = async () => {
    if (!memberToRemove) return;
    try {
      await removeMember({ id: memberToRemove.id });
      toast.success(`${memberToRemove.name} removed from workspace.`);
    } catch {
      toast.error('Failed to remove member.');
    } finally {
      setMemberToRemove(null);
    }
  };

  return (
    <>
      {workspace && (
        <PreferencesModal open={preferencesOpen} setOpen={setPreferencesOpen} initialValue={workspace.name} />
      )}

      <AlertDialog open={!!memberToRemove} onOpenChange={(v) => !v && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {memberToRemove?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the member from the workspace. Their messages will be kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRemoving}
              onClick={handleRemoveConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? <Loader className="size-4 animate-spin" /> : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
            <VisuallyHidden.Root>
              <SheetDescription>Workspace settings and member activity</SheetDescription>
            </VisuallyHidden.Root>
          </SheetHeader>

          <div className="flex flex-col gap-y-6 overflow-y-auto px-4 py-4">
            {/* Settings */}
            <section className="flex flex-col gap-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settings</p>

              {isAdmin && (
                <button
                  onClick={() => { onClose(); setPreferencesOpen(true); }}
                  className="flex w-full items-center gap-x-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
                >
                  <Settings className="size-4 shrink-0 text-muted-foreground" />
                  <span>Workspace preferences</span>
                </button>
              )}

              {!isAdmin && (
                <p className="px-2 text-sm text-muted-foreground">No settings available.</p>
              )}
            </section>

            {/* Members */}
            <section className="flex flex-col gap-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Members {members && members.length > 0 ? `(${members.length})` : ''}
              </p>

              {membersLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}

              {!membersLoading && (!members || members.length === 0) && (
                <p className="px-2 text-sm text-muted-foreground">No members found.</p>
              )}

              {!membersLoading && members && members.length > 0 && (
                <ul className="flex flex-col gap-y-1">
                  {members.map((member) => {
                    const isSelf = member._id === currentMember?._id;
                    const canRemove = isAdmin && !isSelf && member.role !== 'admin';
                    return (
                      <li key={member._id} className="group flex items-center gap-x-3 rounded-md px-2 py-2 hover:bg-muted">
                        <Avatar className="size-7 shrink-0">
                          <AvatarImage src={member.user.image} />
                          <AvatarFallback className="text-xs">
                            {member.user.name?.charAt(0).toUpperCase() ?? '?'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium">
                            {member.user.name ?? 'Unknown'}{isSelf ? ' (you)' : ''}
                          </span>
                          <span className="text-xs capitalize text-muted-foreground">{member.role}</span>
                        </div>

                        {canRemove && (
                          <button
                            onClick={() => setMemberToRemove({ id: member._id, name: member.user.name ?? 'Unknown' })}
                            className="ml-auto shrink-0 rounded p-1 text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                            title={`Remove ${member.user.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Member Activity */}
            <section className="flex flex-col gap-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Member Activity</p>

              {eventsLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}

              {!eventsLoading && (!events || events.length === 0) && (
                <p className="px-2 text-sm text-muted-foreground">No member activity yet.</p>
              )}

              {!eventsLoading && events && events.length > 0 && (
                <ul className="flex flex-col gap-y-1">
                  {(events as MemberEvent[]).map((event) => (
                    <li key={event._id} className="flex items-start gap-x-3 rounded-md px-2 py-2 hover:bg-muted">
                      <div className="relative mt-0.5 shrink-0">
                        <Avatar className="size-7">
                          <AvatarImage src={event.targetImage} />
                          <AvatarFallback className="text-xs">
                            {event.targetName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full ${event.action === 'joined' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        >
                          {event.action === 'joined' ? (
                            <UserPlus className="size-2 text-white" />
                          ) : (
                            <UserMinus className="size-2 text-white" />
                          )}
                        </span>
                      </div>

                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">{event.targetName}</span>
                        <span className="text-xs text-muted-foreground">
                          {event.action === 'joined'
                            ? `Joined ${formatDistanceToNow(event._creationTime, { addSuffix: true })}`
                            : `Removed by ${event.actorName} ${formatDistanceToNow(event._creationTime, { addSuffix: true })}`}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
