export default function MiniBarChart({
  bars,
  labels,
}: {
  bars: { height: string; color: string; title?: string }[];
  labels?: string[];
}) {
  return (
    <>
      <div className="flex h-40 items-end gap-2 px-1">
        {bars.map((bar, i) => (
          <div
            key={i}
            title={bar.title}
            className="min-h-5 flex-1 rounded-t transition-opacity hover:opacity-80"
            style={{ height: bar.height, backgroundColor: bar.color }}
          />
        ))}
      </div>
      {labels && (
        <div className="mt-3 flex justify-between text-[11px] text-pca-muted">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
    </>
  );
}
