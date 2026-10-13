export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <p className="text-sm font-semibold text-ink-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-ink-900">{value}</p>
    </div>
  );
}
