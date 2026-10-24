export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-200 bg-white p-4">
      <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-l from-brand-600 to-cyan-400" />
      <p className="text-sm font-semibold text-ink-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-ink-900">{value}</p>
    </div>
  );
}
