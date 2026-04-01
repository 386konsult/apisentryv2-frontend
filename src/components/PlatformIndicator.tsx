import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Settings } from 'lucide-react';
import { usePlatform } from '@/contexts/PlatformContext';
import { useNavigate } from 'react-router-dom';

const PlatformIndicator: React.FC = () => {
  const { selectedPlatformId, hasSelectedPlatform } = usePlatform();
  const navigate = useNavigate();

  if (!hasSelectedPlatform) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/platforms')}
        className="text-orange-600 border-orange-200 hover:bg-orange-50"
      >
        <Globe className="w-4 h-4 mr-2" />
        Select Workspace
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        <Globe className="w-3 h-3 mr-1" />
        Workspace Selected
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/platforms')}
        className="text-muted-foreground hover:text-foreground"
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default PlatformIndicator;
