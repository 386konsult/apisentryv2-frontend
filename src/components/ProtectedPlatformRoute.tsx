import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePlatform } from '@/contexts/PlatformContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';

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

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xl">Platform Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You need to select a platform before accessing this feature. 
              Please choose a platform from your available options.
            </p>
            <Button 
              onClick={() => window.location.href = '/platforms'} 
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Platforms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedPlatformRoute;
