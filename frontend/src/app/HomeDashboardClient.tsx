'use client';

import React from 'react';
import { HomeDashboard } from '@/components/platform/home-dashboard';
import type {
  getGlobalSearch,
  getPlatformNotifications,
  getPlatformTimeline,
  getPlatformWorkspaces,
} from '@/app/actions/platformDb';

interface HomeDashboardClientProps {
  searchData: Awaited<ReturnType<typeof getGlobalSearch>>;
  notifications: Awaited<ReturnType<typeof getPlatformNotifications>>;
  workspaces: Awaited<ReturnType<typeof getPlatformWorkspaces>>;
  timeline: Awaited<ReturnType<typeof getPlatformTimeline>>;
}

export function HomeDashboardClient({
  searchData,
  notifications,
  workspaces,
  timeline
}: HomeDashboardClientProps) {
  return (
     <HomeDashboard 
        searchData={searchData}
        notifications={notifications}
        workspaces={workspaces}
        timeline={timeline}
     />
  );
}
