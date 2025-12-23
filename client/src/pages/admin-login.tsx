import { useState } from "react";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { LogIn, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminLogin() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: login, isPending: isLoginPending } = useLogin();
  const { mutate: register, isPending: isRegisterPending } = useRegister();
  const [_, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      register({ username, email, password }, {
        onSuccess: () => setLocation("/"),
      });
    } else {
      login({ username, password }, {
        onSuccess: () => setLocation("/"),
      });
    }
  };

  const isPending = isLoginPending || isRegisterPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">
            {isRegister ? "Create Account" : "Login"}
          </CardTitle>
          <CardDescription>
            {isRegister
              ? "Sign up to save bookmarks"
              : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3">
            <Input 
              placeholder="Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isPending}
            />
            {isRegister && (
              <Input 
                type="email"
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
              />
            )}
            <Input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              type="submit" 
              className="w-full bg-primary" 
              disabled={isPending || !username || (isRegister && !email) || !password}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRegister ? (
                "Create Account"
              ) : (
                "Login"
              )}
            </Button>
            <button 
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setUsername("");
                setEmail("");
                setPassword("");
              }}
              className="text-sm text-muted-foreground hover:underline"
            >
              {isRegister ? "Already have an account? Login" : "Don't have an account? Sign up"}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
