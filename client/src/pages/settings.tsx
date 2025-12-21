import { useTokens, useCreateToken, useDeleteToken } from "@/hooks/use-tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Trash2, Key, Copy, Check } from "lucide-react";
import { useState } from "react";
import Layout from "@/components/layout";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [label, setLabel] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { data: tokens, isLoading } = useTokens();
  const { mutate: createToken, isPending: isCreating } = useCreateToken();
  const { mutate: deleteToken } = useDeleteToken();
  const { toast } = useToast();

  const handleCreate = () => {
    createToken({ label }, {
      onSuccess: (data) => {
        setNewToken(data.token);
        setLabel("");
      }
    });
  };

  const copyToken = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      setCopied(true);
      toast({ title: "Copied", description: "Token copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your API access and security.</p>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              <CardTitle>API Tokens</CardTitle>
            </div>
            <CardDescription>
              Create tokens to access your bookmarks programmatically via the API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Create Token Form */}
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <span className="text-sm font-medium">Token Label</span>
                <Input 
                  placeholder="e.g. CLI Tool, Mobile App" 
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                />
              </div>
              <Button onClick={handleCreate} disabled={isCreating || !label}>
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Token"}
              </Button>
            </div>

            {/* New Token Display */}
            {newToken && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Token generated successfully! Copy it now, you won't see it again.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background p-2 rounded border border-border font-mono text-sm break-all">
                    {newToken}
                  </code>
                  <Button size="icon" variant="ghost" onClick={copyToken}>
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Token List */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Tokens</h3>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <div key={i} className="h-12 bg-muted/20 animate-pulse rounded" />)}
                </div>
              ) : tokens?.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No active tokens.</p>
              ) : (
                <div className="space-y-3">
                  {tokens?.map(token => (
                    <div key={token.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                      <div>
                        <p className="font-medium text-sm">{token.label || "Untitled Token"}</p>
                        <p className="text-xs text-muted-foreground">
                          Created on {new Date(token.createdAt || "").toLocaleDateString()}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteToken(token.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
