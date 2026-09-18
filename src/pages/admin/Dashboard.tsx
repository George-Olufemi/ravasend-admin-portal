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
import { fmtN, ngn } from "@/lib/formatters";
import {
  PageHeader,
  PurpleBtn,
  StatCard,
  StatusBadge,
} from "@/components/admin/shared";
import {
  VolumeChart,
  ChannelBadge,
  exportDashboardReport,
} from "@/features/dashboard";

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
    return txs.map((item: any) => {
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
      (t: any) =>
        ((t.source || "").toLowerCase().includes("bank transfer") || (t.source || "").toLowerCase().includes("withdrawal")) &&
        ["PENDING", "PROCESSING", "HELD"].includes((t.status || "").toUpperCase())
    ).length;
  }, [transactions]);

  const pendingWithdrawalsAmount = useMemo(() => {
    return transactions
      .filter(
        (t: any) =>
          ((t.source || "").toLowerCase().includes("bank transfer") || (t.source || "").toLowerCase().includes("withdrawal")) &&
          ["PENDING", "PROCESSING", "HELD"].includes((t.status || "").toUpperCase())
      )
      .reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
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

  const handleExport = () => {
    const totalVol = totalVolumeRes?.data?.totalAmount || 0;
    const activeUsrs = activeUsersRes?.data?.totalActiveUsers || 0;
    exportDashboardReport(
      users.length,
      activeUsrs,
      totalVol,
      activeSegments.length,
      activeCampaigns.length,
      withdrawalPaused
    );
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
          <PurpleBtn onClick={handleExport}>
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
