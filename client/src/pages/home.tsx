import { useState } from "react";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useUser } from "@/hooks/use-user";
import { BookmarkCard } from "@/components/bookmark-card";
import { BookmarkDialog } from "@/components/bookmark-dialog";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2 } from "lucide-react";
import { type BookmarkResponse } from "@shared/schema";
import Layout from "@/components/layout";

export default function Home() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkResponse | undefined>();

  const { data: user, isLoading: isUserLoading } = useUser();
  const { data, isLoading: isBookmarksLoading } = useBookmarks({ 
    page, 
    limit: 12, 
    search 
  });

  const handleEdit = (bookmark: BookmarkResponse) => {
    setEditingBookmark(bookmark);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingBookmark(undefined);
    setIsDialogOpen(true);
  };

  if (isUserLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect logic usually in App or Layout, but simple fallback here
    window.location.href = "/login";
    return null;
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">My Bookmarks</h1>
            <p className="text-muted-foreground mt-1">Manage and organize your personal links.</p>
          </div>
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
            <Plus className="w-4 h-4 mr-2" />
            Add Bookmark
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search bookmarks..." 
            className="pl-10 h-12 text-base bg-card border-border/60 focus:border-primary/50"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to page 1 on search
            }}
          />
        </div>

        {isBookmarksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-xl border border-border/40" />
            ))}
          </div>
        ) : (
          <>
            {data?.items.length === 0 ? (
              <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bookmark className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No bookmarks found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                  {search ? "Try adjusting your search terms." : "Get started by adding your first bookmark."}
                </p>
                {!search && (
                  <Button variant="outline" onClick={handleCreate}>Create one now</Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.items.map((bookmark) => (
                  <BookmarkCard 
                    key={bookmark.id} 
                    bookmark={bookmark} 
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )}

            {data && (
              <div className="flex justify-end pt-8">
                <Pagination 
                  page={page} 
                  totalPages={data.totalPages} 
                  onPageChange={setPage} 
                />
              </div>
            )}
          </>
        )}

        <BookmarkDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
          bookmark={editingBookmark}
        />
      </div>
    </Layout>
  );
}
