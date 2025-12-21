import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type ChangePasswordInput = z.infer<typeof api.admin.changePassword.input>;
type LoginInput = z.infer<typeof api.admin.login.input>;

export function useAdminLogin() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await fetch(api.admin.login.path, {
        method: api.admin.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid password");
        throw new Error("Login failed");
      }
      return api.admin.login.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Admin access granted" });
    },
    onError: (error) => {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    }
  });
}

export function useAdminChangePassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ChangePasswordInput) => {
      const res = await fetch(api.admin.changePassword.path, {
        method: api.admin.changePassword.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 403) throw new Error("Unauthorized");
        throw new Error("Failed to change password");
      }
      return api.admin.changePassword.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Admin password updated" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}
