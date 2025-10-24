import React, { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const IPBlacklist = () => {
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIP, setNewIP] = useState("");
  const { toast } = useToast();

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const platformId = localStorage.getItem("selected_platform_id");
      if (!platformId) throw new Error("No platform selected");
      const response = await apiService.getBlacklist(platformId);
      setBlacklist(response);
    } catch (error) {
      toast({
        title: "Error fetching blacklist",
        description: "Failed to load blacklist data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addIPToBlacklist = async () => {
    if (!newIP) return;
    try {
      const platformId = localStorage.getItem("selected_platform_id");
      if (!platformId) throw new Error("No platform selected");
      await apiService.addToBlacklist({ platform_uuid: platformId, ip: newIP });
      toast({
        title: "IP Blacklisted",
        description: `${newIP} has been added to the blacklist.`,
        variant: "default",
      });
      setNewIP("");
      fetchBlacklist();
    } catch (error) {
      toast({
        title: "Error adding IP",
        description: "Failed to add IP to blacklist.",
        variant: "destructive",
      });
    }
  };

  const removeIPFromBlacklist = async (id: string) => {
    try {
      await apiService.removeFromBlacklist(id);
      toast({
        title: "IP Removed",
        description: "The IP has been removed from the blacklist.",
        variant: "default",
      });
      fetchBlacklist();
    } catch (error) {
      toast({
        title: "Error removing IP",
        description: "Failed to remove IP from blacklist.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>IP Blacklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Enter IP to blacklist"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
            />
            <Button onClick={addIPToBlacklist}>Add</Button>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : blacklist.length === 0 ? (
            <p>No blacklisted IPs found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-2">IP Address</th>
                  <th className="text-left px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blacklist.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-2">{item.ip}</td>
                    <td className="px-4 py-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeIPFromBlacklist(item.id)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IPBlacklist;
