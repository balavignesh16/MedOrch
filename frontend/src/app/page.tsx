import React, { Suspense } from 'react';
import { HomeDashboardClient } from './HomeDashboardClient';
import {
  getGlobalSearch,
  getPlatformNotifications,
  getPlatformWorkspaces,
  getPlatformTimeline
} from '@/app/actions/platformDb';

export const dynamic = 'force-dynamic';

export default async function PlatformHomePage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === 'string' ? searchParams.q : '';

  // Use Promise.all to fetch all platform data concurrently
  const [
    searchData,
    notifications,
    workspaces,
    timeline
  ] = await Promise.all([
    getGlobalSearch(query),
    getPlatformNotifications(),
    getPlatformWorkspaces(),
    getPlatformTimeline()
  ]);

  return (
    <div className="min-h-screen bg-background">
       <Suspense fallback={<div className="h-96 flex items-center justify-center text-brand-teal">Loading Enterprise Platform...</div>}>
          <HomeDashboardClient 
             searchData={searchData}
             notifications={notifications}
             workspaces={workspaces}
             timeline={timeline}
          />
       </Suspense>
    </div>
  );
}
