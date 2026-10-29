'use client';

import { ChevronLeft, Loader, Settings, Trash2, X } from 'lucide-react';
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
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useRemoveMember } from '@/features/members/api/use-remove-member';
import { useCurrentMember } from '@/features/members/api/use-current-member';
import { useGetWorkspace } from '@/features/workspaces/api/use-get-workspace';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { Button } from '@/components/ui/button';
import { useMobileSidebar } from '@/features/workspaces/store/use-mobile-sidebar';
import type { Id } from '@/../convex/_generated/dataModel';

import { PreferencesModal } from './preferences-modal';

interface MorePanelProps {
  onClose: () => void;
}

export const MorePanel = ({ onClose }: MorePanelProps) => {
  const workspaceId = useWorkspaceId();
  const [, setMobileSidebarOpen] = useMobileSidebar();
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: Id<'members'>; name: string } | null>(null);

  const { data: workspace } = useGetWorkspace({ id: workspaceId });
  const { data: currentMember } = useCurrentMember({ workspaceId });
  const { data: members, isLoading: membersLoading } = useGetMembers({ workspaceId });
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
        <h2 className="flex-1 text-base font-semibold text-white">More</h2>
        <Button
          variant="transparent"
          size="iconSm"
          className="text-white/80 hover:bg-white/10 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close sidebar"
          title="Close sidebar"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-y-6 overflow-y-auto px-4 py-2">

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
                        className="ml-auto shrink-0 rounded p-1 text-white/60 opacity-0 hover:bg-rose-500/20 hover:text-rose-400 max-md:opacity-100 group-hover:opacity-100"
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
      </div>
    </div>
  );
};
