import { createFileRoute } from "@tanstack/react-router";
import { Truck, CheckCircle2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore, acceptPickup, markPickedUp, markDelivered } from "@/lib/store";
import { useRequireRole } from "@/lib/use-require-role";
import { ActivityFeed } from "@/components/activity-feed";
import { StatCard } from "@/components/stat-card";
import { QRPlaceholder } from "@/components/qr-placeholder";
import { toast } from "sonner";

export const Route = createFileRoute("/agent")({
  component: Page,
});

function Page() {
  const me = useRequireRole("agent");
  const batches = useStore((s) => s.wasteBatches);
  if (!me) return null;

  const pending = batches.filter((b) => b.status === "Pending Pickup");
  const mine = batches.filter((b) => b.agentId === me.id && b.status !== "Delivered");
  const completed = batches.filter((b) => b.agentId === me.id && b.status === "Delivered");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold">Collection Console</h1>
      <p className="text-sm text-muted-foreground">Hi {me.name} — accept pickups and deliver to compost centers.</p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <StatCard label="Open requests" value={pending.length} icon={<Truck className="h-4 w-4" />} />
        <StatCard label="My active runs" value={mine.length} accent="sky" />
        <StatCard label="Completed" value={completed.length} icon={<CheckCircle2 className="h-4 w-4" />} accent="sun" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Pending pickups">
            {pending.length === 0 ? (
              <Empty>No open pickups right now.</Empty>
            ) : (
              pending.map((b) => (
                <Row key={b.id}>
                  <QRPlaceholder value={b.id} size={56} />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{b.contributorName}</span>
                      <Badge variant="outline">{b.category}</Badge>
                      <Badge>{b.urgency}</Badge>
                      <span className="text-xs text-muted-foreground">{b.weightKg} kg</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{b.id}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      acceptPickup(b.id);
                      toast.success("Pickup accepted");
                    }}
                  >
                    Accept
                  </Button>
                </Row>
              ))
            )}
          </Section>

          <Section title="My active runs">
            {mine.length === 0 ? (
              <Empty>Accept a pickup to begin.</Empty>
            ) : (
              mine.map((b) => (
                <Row key={b.id}>
                  <QRPlaceholder value={b.id} size={56} />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{b.contributorName}</span>
                      <Badge variant="outline">{b.category}</Badge>
                      <Badge>{b.status}</Badge>
                      <span className="text-xs text-muted-foreground">{b.weightKg} kg</span>
                    </div>
                  </div>
                  {b.status === "Pending Pickup" && (
                    <Button size="sm" variant="outline" onClick={() => { markPickedUp(b.id); toast("QR scanned · picked up"); }}>
                      Scan QR · Pick up
                    </Button>
                  )}
                  {b.status === "Picked Up" && (
                    <Button size="sm" onClick={() => { markDelivered(b.id); toast.success("Delivered to compost center"); }}>
                      <PackageCheck className="mr-1 h-4 w-4" /> Deliver
                    </Button>
                  )}
                </Row>
              ))
            )}
          </Section>
        </div>

        <ActivityFeed />
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="glass flex items-center gap-3 rounded-2xl p-3 animate-fade-in">{children}</div>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">{children}</div>;
}
