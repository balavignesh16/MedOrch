'use client';

import React from 'react';
import { HomeDashboard } from '@/components/platform/home-dashboard';

interface HomeDashboardClientProps {
  searchData: any[];
  notifications: any[];
  workspaces: any[];
  timeline: any[];
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
