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
  const { parentMessageId, profileMemberId, onClose } = usePanel();

  useDesktopNotifications(workspaceId);
  const [morePanelOpen, setMorePanelOpen] = useState(false);
  const [activityPanelOpen, setActivityPanelOpen] = useState(false);
  const [dmsPanelOpen, setDmsPanelOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const showPanel = !!parentMessageId || !!profileMemberId;

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

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
    <ActivityPanel onClose={() => setActivityPanelOpen(false)} />
  ) : morePanelOpen ? (
    <MorePanel onClose={() => setMorePanelOpen(false)} />
  ) : dmsPanelOpen ? (
    <DmsPanel onClose={() => setDmsPanelOpen(false)} />
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
    <div className="h-full">
      <Toolbar onMenuClick={() => setMobileSidebarOpen(true)} />

      <div className="flex h-[calc(100vh_-_40px)]">
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
          <div className="min-w-0 flex-1">{children}</div>
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
            <SheetContent side="left" className="w-[85vw] max-w-sm gap-0 p-0" hideClose>
              <Sidebar
                morePanelOpen={morePanelOpen}
                onMoreToggle={handleMoreToggle}
                activityPanelOpen={activityPanelOpen}
                onActivityToggle={handleActivityToggle}
                dmsPanelOpen={dmsPanelOpen}
                onDmsToggle={handleDmsToggle}
                onHomeClick={handleHomeClick}
                mobileHorizontal
              />

              {/* Clicking a channel/DM link should always close the drawer, even when it's a
                  link to the already-active route (pathname wouldn't change in that case). */}
              <div
                className="min-h-0 flex-1 overflow-y-auto bg-[var(--workspace-sidebar)]"
                onClickCapture={(e) => {
                  if ((e.target as HTMLElement).closest('a')) setMobileSidebarOpen(false);
                }}
              >
                {sidebarPanelContent}
              </div>
            </SheetContent>
          </Sheet>

          {/* Mobile thread/profile overlay - Thread/Profile already render their own close button */}
          <Sheet open={showPanel} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-full max-w-full gap-0 p-0" hideClose>
              {activePanelContent}
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
};

export default WorkspaceIdLayout;
