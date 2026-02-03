"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Loader2,
  MousePointerClick,
  Send,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { getAnalyticsData } from "./analytics-actions";

export default function AnalyticsTab({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getAnalyticsData(tenantId).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Performance Analytics
          </h2>
          <p className="text-gray-400 mt-1">
            Track email engagement and estimated impact.
          </p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl border border-gray-800 bg-[#0A0A0A]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
              <Send size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase font-bold">
                Emails Sent
              </p>
              <h3 className="text-3xl font-bold text-white">
                {data.stats.totalSent}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-gray-800 bg-[#0A0A0A]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10 text-green-500">
              <MousePointerClick size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase font-bold">
                Total Clicks
              </p>
              <h3 className="text-3xl font-bold text-white">
                {data.stats.totalClicked}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-gray-800 bg-[#0A0A0A]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase font-bold">
                Conversion Rate
              </p>
              <h3 className="text-3xl font-bold text-white">
                {data.stats.conversionRate}%
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: ENGAGEMENT */}
        <div className="p-6 rounded-xl border border-gray-800 bg-[#0A0A0A]">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-gray-400" />
              Daily Engagement
            </h3>
            <p className="text-sm text-gray-500">
              Emails sent vs. Links clicked
            </p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trafficData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#222"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#555"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#555"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000",
                    borderColor: "#333",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                  cursor={{ fill: "#ffffff05" }}
                />
                <Bar
                  dataKey="sent"
                  name="Sent"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="clicked"
                  name="Clicked"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: ESTIMATED GROWTH */}
        <div className="p-6 rounded-xl border border-gray-800 bg-[#0A0A0A]">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <StarIcon />
              Estimated Engagement Clicks Generated
            </h3>
            <p className="text-sm text-gray-500">
              Cumulative clicks on review links
            </p>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.reviewGrowthData}>
                <defs>
                  <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#222"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#555"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#555"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000",
                    borderColor: "#333",
                    color: "#fff",
                  }}
                  formatter={(value: number | undefined) => [
                    value,
                    "Est. Reviews",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="reviews"
                  stroke="#eab308"
                  fillOpacity={1}
                  fill="url(#colorReviews)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-yellow-500"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
