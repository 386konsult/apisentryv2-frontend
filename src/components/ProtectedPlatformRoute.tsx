import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePlatform } from '@/contexts/PlatformContext';

interface ProtectedPlatformRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedPlatformRoute: React.FC<ProtectedPlatformRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { hasSelectedPlatform } = usePlatform();

  if (!hasSelectedPlatform) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Redirect to platforms page if no platform is selected
    return <Navigate to="/platforms" replace />;
  }

  return <>{children}</>;
};

export default ProtectedPlatformRoute;
