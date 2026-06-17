import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Leaf,
  LayoutDashboard,
  MessageCircle,
  Target,
  Calculator,
  ScanLine,
  Trophy,
  ClipboardList,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assessment", label: "Assessment", icon: ClipboardList },
  { to: "/coach", label: "AI Coach", icon: MessageCircle },
  { to: "/missions", label: "Missions", icon: Target },
  { to: "/challenges", label: "Challenges", icon: Users },
  { to: "/simulator", label: "Simulator", icon: Calculator },
  { to: "/scanner", label: "Receipt Scanner", icon: ScanLine },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-dvh flex bg-surface">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar p-4 gap-1">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3 mb-4">
          <div className="size-9 rounded-xl eco-gradient grid place-items-center">
            <Leaf className="size-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold">Carbon Coach</span>
        </Link>
        <NavLinks pathname={location.pathname} />
        <div className="mt-auto pt-4">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-background/85 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="size-7 rounded-lg eco-gradient grid place-items-center">
              <Leaf className="size-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">Carbon Coach</span>
          </Link>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
        {open && (
          <nav className="px-3 pb-3 flex flex-col gap-1">
            <div onClick={() => setOpen(false)}>
              <NavLinks pathname={location.pathname} />
            </div>
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </nav>
        )}
      </div>

      <main className="flex-1 min-w-0 lg:pl-0 pt-14 lg:pt-0">
        <div className="mx-auto max-w-6xl px-4 lg:px-8 py-6 lg:py-10">{children}</div>
      </main>
    </div>
  );
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <>
      {nav.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              active
                ? "bg-primary-soft text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <Icon className="size-4" /> {item.label}
          </Link>
        );
      })}
    </>
  );
}
