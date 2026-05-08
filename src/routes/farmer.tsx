import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sprout, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStore, requestCompost } from "@/lib/store";
import { useRequireRole } from "@/lib/use-require-role";
import { ActivityFeed } from "@/components/activity-feed";
import { StatCard } from "@/components/stat-card";
import { toast } from "sonner";

export const Route = createFileRoute("/farmer")({
  component: Page,
});

function Page() {
  const me = useRequireRole("farmer");
  const ready = useStore((s) => s.compostBatches.filter((c) => c.stage === "Ready" && c.weightKg > 0));
  const myReqs = useStore((s) => (me ? s.farmerRequests.filter((r) => r.farmerId === me.id) : []));
  if (!me) return null;
  const totalReceived = myReqs.reduce((a, r) => a + r.quantityKg, 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold">Compost Marketplace</h1>
      <p className="text-sm text-muted-foreground">Welcome {me.name} · {me.location ?? "—"}</p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <StatCard label="Available batches" value={ready.length} icon={<Sprout className="h-4 w-4" />} />
        <StatCard label="My requests" value={myReqs.length} accent="sky" />
        <StatCard label="Compost received" value={`${totalReceived.toFixed(1)} kg`} accent="earth" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Available compost</h2>
          {ready.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
              No ready compost yet — check back soon.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {ready.map((c) => (
                <CompostCard key={c.id} id={c.id} weight={c.weightKg} quality={c.quality} />
              ))}
            </div>
          )}

          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">My requests</h2>
          <div className="space-y-2">
            {myReqs.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No requests yet.</div>
            ) : (
              myReqs.map((r) => (
                <div key={r.id} className="glass flex items-center gap-3 rounded-2xl p-3 text-sm animate-fade-in">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  <span className="font-mono text-xs">{r.id}</span>
                  <span>{r.quantityKg} kg</span>
                  <span className="text-xs text-muted-foreground">from {r.compostBatchId}</span>
                  <Badge className="ml-auto">{r.status}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
        <ActivityFeed />
      </div>
    </main>
  );
}

function CompostCard({ id, weight, quality }: { id: string; weight: number; quality: number }) {
  const [qty, setQty] = useState("10");
  return (
    <div className="glass rounded-2xl p-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">{id}</span>
        <Badge variant="outline">Quality {quality}</Badge>
      </div>
      <div className="mt-2 text-2xl font-bold">{weight} kg</div>
      <div className="text-xs text-muted-foreground">premium organic compost</div>
      <div className="mt-3 flex gap-2">
        <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="h-9" />
        <Button
          size="sm"
          onClick={() => {
            const n = Number(qty);
            if (!n || n <= 0) return toast.error("Enter a quantity");
            if (n > weight) return toast.error("Not enough stock");
            const r = requestCompost(id, n);
            if (r) toast.success(`Requested ${n}kg · ${r.id}`);
            else toast.error("Request failed");
          }}
        >
          Request
        </Button>
      </div>
    </div>
  );
}
