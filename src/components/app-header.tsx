import { Link, useRouter } from "@tanstack/react-router";
import { Leaf, LogOut, Bell } from "lucide-react";
import { useStore, currentUser, logout } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  contributor: "Waste Contributor",
  agent: "Collection Agent",
  compost: "Compost Operator",
  farmer: "Farmer",
};

export function AppHeader() {
  const me = useStore((s) => currentUser(s));
  const activity = useStore((s) => s.activity);
  const router = useRouter();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-hero shadow-glow">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-bold tracking-tight">EcoLoop AI</div>
            <div className="text-[10px] uppercase text-muted-foreground tracking-widest">Waste → Compost</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark((d) => !d)}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            {dark ? "Light" : "Dark"}
          </button>
          <div className="hidden md:flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
            <Bell className="h-3 w-3" /> {activity.length}
          </div>
          {me ? (
            <>
              <div className="hidden sm:block text-right text-xs leading-tight">
                <div className="font-medium text-foreground">{me.name}</div>
                <div className="text-muted-foreground">
                  {ROLE_LABELS[me.role]} · {me.organization}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  logout();
                  router.navigate({ to: "/" });
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
