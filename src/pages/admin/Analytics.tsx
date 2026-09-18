import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { analyticsAPI, AnalyticsGraphItem } from "@/lib/api";
import { PageHeader, PurpleBtn } from "@/components/admin/shared";
import {
  DateInput,
  formatNaira,
  formatDateLabel,
  metricConfig,
  metricKeys,
} from "@/features/analytics";

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-08-30");
  const [metric, setMetric] = useState<"volume" | "signups" | "fees" | "txns">("volume");

  const { data: analyticsRes, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["analytics", startDate, endDate],
    queryFn: () => analyticsAPI.getAnalytics(startDate, endDate),
  });

  const summary = analyticsRes?.data?.summary ?? {
    totalTransactionSum: 0,
    totalUsers: 0,
    totalTransaction: 0,
    totalFeesSum: 0,
  };

  const graph = analyticsRes?.data?.graph ?? {
    transactionVolume: [],
    transactionCount: [],
    newUsers: [],
    fees: [],
  };

  const totals: Record<"volume" | "signups" | "fees" | "txns", number> = {
    volume: summary.totalTransactionSum ?? 0,
    signups: summary.totalUsers ?? 0,
    fees: summary.totalFeesSum ?? 0,
    txns: summary.totalTransaction ?? 0,
  };

  const activeGraphItems: AnalyticsGraphItem[] = useMemo(() => {
    switch (metric) {
      case "volume":
        return graph.transactionVolume || [];
      case "signups":
        return graph.newUsers || [];
      case "fees":
        return graph.fees || [];
      case "txns":
        return graph.transactionCount || [];
      default:
        return [];
    }
  }, [metric, graph]);

  // Maps for table cross-referencing
  const txnsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    (graph.transactionCount || []).forEach((item: any) => {
      map[item.date] = item.total;
    });
    return map;
  }, [graph.transactionCount]);

  const feesByDate = useMemo(() => {
    const map: Record<string, number> = {};
    (graph.fees || []).forEach((item: any) => {
      map[item.date] = item.total;
    });
    return map;
  }, [graph.fees]);

  const handleExportCSV = () => {
    // Collect all dates across graph metrics
    const allDates = Array.from(
      new Set([
        ...(graph.transactionVolume || []).map((x: any) => x.date),
        ...(graph.transactionCount || []).map((x: any) => x.date),
        ...(graph.newUsers || []).map((x: any) => x.date),
        ...(graph.fees || []).map((x: any) => x.date),
      ])
    ).sort();

    const volMap: Record<string, number> = {};
    (graph.transactionVolume || []).forEach((x: any) => (volMap[x.date] = x.total));
    const userMap: Record<string, number> = {};
    (graph.newUsers || []).forEach((x: any) => (userMap[x.date] = x.total));

    const headers = ["Date", "Transaction Volume (NGN)", "Transactions", "New Signups", "Fees (NGN)"];
    const rows = allDates.map((date) => [
      date,
      volMap[date] ?? 0,
      txnsByDate[date] ?? 0,
      userMap[date] ?? 0,
      feesByDate[date] ?? 0,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `analytics_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const topDaysByVolume = useMemo(() => {
    return [...(graph.transactionVolume || [])].sort((a, b) => b.total - a.total).slice(0, 7);
  }, [graph.transactionVolume]);

  const topDaysBySignups = useMemo(() => {
    return [...(graph.newUsers || [])].sort((a, b) => b.total - a.total).slice(0, 7);
  }, [graph.newUsers]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-7">
      <PageHeader title="Analytics" subtitle="Transaction trends, growth metrics, and revenue insights" />

      {/* Date range + metric picker */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <DateInput value={startDate} onChange={setStartDate} label="Start Date" />
          <span className="text-muted-foreground text-[11px] self-end mb-2">→</span>
          <DateInput value={endDate} min={startDate} onChange={setEndDate} label="End Date" />
        </div>
        <div className="flex items-center gap-1 bg-white/5 border border-border rounded-xl p-1 overflow-x-auto self-end">
          {metricKeys.map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all capitalize ${
                metric === m ? "text-white" : "text-muted-foreground hover:text-foreground"
              }`}
              style={
                metric === m
                  ? {
                      background: metricConfig[m].color + "33",
                      color: metricConfig[m].color,
                      outline: `1px solid ${metricConfig[m].color}44`,
                    }
                  : {}
              }
            >
              {metricConfig[m].label}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-400 shrink-0" size={18} />
            <div>
              <p className="text-[13px] font-semibold text-red-300">Failed to load analytics data</p>
              <p className="text-[11px] text-red-400/80">{(error as any)?.response?.data?.message || "Error connecting to the analytics API."}</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-red-300 hover:text-white bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {metricKeys.map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`p-5 rounded-xl border transition-all text-left ${
              metric === m ? "border-primary/30 bg-primary/5" : "border-border bg-white/[0.025] hover:border-primary/20"
            }`}
          >
            <p className="text-[11px] text-muted-foreground mb-1">{metricConfig[m].label}</p>
            {isLoading ? (
              <div className="h-7 w-24 bg-white/10 animate-pulse rounded my-1" />
            ) : (
              <p
                className="text-[22px] font-bold font-mono"
                style={{ color: metric === m ? metricConfig[m].color : undefined }}
              >
                {metricConfig[m].format(totals[m])}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">Total for selected period</p>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white/[0.025] border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[13px] font-bold text-foreground">{metricConfig[metric].label}</p>
            <p className="text-[11px] text-muted-foreground">Daily breakdown for selected period</p>
          </div>
          <PurpleBtn onClick={handleExportCSV} disabled={isLoading || isError}>
            <Download size={12} /> Export CSV
          </PurpleBtn>
        </div>

        {isLoading ? (
          <div className="h-56 flex items-center justify-center text-[12px] text-muted-foreground gap-2">
            <Loader2 className="animate-spin text-primary" size={18} /> Loading analytics chart...
          </div>
        ) : activeGraphItems.length > 0 ? (
          <div className="h-56 flex items-end gap-1.5 overflow-x-auto pt-6 pb-2">
            {activeGraphItems.map((d: any, i: number) => {
              const maxVal = Math.max(...activeGraphItems.map((x) => x.total), 1);
              const h = maxVal > 0 ? (d.total / maxVal) * 100 : 0;
              const dateLabel = formatDateLabel(d.date);

              return (
                <div key={d.date || i} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group cursor-default">
                  <div className="relative w-full flex justify-center">
                    <div className="absolute bottom-full mb-1 hidden group-hover:flex bg-zinc-900 border border-border rounded-lg px-2 py-1 text-[10px] text-foreground whitespace-nowrap z-10 flex-col items-center shadow-xl">
                      <span className="font-bold">{metricConfig[metric].format(d.total)}</span>
                      <span className="text-muted-foreground">{dateLabel}</span>
                    </div>
                    <div
                      className="w-full rounded-t-sm transition-all hover:opacity-80"
                      style={{
                        height: `${Math.max(h * 1.8, 6)}px`,
                        background: metricConfig[metric].color + (metric === "volume" ? "cc" : "99"),
                      }}
                    />
                  </div>
                  <span className="text-[8px] text-muted-foreground truncate max-w-full">{dateLabel}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-56 flex items-center justify-center text-[12px] text-muted-foreground">
            No data in selected range
          </div>
        )}
      </div>

      {/* Breakdown tables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Top days by volume */}
        <div className="bg-white/[0.025] border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[13px] font-bold text-foreground">Top Days by Volume</p>
          </div>
          <table className="w-full">
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-center text-[12px] text-muted-foreground">
                    <Loader2 className="animate-spin inline mr-2" size={14} /> Loading volume data...
                  </td>
                </tr>
              ) : topDaysByVolume.length > 0 ? (
                topDaysByVolume.map((d: any, i: number) => (
                  <tr key={d.date} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}</span>
                        <span className="text-[12px] font-semibold text-foreground">{formatDateLabel(d.date)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[12px] font-mono font-bold text-primary">
                        {formatNaira(d.total)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[10px] text-muted-foreground">{txnsByDate[d.date] ?? 0} txns</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-center text-[12px] text-muted-foreground">
                    No volume records available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Daily signups */}
        <div className="bg-white/[0.025] border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[13px] font-bold text-foreground">User Signups</p>
          </div>
          <table className="w-full">
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-center text-[12px] text-muted-foreground">
                    <Loader2 className="animate-spin inline mr-2" size={14} /> Loading signup data...
                  </td>
                </tr>
              ) : topDaysBySignups.length > 0 ? (
                topDaysBySignups.map((d: any, i: number) => (
                  <tr key={d.date} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}</span>
                        <span className="text-[12px] font-semibold text-foreground">{formatDateLabel(d.date)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[12px] font-mono font-bold text-emerald-400">+{d.total}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[10px] text-muted-foreground">
                        {formatNaira(feesByDate[d.date] ?? 0)} fees
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-center text-[12px] text-muted-foreground">
                    No signup records available
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
