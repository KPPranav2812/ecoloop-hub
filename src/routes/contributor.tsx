import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trophy, Sparkles, Trash2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useStore, submitWaste, leaderboard, currentUser } from "@/lib/store";
import { useRequireRole } from "@/lib/use-require-role";
import type { WasteCategory, Urgency } from "@/lib/types";
import { toast } from "sonner";
import { StatCard } from "@/components/stat-card";
import { ActivityFeed } from "@/components/activity-feed";
import { QRPlaceholder } from "@/components/qr-placeholder";

export const Route = createFileRoute("/contributor")({
  component: Page,
});

function Page() {
  const me = useRequireRole("contributor");
  const myBatches = useStore((s) =>
    me ? s.wasteBatches.filter((b) => b.contributorId === me.id) : [],
  );
  const board = useStore(leaderboard);
  if (!me) return null;

  const totalKg = myBatches.reduce((a, b) => a + b.weightKg, 0);
  const pending = myBatches.filter((b) => b.status === "Pending Pickup").length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{me.organization}</h1>
          <p className="text-sm text-muted-foreground">
            {me.location ?? "—"} · Capacity {me.capacity ?? "—"} kg/day
          </p>
        </div>
        <SubmitDialog />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Total submitted" value={`${totalKg.toFixed(1)} kg`} icon={<Trash2 className="h-4 w-4" />} />
        <StatCard label="Green credits" value={me.credits} icon={<Sparkles className="h-4 w-4" />} accent="sun" />
        <StatCard label="XP" value={me.xp} hint={me.badges.join(" · ") || "Earn your first badge"} accent="sky" />
        <StatCard label="Pending pickups" value={pending} accent="earth" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">My Waste Batches</h2>
          {myBatches.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
              No batches yet. Submit your first batch to start earning credits.
            </div>
          ) : (
            myBatches.map((b) => (
              <div key={b.id} className="glass flex items-center gap-4 rounded-2xl p-4 animate-fade-in">
                <QRPlaceholder value={b.id} size={72} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{b.id}</span>
                    <Badge variant="outline">{b.category}</Badge>
                    <Badge>{b.status}</Badge>
                    <span className="text-xs text-muted-foreground">{b.weightKg} kg · {b.urgency}</span>
                  </div>
                  {b.ai ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <ScanLine className="h-3 w-3 text-primary" />
                      AI: {(b.ai.confidence * 100).toFixed(0)}% confidence · contamination {(b.ai.contamination * 100).toFixed(0)}%
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-muted-foreground">AI scanning…</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Trophy className="h-4 w-4 text-[color:var(--sun)]" /> Leaderboard
            </div>
            <ol className="space-y-2 text-sm">
              {board.length === 0 ? (
                <li className="text-xs text-muted-foreground">No contributors yet.</li>
              ) : (
                board.map((u, i) => (
                  <li key={u.id} className={`flex items-center justify-between rounded-md px-2 py-1 ${u.id === me.id ? "bg-accent" : ""}`}>
                    <span>
                      <span className="mr-2 text-muted-foreground">#{i + 1}</span>
                      {u.organization}
                    </span>
                    <span className="font-mono text-xs">{u.xp} XP</span>
                  </li>
                ))
              )}
            </ol>
          </div>
          <ActivityFeed />
        </div>
      </div>
    </main>
  );
}

function SubmitDialog() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<WasteCategory>("Organic");
  const [weight, setWeight] = useState("10");
  const [urgency, setUrgency] = useState<Urgency>("Medium");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [scanning, setScanning] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(f);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = Number(weight);
    if (!w || w <= 0) {
      toast.error("Enter a valid weight");
      return;
    }
    setScanning(true);
    setTimeout(() => {
      const b = submitWaste({ category, weightKg: w, urgency, notes, imageDataUrl: image });
      toast.success(`Batch ${b.id} submitted · QR generated`);
      setScanning(false);
      setOpen(false);
      setWeight("10");
      setNotes("");
      setImage(undefined);
    }, 900);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-1 h-4 w-4" /> New waste batch</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit a waste batch</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as WasteCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Organic">Organic</SelectItem>
                  <SelectItem value="Recyclable">Recyclable</SelectItem>
                  <SelectItem value="Contaminated">Contaminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Pickup urgency</Label>
            <Select value={urgency} onValueChange={(v) => setUrgency(v as Urgency)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Image (optional)</Label>
            <Input type="file" accept="image/*" onChange={onFile} />
            {image && <img src={image} className="mt-2 h-24 rounded-md object-cover" alt="preview" />}
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Source, sorting, etc." />
          </div>
          {scanning && (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-xs">
              <div className="flex items-center gap-2 font-medium text-primary">
                <ScanLine className="h-4 w-4 animate-pulse" /> AI verifying batch…
              </div>
              <div className="mt-1 text-muted-foreground">Classifying contents · estimating contamination · scoring confidence</div>
            </div>
          )}
          <Button type="submit" disabled={scanning} className="w-full">
            {scanning ? "Submitting…" : "Submit & generate QR"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
