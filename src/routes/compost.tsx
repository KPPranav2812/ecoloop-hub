import { createFileRoute } from "@tanstack/react-router";
import { Factory, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore, advanceCompost } from "@/lib/store";
import { useRequireRole } from "@/lib/use-require-role";
import { ActivityFeed } from "@/components/activity-feed";
import { StatCard } from "@/components/stat-card";
import type { CompostStage } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/compost")({
  component: Page,
});

const STAGES: CompostStage[] = ["Received", "Processing", "Drying", "Ready", "Distributed"];

function Page() {
  const me = useRequireRole("compost");
  const compost = useStore((s) => s.compostBatches);
  if (!me) return null;

  const inProcess = compost.filter((c) => c.stage !== "Ready" && c.stage !== "Distributed");
  const ready = compost.filter((c) => c.stage === "Ready");
  const distributed = compost.filter((c) => c.stage === "Distributed");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold">Compost Operations</h1>
      <p className="text-sm text-muted-foreground">{me.organization}</p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <StatCard label="In process" value={inProcess.length} icon={<Factory className="h-4 w-4" />} />
        <StatCard label="Ready for farmers" value={`${ready.reduce((a, c) => a + c.weightKg, 0).toFixed(1)} kg`} accent="leaf" />
        <StatCard label="Distributed" value={distributed.length} accent="sun" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Compost Batches</h2>
          {compost.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
              Waiting for delivered waste batches.
            </div>
          ) : (
            compost.map((c) => {
              const idx = STAGES.indexOf(c.stage);
              return (
                <div key={c.id} className="glass rounded-2xl p-4 animate-fade-in">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
                    <Badge>{c.stage}</Badge>
                    <span className="text-xs text-muted-foreground">{c.weightKg} kg · quality {c.quality}</span>
                    <div className="ml-auto">
                      {c.stage !== "Distributed" && c.stage !== "Ready" && (
                        <Button size="sm" onClick={() => { advanceCompost(c.id); toast(`Batch advanced`); }}>
                          Advance <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                      {c.stage === "Ready" && (
                        <Badge variant="outline">Available to farmers</Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    {STAGES.map((s, i) => (
                      <div
                        key={s}
                        className={`flex-1 rounded-full px-2 py-1 text-center text-[10px] uppercase tracking-wider transition ${
                          i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <ActivityFeed />
      </div>
    </main>
  );
}
