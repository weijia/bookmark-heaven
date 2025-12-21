import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertBookmarkSchema, type BookmarkResponse } from "@shared/schema";
import { useCreateBookmark, useUpdateBookmark } from "@/hooks/use-bookmarks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

// Client-side schema that coerces public boolean
const formSchema = insertBookmarkSchema.extend({
  isPublic: z.boolean().default(false),
});

interface BookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmark?: BookmarkResponse; // If present, we are editing
}

export function BookmarkDialog({ open, onOpenChange, bookmark }: BookmarkDialogProps) {
  const createMutation = useCreateBookmark();
  const updateMutation = useUpdateBookmark();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
      isPublic: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (bookmark) {
        form.reset({
          title: bookmark.title,
          url: bookmark.url,
          description: bookmark.description || "",
          isPublic: bookmark.isPublic || false,
        });
      } else {
        form.reset({
          title: "",
          url: "",
          description: "",
          isPublic: false,
        });
      }
    }
  }, [open, bookmark, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (bookmark) {
      updateMutation.mutate(
        { id: bookmark.id, ...values },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(values, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">
            {bookmark ? "Edit Bookmark" : "Add Bookmark"}
          </DialogTitle>
          <DialogDescription>
            Save interesting links to your collection.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-2">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} className="font-mono text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="My awesome link" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add some notes..." 
                      className="resize-none min-h-[100px]" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/30">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Public Bookmark</FormLabel>
                    <FormDescription>
                      Visible to everyone in the public feed.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-white">
                {isPending ? "Saving..." : bookmark ? "Update Bookmark" : "Create Bookmark"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
