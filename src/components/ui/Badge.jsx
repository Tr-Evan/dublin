export default function Badge({ children, tone = "neutral", icon: Icon }) {
  const tones = {
    neutral: "border-white/10 bg-white/[0.045] text-slate-300",
    mint: "border-mint/20 bg-mint/[0.08] text-mint",
    amber: "border-amber-300/20 bg-amber-200/[0.08] text-amber-200",
    rose: "border-rose-300/20 bg-rose-200/[0.08] text-rose-200",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${tones[tone] ?? tones.neutral}`}>
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </span>
  );
}
