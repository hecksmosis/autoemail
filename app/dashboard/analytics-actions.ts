"use server";

import { createClient } from "@/lib/supabase/server";
import { addDays, format, subDays } from "date-fns";

export async function getAnalyticsData(tenantId: string) {
  const supabase = await createClient();
  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30).toISOString();

  // 1. Fetch Email Logs (Sent vs Clicked)
  const { data: logs, error: err } = await supabase
    .from("email_logs")
    .select("status, sent_at")
    .eq("tenant_id", tenantId)
    .gte("sent_at", thirtyDaysAgo);

  // 2. Process Logs into Daily Stats
  const chartDataMap = new Map<
    string,
    { date: string; sent: number; clicked: number }
  >();

  // Initialize last 30 days with 0
  for (let i = 29; i >= 0; i--) {
    const dateStr = format(subDays(today, i), "MMM dd");
    chartDataMap.set(dateStr, { date: dateStr, sent: 0, clicked: 0 });
  }

  logs?.forEach((log) => {
    const dateStr = format(new Date(log.sent_at), "MMM dd");
    if (chartDataMap.has(dateStr)) {
      const entry = chartDataMap.get(dateStr)!;
      if (log.status === "sent") entry.sent++;
      if (log.status === "clicked") entry.clicked++;
    }
  });

  // 3. Build Cumulative "Estimated Reviews" Data
  // We iterate day by day to ensure the line goes up (cumulative)
  const trafficData = Array.from(chartDataMap.values());
  const reviewGrowthData: { date: string; reviews: number }[] = [];
  let runningTotalClicks = 0;
  trafficData.forEach((dayStat) => {
    // We assume a click on a 'review' email is a potential review
    // We add the daily clicks to the running total
    runningTotalClicks += dayStat.clicked;
    reviewGrowthData.push({
      date: dayStat.date,
      reviews: runningTotalClicks,
    });
  });

  // 4. Calculate Conversion Rate
  const totalSent = logs?.filter((l) => l.status === "sent").length || 0;
  const totalClicked =
    logs?.filter((l) => l.status === "clicked" || l.status === "reviewed")
      .length || 0;
  const conversionRate =
    totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0";

  return {
    trafficData,
    reviewGrowthData,
    stats: {
      totalSent,
      totalClicked,
      conversionRate,
    },
  };
}
