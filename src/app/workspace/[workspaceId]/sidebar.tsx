'use client';

import { Bell, Film, Home, MessagesSquare, MoreHorizontal } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { UserButton } from '@/features/auth/components/user-button';
import { useGetActivityUnreadCount } from '@/features/activities/api/use-get-activity-unread-count';
import { useGetDmUnreadCount } from '@/features/conversations/api/use-get-dm-unread-count';
import { useReelsFeedModal } from '@/features/reels/store/use-reels-feed-modal';
import { useMobileSidebar } from '@/features/workspaces/store/use-mobile-sidebar';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { cn } from '@/lib/utils';

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
  /** When true, renders as the left vertical sidepane inside the mobile drawer */
  isMobileDrawer?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar = ({
  morePanelOpen,
  onMoreToggle,
  activityPanelOpen,
  onActivityToggle,
  dmsPanelOpen,
  onDmsToggle,
  onHomeClick,
  isMobileDrawer = false,
  onCloseMobile,
}: SidebarProps) => {
  const pathname = usePathname();
  const workspaceId = useWorkspaceId();
  const { openReelsFeed, isOpen: isReelsOpen } = useReelsFeedModal();
  const [, setMobileSidebarOpen] = useMobileSidebar();

  const { data: activityUnreadCount } = useGetActivityUnreadCount({ workspaceId });
  const { data: dmUnreadCount } = useGetDmUnreadCount();

  const handleCloseMobile = () => {
    if (onCloseMobile) {
      onCloseMobile();
    } else {
      setMobileSidebarOpen(false);
    }
  };

  const navButtons = (
    <div className="flex flex-col items-center gap-y-3.5">
      <div onClick={onHomeClick}>
        <SidebarButton
          icon={Home}
          label="Home"
          isActive={!morePanelOpen && !activityPanelOpen && !dmsPanelOpen && !isReelsOpen && pathname.includes('/workspace')}
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
      <div
        onClick={() => {
          openReelsFeed();
          if (isMobileDrawer) handleCloseMobile();
        }}
      >
        <SidebarButton
          icon={Film}
          label="Reels"
          isActive={isReelsOpen}
        />
      </div>
      <div onClick={onMoreToggle}>
        <SidebarButton icon={MoreHorizontal} label="More" isActive={morePanelOpen} />
      </div>
    </div>
  );

  return (
    <aside
      className={cn(
        'h-full flex-col items-center border-r border-black/20 bg-[var(--sidebar)]',
        isMobileDrawer
          ? 'flex w-[68px] shrink-0 gap-y-3.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]'
          : 'hidden w-[70px] shrink-0 gap-y-4 pb-[4px] pt-[9px] md:flex',
      )}
    >
      <WorkspaceSwitcher />

      {navButtons}

      <div className="mt-auto flex flex-col items-center justify-center gap-y-1">
        <UserButton />
      </div>
    </aside>
  );
};
