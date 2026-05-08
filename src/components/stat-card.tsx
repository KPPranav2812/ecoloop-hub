interface StatProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  accent?: "leaf" | "sky" | "sun" | "earth";
}

export function StatCard({ label, value, hint, icon, accent = "leaf" }: StatProps) {
  const colors = {
    leaf: "text-[color:var(--leaf)]",
    sky: "text-[color:var(--sky)]",
    sun: "text-[color:var(--sun)]",
    earth: "text-[color:var(--earth)]",
  } as const;
  return (
    <div className="glass relative overflow-hidden rounded-2xl p-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon ? <span className={colors[accent]}>{icon}</span> : null}
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
