import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Trash2, Truck, Factory, Sprout, Leaf, Cloud } from "lucide-react";
import { useStore, analytics, leaderboard } from "@/lib/store";
import { useRequireRole } from "@/lib/use-require-role";
import { StatCard } from "@/components/stat-card";
import { ActivityFeed } from "@/components/activity-feed";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin")({
  component: Page,
});

function Page() {
  const me = useRequireRole("admin");
  const state = useStore((s) => s);
  if (!me) return null;
  const a = analytics(state);
  const board = leaderboard(state);

  const series = useMemo(() => buildSeries(state.wasteBatches), [state.wasteBatches]);
  const categoryData = useMemo(() => {
    const counts = { Organic: 0, Recyclable: 0, Contaminated: 0 } as Record<string, number>;
    state.wasteBatches.forEach((b) => (counts[b.category] += b.weightKg));
    return Object.entries(counts).map(([name, kg]) => ({ name, kg: +kg.toFixed(1) }));
  }, [state.wasteBatches]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Network Overview</h1>
        <p className="text-sm text-muted-foreground">
          Real-time view of EcoLoop's circular sustainability network.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Waste collected" value={`${a.totalWasteKg} kg`} icon={<Trash2 className="h-4 w-4" />} />
        <StatCard label="Active pickups" value={a.activePickups} icon={<Truck className="h-4 w-4" />} accent="sky" />
        <StatCard label="Compost generated" value={`${a.compostKg} kg`} icon={<Factory className="h-4 w-4" />} accent="earth" />
        <StatCard label="Distributed to farms" value={`${a.distributedKg} kg`} icon={<Sprout className="h-4 w-4" />} accent="sun" />
        <StatCard label="CO₂ avoided" value={`${a.carbonKg} kg`} icon={<Cloud className="h-4 w-4" />} accent="sky" />
        <StatCard label="Landfill diverted" value={`${a.landfillKg} kg`} icon={<Leaf className="h-4 w-4" />} accent="leaf" />
        <StatCard label="Contamination rate" value={`${a.contaminationRate}%`} accent="earth" />
        <StatCard label="Registered users" value={state.users.length} accent="sky" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-semibold">Waste flow over time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.62 0.18 145)" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="oklch(0.62 0.18 145)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="kg" stroke="oklch(0.55 0.16 150)" fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-semibold">Waste by category (kg)</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="kg" fill="oklch(0.7 0.12 220)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <h3 className="mb-3 text-sm font-semibold">Top contributors</h3>
            <ol className="space-y-1 text-sm">
              {board.length === 0 ? (
                <li className="text-xs text-muted-foreground">No contributors yet.</li>
              ) : (
                board.map((u, i) => (
                  <li key={u.id} className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-muted">
                    <span><span className="mr-2 text-muted-foreground">#{i + 1}</span>{u.organization}</span>
                    <span className="flex items-center gap-2">
                      {u.badges.slice(-1).map((b) => <Badge key={b} variant="outline">{b}</Badge>)}
                      <span className="font-mono text-xs">{u.xp} XP</span>
                    </span>
                  </li>
                ))
              )}
            </ol>
          </div>
        </div>
        <ActivityFeed />
      </div>
    </main>
  );
}

function buildSeries(batches: { createdAt: number; weightKg: number }[]) {
  const now = Date.now();
  const buckets: { label: string; kg: number; ts: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    buckets.push({
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      kg: 0,
      ts: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(),
    });
  }
  batches.forEach((b) => {
    const day = new Date(b.createdAt);
    const ts = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    const bucket = buckets.find((x) => x.ts === ts);
    if (bucket) bucket.kg += b.weightKg;
  });
  return buckets.map(({ label, kg }) => ({ label, kg: +kg.toFixed(1) }));
}
