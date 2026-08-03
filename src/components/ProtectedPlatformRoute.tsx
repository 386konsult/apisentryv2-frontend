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

  // No workspace selected at all
  if (!hasSelectedPlatform) {
    if (fallback) return <>{fallback}</>;
    return <WorkspaceAccessGate variant="no_platform" />;
  }

  // Platform selected but definitively no access
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

  // Render immediately — null means still verifying in background, true means confirmed
  return <>{children}</>;
};

export default ProtectedPlatformRoute;
