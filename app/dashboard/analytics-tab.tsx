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
  Zap,
  Tag,
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
            Analítica de Rendimiento
          </h2>
          <p className="text-gray-400 mt-1">
            Seguimiento de interacciones e impacto (Últimos 30 Días).
          </p>
        </div>
      </div>

      {/* TARJETAS KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl border border-gray-800 bg-[#0A0A0A]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
              <Send size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase font-bold">
                Correos Enviados
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
                Clics Totales
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
                Tasa de Conversión
              </p>
              <h3 className="text-3xl font-bold text-white">
                {data.stats.conversionRate}%
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* FILA DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO 1: INTERACCIÓN */}
        <div className="p-6 rounded-xl border border-gray-800 bg-[#0A0A0A]">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-gray-400" />
              Interacción Diaria
            </h3>
            <p className="text-sm text-gray-500">
              Correos enviados vs. Enlaces clicados
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
                  formatter={(
                    value: number | undefined,
                    name: string | undefined,
                  ) => [value ?? 0, name === "sent" ? "Enviados" : "Clics"]}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Bar
                  dataKey="sent"
                  name="sent"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="clicked"
                  name="clicked"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: CRECIMIENTO ESTIMADO */}
        <div className="p-6 rounded-xl border border-gray-800 bg-[#0A0A0A]">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <StarIcon />
              Reseñas Estimadas Generadas
            </h3>
            <p className="text-sm text-gray-500">
              Clics acumulados en enlaces de reseña
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
                    value ?? 0,
                    "Reseñas Est.",
                  ]}
                  labelFormatter={(label) => `Fecha: ${label}`}
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

      {/* TABLA DE DESGLOSE */}
      <div className="rounded-xl border border-gray-800 bg-[#0A0A0A] overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap size={18} className="text-yellow-500" />
            Rendimiento de Campañas
          </h3>
          <p className="text-sm text-gray-500">
            Desglose por tipo de programa (CTR - Tasa de Clics)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900/50 text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-4">Nombre de Campaña</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 text-right">Enviados</th>
                <th className="px-6 py-4 text-right">Clics</th>
                <th className="px-6 py-4 w-1/4">Rendimiento (CTR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.programBreakdown.map((prog: any, i: number) => (
                <tr key={i} className="group hover:bg-[#111] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">
                    {prog.type === "Review"
                      ? "Automatización Global de Reseñas"
                      : prog.name}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${
                        prog.type === "Review"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      }`}
                    >
                      {prog.type === "Review" ? (
                        <MousePointerClick size={10} />
                      ) : (
                        <Tag size={10} />
                      )}
                      {prog.type === "Review" ? "Reseña" : "Retención"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400">
                    {prog.sent}
                  </td>
                  <td className="px-6 py-4 text-right text-white font-mono">
                    {prog.clicked}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold w-10 text-right">
                        {prog.ctr}%
                      </span>
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            parseFloat(prog.ctr) > 20
                              ? "bg-green-500"
                              : parseFloat(prog.ctr) > 5
                                ? "bg-blue-500"
                                : "bg-gray-600"
                          }`}
                          style={{
                            width: `${Math.min(parseFloat(prog.ctr), 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {data.programBreakdown.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No hay datos de campañas disponibles aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
