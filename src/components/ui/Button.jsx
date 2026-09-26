export default function Button({ children, href, icon: Icon, variant = "primary", className = "", ...props }) {
  const styles = variant === "primary"
    ? "bg-mint text-ink hover:bg-emerald-200"
    : "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]";
  const buttonClassName = `inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${styles} ${className}`;

  if (href) {
    return <a className={buttonClassName} href={href} {...props}>{children}{Icon && <Icon size={16} />}</a>;
  }

  return <button className={buttonClassName} {...props}>{children}{Icon && <Icon size={16} />}</button>;
}
