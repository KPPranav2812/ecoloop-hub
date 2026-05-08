import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf, Truck, Factory, Sprout, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginOrRegister, currentUser, useStore, seedDemo } from "@/lib/store";
import type { Role } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Landing,
});

const ROLES: { id: Role; label: string; desc: string; icon: any }[] = [
  { id: "contributor", label: "Waste Contributor", desc: "Hotels, hostels, cafeterias submitting waste.", icon: Leaf },
  { id: "agent", label: "Collection Agent", desc: "Pick up and deliver waste batches.", icon: Truck },
  { id: "compost", label: "Compost Operator", desc: "Process waste into farm-ready compost.", icon: Factory },
  { id: "farmer", label: "Farmer", desc: "Browse and request compost.", icon: Sprout },
  { id: "admin", label: "Admin", desc: "Oversee the entire EcoLoop network.", icon: ShieldCheck },
];

function Landing() {
  const router = useRouter();
  const me = useStore((s) => currentUser(s));
  const [role, setRole] = useState<Role>("contributor");
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");

  useEffect(() => {
    seedDemo();
  }, []);

  useEffect(() => {
    if (me) router.navigate({ to: dashFor(me.role) });
  }, [me, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !org.trim()) {
      toast.error("Please enter name and organization");
      return;
    }
    const u = loginOrRegister({
      name: name.trim(),
      organization: org.trim(),
      role,
      location: location.trim() || undefined,
      capacity: capacity ? Number(capacity) : undefined,
    });
    toast.success(`Welcome, ${u.name}`);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-[color:var(--leaf)] animate-pulse-slow" />
            Circular Economy · Live Network
          </span>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Turn waste into{" "}
            <span className="bg-gradient-to-r from-[color:var(--leaf)] to-[color:var(--sky)] bg-clip-text text-transparent">
              farm-ready compost
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground">
            EcoLoop AI connects contributors, collection agents, compost centers, and farmers
            into one verifiable, gamified, real-time sustainability network.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Submit", "Waste batches"],
              ["Verify", "AI scan"],
              ["Process", "Compost cycle"],
              ["Distribute", "To farmers"],
            ].map(([k, v]) => (
              <div key={k} className="glass rounded-xl p-3 text-xs">
                <div className="font-semibold">{k}</div>
                <div className="text-muted-foreground">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl p-6 shadow-glow animate-slide-up">
          <h2 className="text-lg font-semibold">Step in to the network</h2>
          <p className="text-xs text-muted-foreground">Pick a role and join — no signup required.</p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-primary bg-accent shadow-glow"
                      : "border-border hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  <Icon className="mb-2 h-4 w-4 text-primary" />
                  <div className="text-sm font-medium">{r.label}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{r.desc}</div>
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name">Your name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya" />
              </div>
              <div>
                <Label htmlFor="org">Organization</Label>
                <Input id="org" value={org} onChange={(e) => setOrg(e.target.value)} placeholder="MIT Hostel" />
              </div>
            </div>
            {(role === "contributor" || role === "farmer") && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="loc">Location</Label>
                  <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Pune" />
                </div>
                {role === "contributor" && (
                  <div>
                    <Label htmlFor="cap">Capacity (kg/day)</Label>
                    <Input id="cap" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="50" />
                  </div>
                )}
              </div>
            )}
            <Button type="submit" className="w-full">
              Enter EcoLoop <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}

function dashFor(role: Role) {
  return (
    {
      admin: "/admin",
      contributor: "/contributor",
      agent: "/agent",
      compost: "/compost",
      farmer: "/farmer",
    } as const
  )[role];
}
