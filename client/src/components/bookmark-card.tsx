import { type BookmarkResponse } from "@shared/schema";
import { format } from "date-fns";
import { ExternalLink, Globe, Lock, MoreVertical, Trash2, Edit } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useDeleteBookmark } from "@/hooks/use-bookmarks";

interface BookmarkCardProps {
  bookmark: BookmarkResponse;
  onEdit?: (bookmark: BookmarkResponse) => void;
}

export function BookmarkCard({ bookmark, onEdit }: BookmarkCardProps) {
  const { data: user } = useUser();
  const { mutate: deleteBookmark } = useDeleteBookmark();
  
  const isOwner = user?.id === bookmark.userId;
  const hostname = new URL(bookmark.url).hostname.replace('www.', '');

  return (
    <div className="group relative bg-card hover:bg-card/80 border border-border rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {bookmark.isPublic ? (
              <Globe className="w-3.5 h-3.5 text-blue-500" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {bookmark.username || (isOwner ? "You" : "User")}
            </span>
            <span className="text-xs text-border">•</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(bookmark.createdAt || new Date()), "MMM d, yyyy")}
            </span>
          </div>

          <a 
            href={bookmark.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block group-hover:text-primary transition-colors"
          >
            <h3 className="text-lg font-bold font-display leading-tight mb-1 truncate">
              {bookmark.title}
            </h3>
          </a>
          
          <a 
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-3 w-fit"
          >
            <ExternalLink className="w-3 h-3" />
            {hostname}
          </a>

          {bookmark.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {bookmark.description}
            </p>
          )}
        </div>

        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(bookmark)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => deleteBookmark(bookmark.id)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
