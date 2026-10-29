'use client';

import { Loader } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';

import type { Id } from '@/../convex/_generated/dataModel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Profile } from '@/features/members/components/profile';
import { Thread } from '@/features/messages/components/thread';
import { ReelsFeedModal } from '@/features/reels/components/reels-feed-modal';
import { useMobileSidebar } from '@/features/workspaces/store/use-mobile-sidebar';
import { useDesktopNotifications } from '@/hooks/use-desktop-notifications';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { usePanel } from '@/hooks/use-panel';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

import { ActivityPanel } from './activity-panel';
import { DmsPanel } from './dms-panel';
import { MorePanel } from './more-panel';
import { Sidebar } from './sidebar';
import { Toolbar } from './toolbar';
import { WorkspaceSidebar } from './workspace-sidebar';

const WorkspaceIdLayout = ({ children }: Readonly<PropsWithChildren>) => {
  const workspaceId = useWorkspaceId();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { parentMessageId, profileMemberId, onClose, onOpenMessage } = usePanel();

  useDesktopNotifications(workspaceId);
  const [morePanelOpen, setMorePanelOpen] = useState(false);
  const [activityPanelOpen, setActivityPanelOpen] = useState(false);
  const [dmsPanelOpen, setDmsPanelOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useMobileSidebar();
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  const showPanel = !!parentMessageId || !!profileMemberId;

  // Track exact visible viewport height on mobile, dynamically contracting when virtual keyboard opens
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const updateHeight = () => {
      setViewportHeight(vv.height);
    };

    updateHeight();
    vv.addEventListener('resize', updateHeight);
    vv.addEventListener('scroll', updateHeight);

    return () => {
      vv.removeEventListener('resize', updateHeight);
      vv.removeEventListener('scroll', updateHeight);
    };
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, setMobileSidebarOpen]);

  const handleHomeClick = () => {
    setMorePanelOpen(false);
    setActivityPanelOpen(false);
    setDmsPanelOpen(false);
  };

  const handleMoreToggle = () => {
    setMorePanelOpen((v) => !v);
    setActivityPanelOpen(false);
    setDmsPanelOpen(false);
  };

  const handleActivityToggle = () => {
    setActivityPanelOpen((v) => !v);
    setMorePanelOpen(false);
    setDmsPanelOpen(false);
  };

  const handleDmsToggle = () => {
    setDmsPanelOpen((v) => !v);
    setMorePanelOpen(false);
    setActivityPanelOpen(false);
  };

  const sidebarPanelContent = activityPanelOpen ? (
    <ActivityPanel
      onClose={() => {
        setActivityPanelOpen(false);
        setMobileSidebarOpen(false);
      }}
    />
  ) : dmsPanelOpen ? (
    <DmsPanel
      onClose={() => {
        setDmsPanelOpen(false);
        setMobileSidebarOpen(false);
      }}
    />
  ) : morePanelOpen ? (
    <MorePanel
      onClose={() => {
        setMorePanelOpen(false);
        setMobileSidebarOpen(false);
      }}
    />
  ) : (
    <WorkspaceSidebar />
  );

  const activePanelContent = parentMessageId ? (
    <Thread messageId={parentMessageId as Id<'messages'>} onClose={onClose} />
  ) : profileMemberId ? (
    <Profile memberId={profileMemberId as Id<'members'>} onClose={onClose} />
  ) : (
    <div className="flex h-full items-center justify-center">
      <Loader className="size-5 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div
      className="flex flex-col overflow-hidden bg-background"
      style={{
        height: viewportHeight ? `${viewportHeight}px` : '100dvh',
        maxHeight: viewportHeight ? `${viewportHeight}px` : '100dvh',
      }}
    >
      <Toolbar onMenuClick={() => setMobileSidebarOpen(true)} />

      {/* Global Reels & Shorts Feed Modal */}
      <ReelsFeedModal onOpenThread={onOpenMessage} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          morePanelOpen={morePanelOpen}
          onMoreToggle={handleMoreToggle}
          activityPanelOpen={activityPanelOpen}
          onActivityToggle={handleActivityToggle}
          dmsPanelOpen={dmsPanelOpen}
          onDmsToggle={handleDmsToggle}
          onHomeClick={handleHomeClick}
        />

        {/* `children` and the thread/profile panel must only ever be mounted in one place at
            a time (they hold live Convex subscriptions and a Quill editor instance) - so the
            mobile/desktop layouts are switched in JS rather than just hidden with CSS. */}
        {isMobile ? (
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
        ) : (
          <ResizablePanelGroup id="workspace-panel-group" direction="horizontal" autoSaveId="slack-clone-workspace-layout">
            <ResizablePanel id="workspace-panel-sidebar" defaultSize={20} minSize={11} className="bg-[var(--workspace-sidebar)]">
              {sidebarPanelContent}
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel id="workspace-panel-main" defaultSize={80} minSize={20}>
              {children}
            </ResizablePanel>

            {showPanel && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel id="workspace-panel-thread" minSize={20} defaultSize={29}>
                  {activePanelContent}
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        )}
      </div>

      {isMobile && (
        <>
          {/* Mobile channel/DM list drawer */}
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetContent
              side="left"
              className="flex h-screen h-[100dvh] w-[90vw] max-w-[360px] flex-row gap-0 border-r border-white/10 bg-[var(--workspace-sidebar)] p-0 shadow-2xl"
              hideClose
            >
              {/* Left Sidepane within the mobile sidebar */}
              <Sidebar
                morePanelOpen={morePanelOpen}
                onMoreToggle={handleMoreToggle}
                activityPanelOpen={activityPanelOpen}
                onActivityToggle={handleActivityToggle}
                dmsPanelOpen={dmsPanelOpen}
                onDmsToggle={handleDmsToggle}
                onHomeClick={handleHomeClick}
                isMobileDrawer
                onCloseMobile={() => setMobileSidebarOpen(false)}
              />

              {/* Right Content Area within the mobile sidebar */}
              <div
                className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-[var(--workspace-sidebar)] pb-[env(safe-area-inset-bottom)]"
                onClickCapture={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('a')) {
                    setMobileSidebarOpen(false);
                  }
                }}
              >
                {sidebarPanelContent}
              </div>
            </SheetContent>
          </Sheet>

          {/* Mobile thread/profile overlay - Thread/Profile already render their own close button */}
          <Sheet open={showPanel} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="flex h-screen h-[100dvh] w-full max-w-full flex-col gap-0 p-0 pb-[env(safe-area-inset-bottom)]" hideClose>
              {activePanelContent}
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
};

export default WorkspaceIdLayout;
