const STYLES = {
  healthy: "bg-pca-green-light text-pca-green before:bg-pca-green",
  caution: "bg-orange-50 text-orange-600 before:bg-orange-600",
  risk: "bg-pca-red-light text-pca-red before:bg-pca-red",
  pending: "bg-yellow-50 text-amber-600 before:bg-amber-600",
};

const LABELS = {
  healthy: "Healthy",
  caution: "Caution",
  risk: "At Risk",
  pending: "Pending",
};

export default function StatusBadge({
  status,
  label,
}: {
  status: keyof typeof STYLES;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold before:inline-block before:h-1.5 before:w-1.5 before:rounded-full ${STYLES[status]}`}
    >
      {label ?? LABELS[status]}
    </span>
  );
}
