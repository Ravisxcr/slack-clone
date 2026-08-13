'use client';

import { Bell, Home, MessagesSquare, MoreHorizontal } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { UserButton } from '@/features/auth/components/user-button';
import { useGetActivityUnreadCount } from '@/features/activities/api/use-get-activity-unread-count';
import { useGetDmUnreadCount } from '@/features/conversations/api/use-get-dm-unread-count';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

import { SidebarButton } from './sidebar-button';
import { WorkspaceSwitcher } from './workspace-switcher';

interface SidebarProps {
  morePanelOpen: boolean;
  onMoreToggle: () => void;
  activityPanelOpen: boolean;
  onActivityToggle: () => void;
  dmsPanelOpen: boolean;
  onDmsToggle: () => void;
  onHomeClick: () => void;
  /** Renders as a horizontal top bar instead of a vertical rail, for use inside the mobile drawer. */
  mobileHorizontal?: boolean;
}

export const Sidebar = ({
  morePanelOpen,
  onMoreToggle,
  activityPanelOpen,
  onActivityToggle,
  dmsPanelOpen,
  onDmsToggle,
  onHomeClick,
  mobileHorizontal,
}: SidebarProps) => {
  const pathname = usePathname();
  const workspaceId = useWorkspaceId();

  const { data: activityUnreadCount } = useGetActivityUnreadCount({ workspaceId });
  const { data: dmUnreadCount } = useGetDmUnreadCount();

  const navButtons = (
    <>
      <div onClick={onHomeClick}>
        <SidebarButton
          icon={Home}
          label="Home"
          isActive={!morePanelOpen && !activityPanelOpen && !dmsPanelOpen && pathname.includes('/workspace')}
        />
      </div>
      <div onClick={onDmsToggle}>
        <SidebarButton
          icon={MessagesSquare}
          label="DMs"
          isActive={dmsPanelOpen}
          unreadCount={dmUnreadCount ?? 0}
        />
      </div>
      <div onClick={onActivityToggle}>
        <SidebarButton
          icon={Bell}
          label="Activity"
          isActive={activityPanelOpen}
          unreadCount={activityUnreadCount ?? 0}
        />
      </div>
      <div onClick={onMoreToggle}>
        <SidebarButton icon={MoreHorizontal} label="More" isActive={morePanelOpen} />
      </div>
    </>
  );

  if (mobileHorizontal) {
    return (
      <div className="flex items-center gap-x-2 border-b bg-[var(--sidebar)] px-3 py-2">
        <WorkspaceSwitcher />

        <div className="flex flex-1 items-center justify-around gap-x-1">{navButtons}</div>

        <UserButton />
      </div>
    );
  }

  return (
    <aside className="hidden h-full w-[70px] flex-col items-center gap-y-4 bg-[var(--sidebar)] pb-[4px] pt-[9px] md:flex">
      <WorkspaceSwitcher />

      {navButtons}

      <div className="mt-auto flex flex-col items-center justify-center gap-y-1">
        <UserButton />
      </div>
    </aside>
  );
};
