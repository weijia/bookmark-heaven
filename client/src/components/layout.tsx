import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-user";
import { Bookmark, Globe, Settings, LogOut, ShieldCheck, Menu, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <div 
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer
            ${isActive 
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-medium" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }
          `}
          onClick={() => setIsMobileOpen(false)}
        >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </div>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full p-4">
      <div className="px-3 py-4 mb-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
          Bookmarker.
        </h1>
      </div>

      <nav className="space-y-1.5 flex-1">
        <NavItem href="/" icon={Bookmark} label="My Bookmarks" />
        <NavItem href="/public" icon={Globe} label="Public Feed" />
        <NavItem href="/api-docs" icon={Code} label="API Docs" />
        <div className="py-4">
          <div className="h-px bg-border/60 mx-3" />
        </div>
        <NavItem href="/settings" icon={Settings} label="Settings" />
        {user?.isAdmin && (
          <NavItem href="/admin" icon={ShieldCheck} label="Admin" />
        )}
      </nav>

      <div className="mt-auto border-t border-border pt-4 px-3">
        {user ? (
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-xs text-muted-foreground truncate">Free Plan</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            onClick={() => window.location.href = '/login'}
          >
            Login
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-border fixed inset-y-0 bg-card z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center px-4 z-40 justify-between">
        <span className="font-bold text-lg font-display">Bookmarker.</span>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-5xl mx-auto">
        {children}
      </main>
    </div>
  );
}
