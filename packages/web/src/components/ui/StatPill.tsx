interface StatPillProps {
  label: string;
  value: string | number;
  accent?: "chili" | "turmeric" | "pandan" | "cream";
  icon?: string;
}

export function StatPill({ label, value, accent = "cream", icon }: StatPillProps) {
  const colors: Record<string, string> = {
    chili: "text-chili",
    turmeric: "text-turmeric",
    pandan: "text-pandan",
    cream: "text-cream",
  };

  return (
    <div className="flex-1 rounded-3xl border border-border-soft bg-white px-4 py-4 text-center shadow-sm">
      {icon && <div className="text-base mb-0.5">{icon}</div>}
      <div className={`text-lg font-black font-display ${colors[accent]}`}>
        {value}
      </div>
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mt-0.5">
        {label}
      </div>
    </div>
  );
}
