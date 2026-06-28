'use client';

import { formatDistanceToNow } from 'date-fns';
import { ChevronLeft, Loader, Settings, Trash2, UserMinus, UserPlus } from 'lucide-react';
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
  onClose: () => void;
}

export const MorePanel = ({ onClose }: MorePanelProps) => {
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
    <div className="flex h-full flex-col bg-[var(--workspace-sidebar)]">
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

      <div className="flex items-center gap-x-2 px-4 py-3">
        <button
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-white"
          aria-label="Back"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h2 className="text-base font-semibold text-white">More</h2>
      </div>

      <div className="flex flex-col gap-y-6 overflow-y-auto px-4 py-2">
        {/* Settings */}
        <section className="flex flex-col gap-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Settings</p>

          {isAdmin && (
            <button
              onClick={() => { onClose(); setPreferencesOpen(true); }}
              className="flex w-full items-center gap-x-3 rounded-md px-2 py-2 text-sm text-white hover:bg-white/10"
            >
              <Settings className="size-4 shrink-0 text-white/60" />
              <span>Workspace preferences</span>
            </button>
          )}

          {!isAdmin && (
            <p className="px-2 text-sm text-white/60">No settings available.</p>
          )}
        </section>

        {/* Members */}
        <section className="flex flex-col gap-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Members {members && members.length > 0 ? `(${members.length})` : ''}
          </p>

          {membersLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader className="size-4 animate-spin text-white/60" />
            </div>
          )}

          {!membersLoading && (!members || members.length === 0) && (
            <p className="px-2 text-sm text-white/60">No members found.</p>
          )}

          {!membersLoading && members && members.length > 0 && (
            <ul className="flex flex-col gap-y-1">
              {members.map((member) => {
                const isSelf = member._id === currentMember?._id;
                const canRemove = isAdmin && !isSelf && member.role !== 'admin';
                return (
                  <li key={member._id} className="group flex items-center gap-x-3 rounded-md px-2 py-2 hover:bg-white/10">
                    <Avatar className="size-7 shrink-0">
                      <AvatarImage src={member.user.image} />
                      <AvatarFallback className="text-xs">
                        {member.user.name?.charAt(0).toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium text-white">
                        {member.user.name ?? 'Unknown'}{isSelf ? ' (you)' : ''}
                      </span>
                      <span className="text-xs capitalize text-white/60">{member.role}</span>
                    </div>

                    {canRemove && (
                      <button
                        onClick={() => setMemberToRemove({ id: member._id, name: member.user.name ?? 'Unknown' })}
                        className="ml-auto shrink-0 rounded p-1 text-white/60 opacity-0 hover:bg-rose-500/20 hover:text-rose-400 group-hover:opacity-100"
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
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Member Activity</p>

          {eventsLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader className="size-4 animate-spin text-white/60" />
            </div>
          )}

          {!eventsLoading && (!events || events.length === 0) && (
            <p className="px-2 text-sm text-white/60">No member activity yet.</p>
          )}

          {!eventsLoading && events && events.length > 0 && (
            <ul className="flex flex-col gap-y-1">
              {(events as MemberEvent[]).map((event) => (
                <li key={event._id} className="flex items-start gap-x-3 rounded-md px-2 py-2 hover:bg-white/10">
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
                    <span className="truncate text-sm font-medium text-white">{event.targetName}</span>
                    <span className="text-xs text-white/60">
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
    </div>
  );
};
