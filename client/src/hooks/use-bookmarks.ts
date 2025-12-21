import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertBookmark } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

type BookmarksParams = {
  page?: number;
  limit?: number;
  search?: string;
  isPublic?: 'true' | 'false';
};

export function useBookmarks(params: BookmarksParams = {}) {
  const queryKey = [api.bookmarks.list.path, JSON.stringify(params)];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Build query string manually since URLSearchParams handles undefined oddly sometimes
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.search) searchParams.set('search', params.search);
      if (params.isPublic) searchParams.set('isPublic', params.isPublic);

      const url = `${api.bookmarks.list.path}?${searchParams.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      return api.bookmarks.list.responses[200].parse(await res.json());
    },
    placeholderData: (previousData) => previousData, // Keep data while fetching next page
  });
}

export function useCreateBookmark() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertBookmark) => {
      const res = await fetch(api.bookmarks.create.path, {
        method: api.bookmarks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create bookmark");
      }
      return api.bookmarks.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bookmarks.list.path] });
      toast({ title: "Bookmark created", description: "Successfully saved to your collection." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}

export function useUpdateBookmark() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InsertBookmark> & { id: number }) => {
      const url = buildUrl(api.bookmarks.update.path, { id });
      const res = await fetch(url, {
        method: api.bookmarks.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update bookmark");
      return api.bookmarks.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bookmarks.list.path] });
      toast({ title: "Updated", description: "Bookmark details updated successfully." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.bookmarks.delete.path, { id });
      const res = await fetch(url, { 
        method: api.bookmarks.delete.method,
        credentials: "include"
      });
      
      if (!res.ok) throw new Error("Failed to delete bookmark");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bookmarks.list.path] });
      toast({ title: "Deleted", description: "Bookmark removed." });
    },
  });
}
