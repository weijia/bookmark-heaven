import { useState } from "react";
import { useAdminChangePassword } from "@/hooks/use-admin";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout";
import { Loader2, ShieldAlert } from "lucide-react";

export default function AdminDashboard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { mutate: changePassword, isPending } = useAdminChangePassword();
  const { data: user } = useUser();

  if (user && !user.isAdmin) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You do not have administrative privileges.</p>
        </div>
      </Layout>
    );
  }

  const handleChangePassword = () => {
    changePassword({ currentPassword, newPassword }, {
      onSuccess: () => {
        setCurrentPassword("");
        setNewPassword("");
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">System configuration and security.</p>
        </div>

        <Card className="border-destructive/20 shadow-sm">
          <CardHeader>
            <CardTitle>Change Admin Password</CardTitle>
            <CardDescription>
              Update the master password used to access this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <Input 
                type="password" 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
              />
            </div>
            <Button 
              onClick={handleChangePassword} 
              disabled={isPending || !currentPassword || !newPassword}
              className="w-full sm:w-auto"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
