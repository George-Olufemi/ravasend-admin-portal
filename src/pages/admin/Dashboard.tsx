import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Download, AlertOctagon, ChevronRight, Loader2 } from "lucide-react";
import {
  usersAPI,
  transactionAPI,
  segmentAPI,
  campaignAPI,
  systemSettingsAPI,
  dashboardAPI,
} from "@/lib/api";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

function fmtN(num: number) {
  return new Intl.NumberFormat().format(num || 0);
}

function ngn(num: number) {
  return "₦" + fmtN(num);
}

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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}

function PurpleBtn({
  children,
  onClick,
  className = "",
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <Button
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/[0.025] border border-border rounded-xl p-5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-[22px] font-bold text-foreground leading-none mt-1">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function ChannelBadge({ ch }: { ch: string }) {
  const norm = (ch || "");
  let bg = "bg-primary/10 text-primary border-primary/20";
  if (norm.includes("email") || norm.includes("mail")) bg = "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (norm.includes("push") || norm.includes("notification")) bg = "bg-purple-500/10 text-purple-400 border-purple-500/20";
  if (norm.includes("sms")) bg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${bg}`}>
      {ch}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const norm = (status || "").toLowerCase();
  if (norm === "active" || norm === "running" || norm === "live" || norm === "completed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase">
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-zinc-500/15 text-zinc-400 border border-zinc-500/20 uppercase">
      {status}
    </span>
  );
}

export function VolumeChart({ data }: { data: { d: string; v: number }[] }) {
  const W = 560;
  const H = 180;
  const pad = { top: 16, right: 16, bottom: 32, left: 52 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;
  const maxV = Math.max(...data.map((d) => d.v), 1);
  const cx = (i: number) => pad.left + (i / Math.max(data.length - 1, 1)) * iW;
  const cy = (v: number) => pad.top + (1 - Math.min(v / maxV, 1)) * iH;
  const linePts = data.map((d, i) => `${cx(i)},${cy(d.v)}`).join(" L ");
  const areaPath = `M ${linePts} L ${cx(data.length - 1)},${pad.top + iH} L ${cx(0)},${pad.top + iH} Z`;

  const yTicks = [
    0,
    Number((maxV * 0.25).toFixed(1)),
    Number((maxV * 0.5).toFixed(1)),
    Number((maxV * 0.75).toFixed(1)),
    maxV,
  ];

  const fmtChartY = (v: number) => {
    if (maxV >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
    if (maxV >= 1_000) return `₦${(v / 1_000).toFixed(0)}k`;
    return `₦${Math.round(v)}`;
  };

  const xLabelStep = Math.max(1, Math.floor(data.length / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
      <defs>
        <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7B3FE4" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#7B3FE4" stopOpacity={0} />
        </linearGradient>
      </defs>
      {yTicks.slice(1).map((v, i) => (
        <line
          key={i}
          x1={pad.left}
          x2={W - pad.right}
          y1={cy(v)}
          y2={cy(v)}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
        />
      ))}
      {yTicks.map((v, i) => (
        <text key={i} x={pad.left - 6} y={cy(v) + 4} textAnchor="end" fontSize={10} fill="#8B86A8">
          {fmtChartY(v)}
        </text>
      ))}
      {data.map((d, i) => {
        const showLabel = i % xLabelStep === 0 || i === data.length - 1;
        if (!showLabel) return null;
        return (
          <text key={d.d + i} x={cx(i)} y={H - 8} textAnchor="middle" fontSize={10} fill="#8B86A8">
            {d.d}
          </text>
        );
      })}
      <path d={areaPath} fill="url(#volGrad)" />
      <polyline points={linePts} fill="none" stroke="#7B3FE4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={`dot-${i}`} cx={cx(i)} cy={cy(d.v)} r={i === data.length - 1 ? 3.5 : 2} fill="#7B3FE4" />
      ))}
    </svg>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"last30days" | "last90days">("last30days");

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: usersAPI.getAll,
  });

  const { data: transactionsData, isLoading: loadingTxns } = useQuery({
    queryKey: ["transactions"],
    queryFn: transactionAPI.getAll,
  });

  const { data: segmentsData, isLoading: loadingSegments } = useQuery({
    queryKey: ["segments"],
    queryFn: segmentAPI.getAllSegments,
  });

  const { data: campaignsData, isLoading: loadingCampaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: campaignAPI.getAllCampaigns,
  });

  const { data: pauseStatusData } = useQuery({
    queryKey: ["withdrawal-pause-status"],
    queryFn: systemSettingsAPI.getWithdrawalPauseStatus,
  });

  const { data: activeUsersRes, isLoading: loadingActiveUsers } = useQuery({
    queryKey: ["total-active-users"],
    queryFn: dashboardAPI.getTotalActiveUsers,
  });

  const { data: totalVolumeRes, isLoading: loadingTotalVolume } = useQuery({
    queryKey: ["total-transaction-volume"],
    queryFn: dashboardAPI.getTotalTransactionVolume,
  });

  const { data: graphRes, isLoading: loadingGraph } = useQuery({
    queryKey: ["transaction-volume-graph", period],
    queryFn: () => dashboardAPI.getTransactionVolumeGraph(period),
  });

  const users = useMemo(() => usersData?.users || [], [usersData]);
  const transactions = useMemo(() => transactionsData?.data || [], [transactionsData]);

  const withdrawalPaused = useMemo(() => {
    if (pauseStatusData?.data) {
      return !pauseStatusData.data.isPermitted;
    }
    return false;
  }, [pauseStatusData]);

  const chartData = useMemo(() => {
    const txs = graphRes?.data?.transactions || [];
    if (txs.length === 0) {
      return [{ d: "No Data", v: 0 }];
    }
    return txs.map((item) => {
      let dStr = item.date;
      try {
        if (item.date) {
          dStr = format(new Date(item.date + "T00:00:00"), "MMM d");
        }
      } catch (e) {
        dStr = item.date;
      }
      return {
        d: dStr,
        v: item.amount || 0,
      };
    });
  }, [graphRes]);

  const pendingWithdrawalsCount = useMemo(() => {
    return transactions.filter(
      (t) =>
        ((t.source || "").toLowerCase().includes("bank transfer") || (t.source || "").toLowerCase().includes("withdrawal")) &&
        ["PENDING", "PROCESSING", "HELD"].includes((t.status || "").toUpperCase())
    ).length;
  }, [transactions]);

  const pendingWithdrawalsAmount = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          ((t.source || "").toLowerCase().includes("bank transfer") || (t.source || "").toLowerCase().includes("withdrawal")) &&
          ["PENDING", "PROCESSING", "HELD"].includes((t.status || "").toUpperCase())
      )
      .reduce((acc, t) => acc + (t.amount || 0), 0);
  }, [transactions]);

  const activeSegments = useMemo(() => {
    const raw = segmentsData?.data || (Array.isArray(segmentsData) ? segmentsData : []);
    const colors = ["#7B3FE4", "#EF4444", "#10B981", "#3B82F6", "#F59E0B"];
    return raw.map((s: any, idx: number) => ({
      id: s._id || String(idx),
      name: s.segmentName || "Unnamed Segment",
      userCount: s.totalUserTargeted ?? (s.emails ? s.emails.length : 0),
      status: s.status || "active",
      color: colors[idx % colors.length],
    }));
  }, [segmentsData]);

  const activeCampaigns = useMemo(() => {
    const raw = campaignsData?.data || (Array.isArray(campaignsData) ? campaignsData : []);
    return raw.map((c: any) => {
      const recipientsCount = c.recipients ? c.recipients.length : (c.totalRecipients || 0);
      const sentCount = c.totalSent || recipientsCount;
      const openedCount = c.totalOpened || 0;
      const openRate = sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0;
      const channel = c.campaignType ? [c.campaignType] : ["Email"];

      return {
        id: c._id,
        name: c.campaignName || "Campaign",
        segment: c.subject || c.message || "Target Segment",
        channels: channel,
        conversions: c.conversionReward && c.conversionReward !== "0" ? Number(c.conversionReward) : (c.totalDelivered || recipientsCount),
        openRate,
        status: c.status || "active",
      };
    });
  }, [campaignsData]);

  const exportReport = () => {
    const totalVol = totalVolumeRes?.data?.totalAmount || 0;
    const activeUsrs = activeUsersRes?.data?.totalActiveUsers || 0;
    const reportData = [
      ["Metric", "Value"],
      ["Total Users", users.length],
      ["Active Users", activeUsrs],
      ["Total Transaction Volume (NGN)", totalVol],
      ["Total Segments", activeSegments.length],
      ["Total Campaigns", activeCampaigns.length],
      ["Withdrawal Kill Switch", withdrawalPaused ? "ACTIVE" : "INACTIVE"],
      ["Export Date", new Date().toLocaleString()],
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      reportData.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dashboard-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoadingOverall =
    loadingUsers &&
    loadingTxns &&
    loadingSegments &&
    loadingCampaigns &&
    loadingActiveUsers &&
    loadingTotalVolume &&
    loadingGraph;

  if (isLoadingOverall) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const activeUsersCount = activeUsersRes?.data?.totalActiveUsers ?? 0;
  const activeUsersChange = activeUsersRes?.data?.percentageChange;

  const totalVolAmount = totalVolumeRes?.data?.totalAmount ?? 0;
  const totalVolChange = totalVolumeRes?.data?.percentageChange;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-7">
      <PageHeader
        title="Dashboard"
        subtitle="Platform activity and key metrics at a glance"
        action={
          <PurpleBtn onClick={exportReport}>
            <Download size={13} /> Export Report
          </PurpleBtn>
        }
      />

      {withdrawalPaused && (
        <div className="mb-6 p-4 bg-red-500/8 border border-red-500/25 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertOctagon size={18} className="text-red-400" />
            <div>
              <p className="text-[13px] font-bold text-red-400">Withdrawal Kill Switch Active</p>
              <p className="text-[11px] text-red-400/70 mt-0.5">
                All withdrawals paused · {pendingWithdrawalsCount} requests held · {ngn(pendingWithdrawalsAmount)} on hold
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/withdrawal-control")}
            className="text-[11px] text-red-400 border border-red-500/25 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors font-semibold"
          >
            Manage →
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Users" value={fmtN(users.length)} sub="Registered on Ravasend" />
        <StatCard
          label="Active Users"
          value={fmtN(activeUsersCount)}
          sub={activeUsersChange ? `${activeUsersChange} vs prev month` : "Active Users"}
        />
        <StatCard
          label="Volume"
          value={
            totalVolAmount >= 1000000
              ? `₦${(totalVolAmount / 1000000).toFixed(1)}M`
              : ngn(totalVolAmount)
          }
          sub={totalVolChange ? `${totalVolChange} vs prev month` : "Live transaction volume"}
        />
        <StatCard
          label={withdrawalPaused ? "Amount Held" : "Pending Withdrawals"}
          value={ngn(pendingWithdrawalsAmount)}
          sub={`${pendingWithdrawalsCount} requests`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6">
        <div className="sm:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[13px] font-bold text-foreground">Transaction Volume</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {period === "last30days" ? "Last 30 days" : "Last 90 days"} transaction volume trend
              </p>
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "last30days" | "last90days")}
              className="text-[11px] bg-secondary border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none cursor-pointer"
            >
              <option value="last30days">last30days</option>
              <option value="last90days">last90days</option>
            </select>
          </div>
          {loadingGraph ? (
            <div className="flex items-center justify-center h-[180px]">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <VolumeChart data={chartData} />
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-[13px] font-bold text-foreground mb-1">Active Segments</h3>
            <p className="text-[11px] text-muted-foreground mb-4">Messaging buckets</p>
            <div className="space-y-3">
              {loadingSegments ? (
                <p className="text-[12px] text-muted-foreground flex items-center gap-2">
                  <Loader2 className="animate-spin" size={12} />
                </p>
              ) : activeSegments.length > 0 ? (
                activeSegments.slice(0, 5).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="size-2 rounded-full shrink-0 capitalize" style={{ backgroundColor: s.color }} />
                      <span className="text-[12px] text-foreground truncate capitalize">{s.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground shrink-0 ml-2 capitalize">{fmtN(s.userCount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-muted-foreground">No segments found.</p>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/segments")}
            className="mt-4 text-[11px] text-primary flex items-center gap-1 font-semibold hover:text-primary/80 transition-colors"
          >
            View all <ChevronRight size={11} />
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h3 className="text-[13px] font-bold text-foreground">Recent Campaigns</h3>
          <button
            onClick={() => navigate("/admin/campaign")}
            className="text-[11px] text-primary font-semibold hover:text-primary/80 transition-colors"
          >
            View all →
          </button>
        </div>
        <div className="divide-y divide-border">
          {loadingCampaigns ? (
            <div className="p-8 text-center text-[12px] text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={14} />
            </div>
          ) : activeCampaigns.length > 0 ? (
            activeCampaigns.map((c: any) => (
              <div key={c.id} className="px-5 py-3.5 flex items-center gap-3 overflow-x-auto min-w-0">
                <div className="flex-1 min-w-0 shrink-0" style={{ minWidth: 140 }}>
                  <p className="text-[13px] font-semibold text-foreground truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{c.segment}</p>
                </div>
                <div className="hidden sm:flex gap-1 shrink-0">
                  {c.channels.map((ch: string) => (
                    <ChannelBadge key={ch} ch={ch} />
                  ))}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-bold text-primary">{fmtN(c.conversions)}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">conversions</p>
                </div>
                <div className="hidden sm:block text-right shrink-0">
                  <p className="text-[13px] font-bold text-foreground">{c.openRate}%</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">open rate</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-[12px] text-muted-foreground">
              No active campaigns found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

