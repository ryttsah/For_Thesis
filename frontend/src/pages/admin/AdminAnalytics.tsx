import { useEffect, useState } from "react";
import StackedTrendChart from "../../components/charts/StackedTrendChart";
import EmptyChartNote from "../../components/ui/EmptyChartNote";
import { isApiEnabled } from "../../services/api";
import { fetchConditionTrend, type ConditionTrendData } from "../../services/analytics";
import { Card, CardHead } from "../../components/ui/Card";
import { IconChartBar } from "@tabler/icons-react";

export default function AdminAnalytics() {
  const [trend, setTrend] = useState<ConditionTrendData | null>(null);

  useEffect(() => {
    if (!isApiEnabled()) return;
    void fetchConditionTrend().then(setTrend);
  }, []);

  return (
    <div className="animate-fade-in">
      <Card>
        <CardHead title="Province condition trend — last 6 months" icon={<IconChartBar size={16} />} />
        {trend && trend.labels.length > 0 ? (
          <StackedTrendChart
            labels={trend.labels}
            healthy={trend.healthy}
            yellowing={trend.yellowing}
            scale={trend.scale}
            beetle={trend.beetle}
            height={280}
          />
        ) : (
          <EmptyChartNote
            message={
              isApiEnabled()
                ? "No data yet. Farmer submissions and surveys populate this chart."
                : "Connect the API to use live analytics."
            }
          />
        )}
      </Card>
    </div>
  );
}
