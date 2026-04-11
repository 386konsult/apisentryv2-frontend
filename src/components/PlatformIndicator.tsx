import React from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { usePlatform } from '@/contexts/PlatformContext';
import { useNavigate, useLocation } from 'react-router-dom';

const PlatformIndicator: React.FC = () => {
  const { hasSelectedPlatform } = usePlatform();
  const navigate = useNavigate();
  const location = useLocation();

  const isOnPlatformsPage = location.pathname === '/platforms';

  return (
    <div className="flex items-center gap-2">
      {isOnPlatformsPage || !hasSelectedPlatform ? (
        <button
          onClick={() => navigate('/platforms')}
          className="flex items-center gap-1.5 rounded-full border border-orange-300 bg-white px-3 py-1 text-xs font-semibold text-orange-600 shadow-sm transition-all hover:border-orange-400 hover:bg-orange-50 hover:shadow-none dark:border-orange-700 dark:bg-orange-950 dark:text-orange-400 dark:hover:border-orange-600 dark:hover:bg-orange-900"
        >
          <Globe className="h-3.5 w-3.5" />
          Select Workspace
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      ) : (
        <button
          onClick={() => navigate('/platforms')}
          className="flex items-center gap-1.5 rounded-full border border-blue-300 bg-white px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50 hover:shadow-none dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:hover:border-blue-600 dark:hover:bg-blue-900"
        >
          <Globe className="h-3.5 w-3.5" />
          Workspace Selected
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      )}
    </div>
  );
};

export default PlatformIndicator;