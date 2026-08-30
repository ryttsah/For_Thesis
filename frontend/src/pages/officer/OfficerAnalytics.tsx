import { IconChartBar } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import ConditionLineChart from "../../components/charts/ConditionLineChart";
import EmptyChartNote from "../../components/ui/EmptyChartNote";
import { isApiEnabled } from "../../services/api";
import { fetchOfficerConditionTrend, type ConditionTrendData } from "../../services/analytics";
import { useOfficerScope } from "../../hooks/useOfficerScope";
import { Card, CardHead } from "../../components/ui/Card";

export default function OfficerAnalytics() {
  const { assignedBrgy } = useOfficerScope();
  const [trend, setTrend] = useState<ConditionTrendData | null>(null);

  useEffect(() => {
    if (!isApiEnabled()) return;
    void fetchOfficerConditionTrend().then(setTrend);
  }, [assignedBrgy]);

  return (
    <div className="animate-fade-in">
      <Card>
        <CardHead title="Condition trend — your scope" icon={<IconChartBar size={16} />} />
        {trend && trend.labels.length > 0 ? (
          <>
            <p className="mb-2 text-xs text-pca-muted">
              {trend.brgy ? `Barangay: ${trend.brgy}` : "Assign a barangay to scope this chart."}
            </p>
            <ConditionLineChart
              labels={trend.labels}
              healthy={trend.healthy}
              yellowing={trend.yellowing}
              scale={trend.scale}
              beetle={trend.beetle}
              height={280}
            />
          </>
        ) : (
          <EmptyChartNote
            message={
              isApiEnabled()
                ? "No data in your barangay yet. Validate farmer CNN submissions to build history."
                : "Connect the API to use live analytics."
            }
          />
        )}
      </Card>
    </div>
  );
}
