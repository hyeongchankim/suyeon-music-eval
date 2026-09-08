export default function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "muted" | "accent" | "coral";
}) {
  const cls = {
    muted: "bg-surface text-ink/70",
    accent: "bg-accent/10 text-accent",
    coral: "bg-coral/10 text-coral",
  }[tone];
  return <p className={`rounded-btn px-4 py-3 text-sm ${cls}`}>{children}</p>;
}
