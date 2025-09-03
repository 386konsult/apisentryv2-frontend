import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Activity, Globe, Users, Settings, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';
import { API_BASE_URL } from '@/services/api';
import { usePlatform } from '@/contexts/PlatformContext';

interface Platform {
  id: string;
  name: string;
  environment: string;
  deployment_type: string;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  total_requests?: number;
  blocked_threats?: number;
  active_endpoints?: number;
}

const Platforms = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setSelectedPlatformId } = usePlatform();

  useEffect(() => {
    // Fetch platforms from backend API
    const fetchPlatforms = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE_URL}/platforms/`, {
          method: 'GET',
          credentials: 'include',
          headers: token ? { 'Authorization': `Token ${token}` } : {},
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to fetch platforms');
        }
        const data = await res.json();
        // If backend returns a list, use it directly; if paginated, use data.results
        const platformsList = Array.isArray(data) ? data : (data.results || []);
        setPlatforms(platformsList);
        localStorage.setItem('user_platforms', JSON.stringify(platformsList));
      } catch (error) {
        console.error('Error loading platforms:', error);
        toast({
          title: 'Error loading platforms',
          description: error.message || 'Failed to load your platforms',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPlatforms();
  }, [toast]);

  const handleSelectPlatform = (platform: Platform) => {
    setSelectedPlatformId(platform.id);
    navigate(`/platforms/${platform.id}`);
  };

  const handleCreateNewPlatform = () => {
    navigate('/onboarding');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      maintenance: 'destructive',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const getEnvironmentIcon = (environment: string) => {
    switch (environment) {
      case 'production':
        return <Globe className="h-4 w-4 text-red-500" />;
      case 'staging':
        return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'development':
        return <Settings className="h-4 w-4 text-blue-500" />;
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading platforms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Platforms</h1>
          <p className="text-muted-foreground">
            Manage and monitor your security platforms
          </p>
        </div>
        <Button onClick={handleCreateNewPlatform} className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create New Platform
        </Button>
      </div>

      {platforms.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No platforms yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first security platform to get started
            </p>
            <Button onClick={handleCreateNewPlatform} className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Platform
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => (
            <Card key={platform.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getEnvironmentIcon(platform.environment)}
                    <CardTitle className="text-lg">{platform.name}</CardTitle>
                  </div>
                  {getStatusBadge(platform.status)}
                </div>
                <CardDescription>
                  {platform.deployment_type === 'saas' ? 'SaaS (Managed)' : 'On-Premises'} • {platform.environment}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-lg">
                      {platform.total_requests?.toLocaleString() || '0'}
                    </div>
                    <div className="text-muted-foreground text-xs">Requests</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg text-red-600">
                      {platform.blocked_threats?.toLocaleString() || '0'}
                    </div>
                    <div className="text-muted-foreground text-xs">Blocked</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">
                      {platform.active_endpoints || '0'}
                    </div>
                    <div className="text-muted-foreground text-xs">Endpoints</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleSelectPlatform(platform)}
                    className="flex-1 gradient-primary"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Dashboard
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Platforms;