export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-16 animate-pulse rounded-xl bg-slate-200/70" />
      ))}
    </div>
  );
}
