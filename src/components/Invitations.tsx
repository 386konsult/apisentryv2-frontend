import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OrganisationInvitation {
  id: string;
  organisation_name: string;
  role: 'org_admin' | 'org_member';
  created_at: string;
  expires_at: string;
  token: string;
  status: string;
}

export default function Invitations() {
  const [invitations, setInvitations] = useState<OrganisationInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInvitations = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching invitations...');
      const data = await apiService.getMyInvitations();
      console.log('Received invitations:', data);
      setInvitations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Fetch error:', error);
      setError(error.message || 'Failed to load invitations');
      toast({ title: 'Error', description: error.message || 'Failed to load invitations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const acceptInvitation = async (token: string) => {
  try {
    await apiService.acceptOrganisationInvitation(token);
    toast({ title: 'Accepted!', description: 'You can now access the organisation.' });
    fetchInvitations();
  } catch (error: any) {
    console.error('Accept error:', error);
    let msg = error.message || 'Failed to accept invitation';
    if (error.body && error.body.error) msg = error.body.error;
    toast({ title: 'Error', description: msg, variant: 'destructive' });
  }
};

  if (loading) return <div className="p-8 text-center">Loading invitations...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pending Invitations</h1>
      {invitations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No pending invitations.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => (
            <Card key={inv.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Join {inv.organisation_name}</span>
                  <Badge variant={inv.role === 'org_admin' ? 'default' : 'secondary'}>
                    {inv.role === 'org_admin' ? 'Admin' : 'Member'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Invited: {new Date(inv.created_at).toLocaleDateString()}<br />
                  Expires: {new Date(inv.expires_at).toLocaleDateString()}
                </div>
                <Button onClick={() => acceptInvitation(inv.token)}>Accept</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}