import { useStore } from "@/lib/store";
import { Activity } from "lucide-react";

export function ActivityFeed() {
  const activity = useStore((s) => s.activity);
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Activity className="h-4 w-4 text-primary" />
        Live Activity
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {activity.length === 0 ? (
          <p className="text-xs text-muted-foreground">No activity yet.</p>
        ) : (
          activity.map((a) => (
            <div
              key={a.id}
              className="animate-fade-in rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-xs"
            >
              <div className="text-foreground">{a.message}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">
                {new Date(a.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
