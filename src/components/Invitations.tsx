import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OrganisationInvitation {
  id: string;
  organisation_name: string;
  role: 'org_admin' | 'org_member';
  created_at: string;
  expires_at: string;
  token: string;
  status: string;
  invited_by_email?: string;   // sender's email (for received invitations)
  email?: string;              // recipient's email (for sent invitations)
}

export default function Invitations() {
  const [received, setReceived] = useState<OrganisationInvitation[]>([]);
  const [sent, setSent] = useState<OrganisationInvitation[]>([]);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [loadingSent, setLoadingSent] = useState(true);
  const { toast } = useToast();

  const fetchReceived = async () => {
    setLoadingReceived(true);
    try {
      const data = await apiService.getMyInvitations('received');
      setReceived(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to load received invitations', variant: 'destructive' });
    } finally {
      setLoadingReceived(false);
    }
  };

  const fetchSent = async () => {
    setLoadingSent(true);
    try {
      const data = await apiService.getMyInvitations('sent');
      setSent(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to load sent invitations', variant: 'destructive' });
    } finally {
      setLoadingSent(false);
    }
  };

  useEffect(() => {
    fetchReceived();
    fetchSent();
  }, []);

  const acceptInvitation = async (token: string) => {
    try {
      await apiService.acceptOrganisationInvitation(token);
      toast({ title: 'Accepted!', description: 'You can now access the organisation.' });
      fetchReceived(); // refresh list
    } catch (error: any) {
      let msg = error.message || 'Failed to accept invitation';
      if (error.body && error.body.error) msg = error.body.error;
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    // TODO: implement cancel endpoint (DELETE /auth/invitations/<id>/cancel/)
    toast({ title: 'Info', description: 'Cancel functionality coming soon.' });
  };

  const ReceivedTab = () => (
    <div className="space-y-4">
      {loadingReceived ? (
        <div className="text-center py-8">Loading...</div>
      ) : received.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No pending invitations.
          </CardContent>
        </Card>
      ) : (
        received.map((inv) => (
          <Card key={inv.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Join {inv.organisation_name}</span>
                <Badge variant={inv.role === 'org_admin' ? 'default' : 'secondary'}>
                  {inv.role === 'org_admin' ? 'Admin' : 'Member'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="text-sm text-muted-foreground">
                {inv.invited_by_email && <div>From: {inv.invited_by_email}</div>}
                <div>Invited: {new Date(inv.created_at).toLocaleDateString()}</div>
                <div>Expires: {new Date(inv.expires_at).toLocaleDateString()}</div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => acceptInvitation(inv.token)}>Accept</Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const SentTab = () => (
    <div className="space-y-4">
      {loadingSent ? (
        <div className="text-center py-8">Loading...</div>
      ) : sent.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No invitations sent.
          </CardContent>
        </Card>
      ) : (
        sent.map((inv) => (
          <Card key={inv.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>To: {inv.email || 'Unknown'}</span>
                <Badge variant="outline">{inv.role === 'org_admin' ? 'Admin' : 'Member'}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="text-sm text-muted-foreground">
                <div>Organisation: {inv.organisation_name}</div>
                <div>Sent: {new Date(inv.created_at).toLocaleDateString()}</div>
                <div>Expires: {new Date(inv.expires_at).toLocaleDateString()}</div>
                <div>Status: <span className="capitalize">{inv.status}</span></div>
              </div>
              {inv.status === 'pending' && (
                <div className="flex justify-end">
                  <Button variant="destructive" onClick={() => cancelInvitation(inv.id)}>Cancel</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Invitations</h1>
      <Tabs defaultValue="received">
        <TabsList className="mb-4">
          <TabsTrigger value="received">Received</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>
        <TabsContent value="received">
          <ReceivedTab />
        </TabsContent>
        <TabsContent value="sent">
          <SentTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}