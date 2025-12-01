import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, Shield, Mail, Calendar, User, XCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatform } from '@/contexts/PlatformContext';
import { useToast } from '@/hooks/use-toast';

interface InvitationDetails {
  id: number;
  email: string;
  platform: string;
  platform_name: string;
  role?: string;
  message?: string;
  expires_at?: string;
  status?: string;
  created_at: string;
}

const AcceptInvitation = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { setSelectedPlatformId } = usePlatform();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailMismatch, setEmailMismatch] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation token');
      setLoading(false);
      return;
    }

    // If not authenticated, redirect to register first with return URL
    if (!authLoading && !isAuthenticated) {
      const returnUrl = `/invitations/accept/${token}`;
      navigate(`/register?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // If authenticated, fetch invitation details
    if (isAuthenticated && token) {
      fetchInvitationDetails();
    }
  }, [token, isAuthenticated, authLoading, navigate]);

  const fetchInvitationDetails = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getInvitationByToken(token);
      console.log('Invitation response from API:', response);
      
      // Handle nested invitation structure
      const invitationData = response.invitation || response;
      
      // Normalize the invitation data
      const normalizedInvitation: InvitationDetails = {
        id: invitationData.id,
        email: invitationData.email,
        platform: invitationData.platform,
        platform_name: invitationData.platform_name || 'Unknown Platform',
        role: invitationData.role,
        message: invitationData.message,
        expires_at: invitationData.expires_at,
        status: invitationData.status || 'pending',
        created_at: invitationData.created_at,
      };
      
      console.log('Normalized invitation:', normalizedInvitation);
      setInvitation(normalizedInvitation);
      
      // Check if invitation email matches logged-in user email
      // Use user_email from response if available, otherwise use invitation email
      const responseUserEmail = response.user_email || invitationData.email;
      if (user && responseUserEmail && user.email !== responseUserEmail) {
        setEmailMismatch(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invitation details');
      console.error('Error fetching invitation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;
    
    setAccepting(true);
    try {
      const response = await apiService.acceptInvitation(token);
      console.log('Accept invitation response:', response);
      
      // Handle nested response structure
      const responseData = response.invitation || response;
      const platformId = responseData?.platform || response?.platform || invitation?.platform;
      
      // Set the platform ID in context and localStorage
      if (platformId) {
        setSelectedPlatformId(platformId);
      }
      
      toast({
        title: 'Invitation accepted',
        description: `You have been added to ${invitation?.platform_name || 'the platform'}`,
      });
      
      // Redirect to platform details page
      if (platformId) {
        navigate(`/platforms/${platformId}`);
      } else {
        navigate('/platforms');
      }
    } catch (err: any) {
      toast({
        title: 'Failed to accept invitation',
        description: err.message || 'An error occurred while accepting the invitation',
        variant: 'destructive',
      });
      console.error('Error accepting invitation:', err);
    } finally {
      setAccepting(false);
    }
  };

  const isExpired = () => {
    if (!invitation?.expires_at) return false;
    return new Date(invitation.expires_at) < new Date();
  };

  const getRoleColor = (role: string | undefined) => {
    if (!role) return 'bg-gray-100 text-gray-800';
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      analyst: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      viewer: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    };
    return colors[role.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading invitation details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => navigate('/platforms')}
            >
              Go to Platforms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-center">Platform Invitation</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join a security platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Mismatch Warning */}
          {emailMismatch && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation was sent to <strong>{invitation.email}</strong>, but you're logged in as <strong>{user?.email}</strong>. 
                Please log in with the correct email address.
              </AlertDescription>
            </Alert>
          )}

          {/* Expired Warning */}
          {isExpired() && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation has expired. Please request a new invitation.
              </AlertDescription>
            </Alert>
          )}

          {/* Invitation Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Platform</p>
                <p className="font-semibold">{invitation.platform_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Invited Email</p>
                <p className="font-semibold">{invitation.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <User className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge className={getRoleColor(invitation.role)}>
                  {invitation.role || 'viewer'}
                </Badge>
              </div>
            </div>

            {invitation.expires_at && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="font-semibold">
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {invitation.message && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Message</p>
                <p className="text-sm">{invitation.message}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/platforms')}
              disabled={accepting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline
            </Button>
            <Button
              className="flex-1 gradient-primary"
              onClick={handleAccept}
              disabled={accepting || emailMismatch || isExpired() || (invitation.status && invitation.status !== 'pending' && invitation.status !== undefined)}
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
          </div>

          {/* Only show status message if status is explicitly 'accepted' or 'cancelled' */}
          {invitation.status === 'accepted' && (
            <Alert>
              <AlertDescription>
                This invitation has already been accepted.
              </AlertDescription>
            </Alert>
          )}
          {invitation.status === 'cancelled' && (
            <Alert variant="destructive">
              <AlertDescription>
                This invitation has been cancelled.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;

