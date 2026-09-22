export default function Loading() {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-24 text-lg font-semibold text-gray-700">
      <span
        aria-hidden
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
      טוענים...
    </div>
  );
}
