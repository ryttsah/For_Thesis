export default function EmptyChartNote({ message }: { message: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-pca-border bg-pca-bg px-6 py-10 text-center text-sm text-pca-muted">
      {message}
    </div>
  );
}
