import React, { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function DateInput({
  value,
  onChange,
  label,
  min,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  min?: string;
}) {
  return (
    <div>
      {label && <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">{label}</label>}
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="bg-secondary border border-border rounded-xl px-3 py-1.5 text-[12px] text-foreground focus:outline-none focus:border-primary/50 [color-scheme:dark]"
      />
    </div>
  );
}

function PurpleBtn({
  children,
  onClick,
  size = "md",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

const ANALYTICS_DAILY = Array.from({ length: 31 }, (_, i) => {
  const d = new Date(2026, 6, 1 + i);
  const day = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const signups = Math.floor(80 + Math.random() * 120 + (i > 20 ? 50 : 0));
  const volume = Math.floor(8_000_000 + Math.random() * 6_000_000 + i * 200_000);
  const fees = Math.floor(volume * 0.008 + Math.random() * 20000);
  const txns = Math.floor(300 + Math.random() * 250 + i * 5);
  return { day, signups, volume, fees, txns };
});

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState("2026-07-01");
  const [endDate, setEndDate] = useState("2026-07-30");
  const [metric, setMetric] = useState<"volume" | "signups" | "fees" | "txns">("volume");

  const filtered = ANALYTICS_DAILY.filter((d) => {
    const idx = ANALYTICS_DAILY.indexOf(d);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const base = new Date(2026, 6, 1 + idx);
    return base >= start && base <= end;
  });

  const totals = filtered.reduce(
    (acc, d) => ({
      volume: acc.volume + d.volume,
      signups: acc.signups + d.signups,
      fees: acc.fees + d.fees,
      txns: acc.txns + d.txns,
    }),
    { volume: 0, signups: 0, fees: 0, txns: 0 }
  );

  const metricConfig = {
    volume: { label: "Transaction Volume", color: "#7B3FE4", format: (v: number) => `₦${(v / 1_000_000).toFixed(1)}M` },
    signups: { label: "New Signups", color: "#34d399", format: (v: number) => v.toLocaleString() },
    fees: { label: "Fees Collected", color: "#f59e0b", format: (v: number) => `₦${(v / 1000).toFixed(0)}K` },
    txns: { label: "Transactions", color: "#60a5fa", format: (v: number) => v.toLocaleString() },
  };

  const metricKeys: Array<"volume" | "signups" | "fees" | "txns"> = ["volume", "signups", "fees", "txns"];

  const handleExportCSV = () => {
    const headers = ["Day", "Signups", "Volume (NGN)", "Fees (NGN)", "Transactions"];
    const rows = filtered.map((d) => [d.day, d.signups, d.volume, d.fees, d.txns]);
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

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-7">
      <PageHeader title="Analytics" subtitle="Transaction trends, growth metrics, and revenue insights" />

      {/* Date range + metric picker */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <DateInput value={startDate} onChange={setStartDate} />
          <span className="text-muted-foreground text-[11px]">→</span>
          <DateInput value={endDate} min={startDate} onChange={setEndDate} />
        </div>
        <div className="flex items-center gap-1 bg-white/5 border border-border rounded-xl p-1 overflow-x-auto">
          {metricKeys.map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all capitalize ${metric === m ? "text-white" : "text-muted-foreground hover:text-foreground"
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

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {metricKeys.map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`p-5 rounded-xl border transition-all text-left ${metric === m ? "border-primary/30 bg-primary/5" : "border-border bg-white/[0.025] hover:border-primary/20"
              }`}
          >
            <p className="text-[11px] text-muted-foreground mb-1">{metricConfig[m].label}</p>
            <p
              className="text-[22px] font-bold font-mono"
              style={{ color: metric === m ? metricConfig[m].color : undefined }}
            >
              {metricConfig[m].format(totals[m])}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{filtered.length} days selected</p>
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
          <PurpleBtn onClick={handleExportCSV}>
            <Download size={12} /> Export CSV
          </PurpleBtn>
        </div>
        {filtered.length > 0 ? (
          <div className="h-56 flex items-end gap-0.5">
            {filtered.map((d, i) => {
              const vals = filtered.map((x) => x[metric]);
              const max = Math.max(...vals);
              const h = max > 0 ? (d[metric] / max) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
                  <div className="relative w-full flex justify-center">
                    <div className="absolute bottom-full mb-1 hidden group-hover:flex bg-zinc-900 border border-border rounded-lg px-2 py-1 text-[10px] text-foreground whitespace-nowrap z-10 flex-col items-center">
                      <span className="font-bold">{metricConfig[metric].format(d[metric])}</span>
                      <span className="text-muted-foreground">{d.day}</span>
                    </div>
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{
                        height: `${Math.max(h * 1.8, 4)}px`,
                        background: metricConfig[metric].color + (metric === "volume" ? "cc" : "99"),
                      }}
                    />
                  </div>
                  {filtered.length <= 14 && <span className="text-[8px] text-muted-foreground">{d.day.split(" ")[1]}</span>}
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
              {[...filtered]
                .sort((a, b) => b.volume - a.volume)
                .slice(0, 7)
                .map((d, i) => (
                  <tr key={d.day} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}</span>
                        <span className="text-[12px] font-semibold text-foreground">{d.day}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[12px] font-mono font-bold text-primary">
                        ₦{(d.volume / 1_000_000).toFixed(2)}M
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[10px] text-muted-foreground">{d.txns} txns</span>
                    </td>
                  </tr>
                ))}
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
              {[...filtered]
                .sort((a, b) => b.signups - a.signups)
                .slice(0, 7)
                .map((d, i) => (
                  <tr key={d.day} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}</span>
                        <span className="text-[12px] font-semibold text-foreground">{d.day}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[12px] font-mono font-bold text-emerald-400">+{d.signups}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[10px] text-muted-foreground">₦{(d.fees / 1000).toFixed(0)}K fees</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
