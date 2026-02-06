"use server";

import { createClient } from "@/lib/supabase/server";
import { format, subDays } from "date-fns";

export async function getAnalyticsData(tenantId: string) {
  const supabase = await createClient();
  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30).toISOString();

  // 1. Fetch Retention Programs (to get display names)
  const { data: programs } = await supabase
    .from("retention_programs")
    .select("service_tag, display_name")
    .eq("tenant_id", tenantId);

  // Create a lookup map: service_tag -> display_name
  const programNames: Record<string, string> = {};
  programs?.forEach((p) => {
    programNames[p.service_tag] = p.display_name;
  });

  // 2. Fetch Email Logs
  const { data: logs } = await supabase
    .from("email_logs")
    .select("status, created_at, email_type, metadata")
    .eq("tenant_id", tenantId)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: true });

  // 3. Initialize Data Structures
  const chartDataMap = new Map<
    string,
    { date: string; sent: number; clicked: number }
  >();
  const breakdownMap = new Map<
    string,
    { name: string; type: string; sent: number; clicked: number }
  >();

  // Initialize Global Review Entry
  breakdownMap.set("global_review", {
    name: "Global Review Automation",
    type: "Review",
    sent: 0,
    clicked: 0,
  });

  // Initialize detected programs in the breakdown
  programs?.forEach((p) => {
    if (!breakdownMap.has(p.service_tag)) {
      breakdownMap.set(p.service_tag, {
        name: p.display_name,
        type: "Retention",
        sent: 0,
        clicked: 0,
      });
    }
  });

  // Initialize Timeline
  for (let i = 29; i >= 0; i--) {
    const dateStr = format(subDays(today, i), "MMM dd");
    chartDataMap.set(dateStr, { date: dateStr, sent: 0, clicked: 0 });
  }

  let runningTotalClicks = 0;
  const reviewGrowthData: { date: string; reviews: number }[] = [];

  // 4. Process Logs
  logs?.forEach((log) => {
    const dateStr = format(new Date(log.created_at), "MMM dd");
    const isClick = log.status === "clicked" || log.status === "reviewed";
    const isSent = log.status === "sent";

    // A. Populate Timeline Chart
    if (chartDataMap.has(dateStr)) {
      const entry = chartDataMap.get(dateStr)!;
      if (isSent) entry.sent++;
      if (isClick) entry.clicked++;
    }

    // B. Populate Program Breakdown
    let breakdownKey = "";

    if (log.email_type === "review") {
      breakdownKey = "global_review";
    } else if (log.email_type === "retention") {
      // Extract service tag from metadata
      const serviceTag =
        (log.metadata as any)?.service || (log.metadata as any)?.service_tag;
      if (serviceTag) {
        breakdownKey = serviceTag;
        // If we found a log for a program not in our initial fetch (maybe deleted), add it
        if (!breakdownMap.has(breakdownKey)) {
          breakdownMap.set(breakdownKey, {
            name: programNames[serviceTag] || serviceTag, // Fallback to tag if name not found
            type: "Retention",
            sent: 0,
            clicked: 0,
          });
        }
      }
    }

    if (breakdownKey && breakdownMap.has(breakdownKey)) {
      const entry = breakdownMap.get(breakdownKey)!;
      if (isSent) entry.sent++;
      if (isClick) entry.clicked++;
    }
  });

  // 5. Finalize Timeline Data
  const trafficData = Array.from(chartDataMap.values());
  trafficData.forEach((dayStat) => {
    runningTotalClicks += dayStat.clicked;
    reviewGrowthData.push({
      date: dayStat.date,
      reviews: runningTotalClicks,
    });
  });

  // 6. Finalize Breakdown Data (Calculate CTR)
  const programBreakdown = Array.from(breakdownMap.values())
    .map((p) => ({
      ...p,
      ctr: p.sent > 0 ? ((p.clicked / p.sent) * 100).toFixed(1) : "0.0",
    }))
    .filter(
      (p) =>
        p.sent > 0 || programs?.some((prog) => prog.display_name === p.name),
    ) // Keep active programs even if 0 sent
    .sort((a, b) => b.sent - a.sent); // Sort by volume

  // 7. Global Stats
  const totalSent = logs?.filter((l) => l.status === "sent").length || 0;
  const totalClicked =
    logs?.filter((l) => l.status === "clicked" || l.status === "reviewed")
      .length || 0;
  const conversionRate =
    totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0.0";

  return {
    trafficData,
    reviewGrowthData,
    programBreakdown, // <--- New Data
    stats: {
      totalSent,
      totalClicked,
      conversionRate,
    },
  };
}
