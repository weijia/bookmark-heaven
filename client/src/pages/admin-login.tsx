import { useState } from "react";
import { useAdminLogin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const { mutate: login, isPending } = useAdminLogin();
  const [_, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ password }, {
      onSuccess: () => {
        setLocation("/admin");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">Admin Access</CardTitle>
          <CardDescription>Enter admin password to continue.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <Input 
              type="password" 
              placeholder="Admin Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-center text-lg"
              autoFocus
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full bg-primary" disabled={isPending || !password}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock Dashboard"}
            </Button>
            <Link href="/" className="text-sm text-muted-foreground hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to Home
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
