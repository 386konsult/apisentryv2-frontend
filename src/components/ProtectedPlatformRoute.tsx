import React from 'react';
import { usePlatform } from '@/contexts/PlatformContext';
import WorkspaceAccessGate from '@/components/WorkspaceAccessGate';

const ProtectedPlatformRoute: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const {
    hasSelectedPlatform,
    isPlatformAccessible,
    selectedPlatformName,
    platformOwner,
  } = usePlatform();

  // ① No workspace selected at all
  if (!hasSelectedPlatform) {
    if (fallback) return <>{fallback}</>;
    return <WorkspaceAccessGate variant="no_platform" />;
  }

  // ② Still verifying access — show nothing to avoid a flash
  if (isPlatformAccessible === null) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400 dark:text-slate-500">Verifying workspace access…</p>
        </div>
      </div>
    );
  }

  // ③ Platform selected but user has no access
  if (isPlatformAccessible === false) {
    if (fallback) return <>{fallback}</>;
    return (
      <WorkspaceAccessGate
        variant="no_access"
        platformName={selectedPlatformName}
        platformOwner={platformOwner}
      />
    );
  }

  // ④ All good — render the page
  return <>{children}</>;
};

export default ProtectedPlatformRoute;
