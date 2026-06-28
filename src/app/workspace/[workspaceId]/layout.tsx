'use client';

import { Loader } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';

import type { Id } from '@/../convex/_generated/dataModel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Profile } from '@/features/members/components/profile';
import { Thread } from '@/features/messages/components/thread';
import { useDesktopNotifications } from '@/hooks/use-desktop-notifications';
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
  const { parentMessageId, profileMemberId, onClose } = usePanel();

  useDesktopNotifications(workspaceId);
  const [morePanelOpen, setMorePanelOpen] = useState(false);
  const [activityPanelOpen, setActivityPanelOpen] = useState(false);
  const [dmsPanelOpen, setDmsPanelOpen] = useState(false);

  const showPanel = !!parentMessageId || !!profileMemberId;

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

  return (
    <div className="h-full">
      <Toolbar />

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

        <ResizablePanelGroup id="workspace-panel-group" direction="horizontal" autoSaveId="slack-clone-workspace-layout">
          <ResizablePanel id="workspace-panel-sidebar" defaultSize={20} minSize={11} className="bg-[var(--workspace-sidebar)]">
            {activityPanelOpen ? (
              <ActivityPanel onClose={() => setActivityPanelOpen(false)} />
            ) : morePanelOpen ? (
              <MorePanel onClose={() => setMorePanelOpen(false)} />
            ) : dmsPanelOpen ? (
              <DmsPanel onClose={() => setDmsPanelOpen(false)} />
            ) : (
              <WorkspaceSidebar />
            )}
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel id="workspace-panel-main" defaultSize={80} minSize={20}>
            {children}
          </ResizablePanel>

          {showPanel && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel id="workspace-panel-thread" minSize={20} defaultSize={29}>
                {parentMessageId ? (
                  <Thread messageId={parentMessageId as Id<'messages'>} onClose={onClose} />
                ) : profileMemberId ? (
                  <Profile memberId={profileMemberId as Id<'members'>} onClose={onClose} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Loader className="size-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default WorkspaceIdLayout;
