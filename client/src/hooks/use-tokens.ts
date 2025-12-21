import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useTokens() {
  return useQuery({
    queryKey: [api.tokens.list.path],
    queryFn: async () => {
      const res = await fetch(api.tokens.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tokens");
      return api.tokens.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateToken() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { label?: string }) => {
      const res = await fetch(api.tokens.create.path, {
        method: api.tokens.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to create token");
      return api.tokens.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tokens.list.path] });
      toast({ title: "Token Generated", description: "Make sure to copy your new token immediately." });
    },
  });
}

export function useDeleteToken() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.tokens.delete.path, { id });
      const res = await fetch(url, { 
        method: api.tokens.delete.method,
        credentials: "include"
      });
      
      if (!res.ok) throw new Error("Failed to revoke token");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tokens.list.path] });
      toast({ title: "Revoked", description: "API token has been revoked." });
    },
  });
}
