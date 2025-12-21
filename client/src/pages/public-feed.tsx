import { useState } from "react";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { BookmarkCard } from "@/components/bookmark-card";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Search, Globe } from "lucide-react";
import Layout from "@/components/layout";

export default function PublicFeed() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  
  const { data, isLoading } = useBookmarks({ 
    page, 
    limit: 12, 
    search,
    isPublic: 'true' 
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold font-display tracking-tight">Public Feed</h1>
          </div>
          <p className="text-muted-foreground">Discover interesting links shared by the community.</p>
        </div>

        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search public bookmarks..." 
            className="pl-10 h-11 bg-card"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 bg-muted/20 animate-pulse rounded-xl border border-border/40" />
            ))}
          </div>
        ) : (
          <>
            {data?.items.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No public bookmarks found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.items.map((bookmark) => (
                  <BookmarkCard 
                    key={bookmark.id} 
                    bookmark={bookmark} 
                    // No edit handler passed = read only
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
      </div>
    </Layout>
  );
}
