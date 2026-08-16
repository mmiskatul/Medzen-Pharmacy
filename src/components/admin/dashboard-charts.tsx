"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "@/components/admin/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, Skeleton } from "@/components/ui/primitives";
import { formatPrice } from "@/lib/utils";

/**
 * Chart palette. Series colours come from the brand ramp so a chart reads
 * as part of the same system as the rest of the dashboard, and the
 * prescription split reuses the workflow colours from StatusBadge.
 */
const INK = "#141b18";
const GRID = "#e6ede9";
const MUTED = "#6b7a74";
const SERIES = "#12a06e";
const SERIES_ALT = "#0e5c43";

type Analytics = {
  series: { date: string; orders: number; revenueFils: number }[];
  topProducts: { name: string; quantity: number; revenueFils: number }[];
  topSearches: { term: string; count: number }[];
  topPages: { path: string; views: number }[];
};

const RANGES = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "365", label: "12 months" },
] as const;

const axisProps = {
  stroke: MUTED,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function tooltipStyle() {
  return {
    contentStyle: {
      borderRadius: 12,
      border: `1px solid ${GRID}`,
      fontSize: 12,
      boxShadow: "0 8px 24px -12px rgba(20,27,24,.2)",
    },
    labelStyle: { color: INK, fontWeight: 600 },
  };
}

export function DashboardCharts({
  prescriptions,
}: {
  prescriptions: { pending: number; approved: number; rejected: number };
}) {
  const [range, setRange] = React.useState<(typeof RANGES)[number]["value"]>("7");
  const [data, setData] = React.useState<Analytics | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<Analytics>(`/api/admin/analytics?range=${range}`)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const rxData = [
    { name: "Pending", value: prescriptions.pending, fill: "#b45309" },
    { name: "Approved", value: prescriptions.approved, fill: SERIES },
    { name: "Rejected", value: prescriptions.rejected, fill: "#b91c1c" },
  ];

  const shortDate = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Trends</h2>
        <div
          className="flex gap-1 rounded-xl border border-line bg-white p-1"
          role="group"
          aria-label="Chart date range"
        >
          {RANGES.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={range === option.value ? "subtle" : "ghost"}
              onClick={() => setRange(option.value)}
              aria-pressed={range === option.value}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Orders received"
            description="Order requests submitted through the website."
          />
          <div className="h-64 p-4">
            {loading || !data ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDate} {...axisProps} />
                  <YAxis allowDecimals={false} {...axisProps} />
                  <Tooltip
                    {...tooltipStyle()}
                    labelFormatter={shortDate}
                    formatter={(value: number) => [value, "Orders"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke={SERIES}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Completed order value"
            description="Total of orders marked completed, by day."
          />
          <div className="h-64 p-4">
            {loading || !data ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.series} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDate} {...axisProps} />
                  <YAxis
                    {...axisProps}
                    tickFormatter={(value: number) => String(Math.round(value / 100))}
                  />
                  <Tooltip
                    {...tooltipStyle()}
                    labelFormatter={shortDate}
                    formatter={(value: number) => [formatPrice(value), "Completed"]}
                  />
                  <Bar dataKey="revenueFils" fill={SERIES_ALT} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Top products"
            description="By quantity requested in this period."
          />
          <div className="h-64 p-4">
            {loading || !data ? (
              <Skeleton className="h-full" />
            ) : data.topProducts.length === 0 ? (
              <p className="grid h-full place-items-center text-sm text-muted">
                No order items in this period yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.topProducts}
                  layout="vertical"
                  margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
                >
                  <CartesianGrid stroke={GRID} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} {...axisProps} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    {...axisProps}
                    tickFormatter={(value: string) =>
                      value.length > 18 ? `${value.slice(0, 17)}…` : value
                    }
                  />
                  <Tooltip
                    {...tooltipStyle()}
                    formatter={(value: number) => [value, "Units"]}
                  />
                  <Bar dataKey="quantity" fill={SERIES} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Prescription requests"
            description="All time, by outcome."
          />
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rxData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis allowDecimals={false} {...axisProps} />
                <Tooltip
                  {...tooltipStyle()}
                  formatter={(value: number) => [value, "Requests"]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {rxData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {data && (data.topSearches.length > 0 || data.topPages.length > 0) ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="What people searched for"
              description="Search terms only — no visitor is identified."
            />
            <ul className="divide-y divide-line">
              {data.topSearches.map((row) => (
                <li key={row.term} className="flex justify-between gap-4 px-5 py-2.5 text-sm">
                  <span className="truncate text-ink-soft">{row.term}</span>
                  <span className="tnum shrink-0 font-medium text-ink">{row.count}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Most viewed pages" description="Aggregate counts by day." />
            <ul className="divide-y divide-line">
              {data.topPages.map((row) => (
                <li key={row.path} className="flex justify-between gap-4 px-5 py-2.5 text-sm">
                  <span className="truncate text-ink-soft">{row.path}</span>
                  <span className="tnum shrink-0 font-medium text-ink">{row.views}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
