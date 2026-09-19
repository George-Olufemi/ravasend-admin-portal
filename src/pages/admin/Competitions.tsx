import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, ChevronLeft, ChevronRight, Clock, Download,
  Eye, EyeOff, Flag, Lock, Medal, Pencil, Plus, RefreshCw,
  Search, Send, Trash2, TrendingDown, TrendingUp, Wallet, CheckCircle2,
} from "lucide-react";
import {
  competitionAPI,
  CompetitionItem,
  CreateCompetitionPayload,
  CompetitionParticipantItem,
} from "@/lib/api";
import { COMP_CATEGORIES, COMP_TYPES } from "@/features/competitions";
import { ngn, fmtN, Avatar, DateInput, PageHeader, PurpleBtn, SlidePanel, StatCard, THead, TableWrap } from "@/features/competitions";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function useCountdown(endDateStr?: string) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  React.useEffect(() => {
    if (!endDateStr) return;
    const tick = () => {
      const diff = Math.max(0, new Date(endDateStr).getTime() - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({ d, h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDateStr]);
  return time;
}

export default function CompetitionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [editTarget, setEditTarget] = useState<CompetitionItem | null>(null);
  const [deletingComp, setDeletingComp] = useState<CompetitionItem | null>(null);

  const [boardSearch, setBoardSearch] = useState("");
  const [boardFrozen, setBoardFrozen] = useState<Set<string>>(new Set());
  const [flagTarget, setFlagTarget] = useState<{ compId: string; userId: string; user: string } | null>(null);
  const [flagNote, setFlagNote] = useState("");
  const [disbursedComps, setDisbursedComps] = useState<Set<string>>(new Set());
  const [showDisburseConfirm, setShowDisburseConfirm] = useState<string | null>(null);

  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpNote, setTopUpNote] = useState("");
  const [reserveBalance, setReserveBalance] = useState(2_400_000);
  const [topUpHistory, setTopUpHistory] = useState([
    { date: "Jul 15, 2026", amount: 1_000_000, note: "Q3 reserve top-up" },
    { date: "Jun 1, 2026", amount: 500_000, note: "Bills Bonanza prep" },
  ]);

  // React Query Calls
  // 1. Timeline Status (4 cards)
  const { data: timelineStatusResponse, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ["competitionTimelineStatus"],
    queryFn: competitionAPI.getTimelineStatus,
  });

  // 2. All Competitions
  const { data: competitionsResponse, isLoading: isLoadingComps } = useQuery({
    queryKey: ["allCompetitions"],
    queryFn: competitionAPI.getAllCompetitions,
  });

  // 3. Competition Detail
  const { data: singleCompResponse, isLoading: isLoadingSingleComp } = useQuery({
    queryKey: ["competitionDetail", selectedCompId],
    queryFn: () => competitionAPI.getCompetitionById(selectedCompId!),
    enabled: !!selectedCompId,
  });

  // 4. Competition Participants
  const { data: participantsResponse, isLoading: isLoadingParticipants } = useQuery({
    queryKey: ["competitionParticipants", selectedCompId],
    queryFn: () => competitionAPI.getCompetitionParticipants(selectedCompId!),
    enabled: !!selectedCompId,
  });

  const competitions: CompetitionItem[] = competitionsResponse?.data ?? [];
  const timelineStats = timelineStatusResponse?.data ?? {
    activeCompetition: 0,
    totalPrizePool: 0,
    totalParticipant: 0,
    pendingDisbursments: 0,
  };

  const currentDetailComp = singleCompResponse?.data ?? competitions.find((c) => c._id === selectedCompId) ?? null;
  const participantsList: CompetitionParticipantItem[] = participantsResponse?.data ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateCompetitionPayload) => competitionAPI.createCompetition(payload),
    onSuccess: () => {
      toast({ title: "Success", description: "Competition created successfully." });
      queryClient.invalidateQueries({ queryKey: ["allCompetitions"] });
      queryClient.invalidateQueries({ queryKey: ["competitionTimelineStatus"] });
      setShowCreatePanel(false);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create competition.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateCompetitionPayload }) =>
      competitionAPI.updateCompetition(id, payload),
    onSuccess: () => {
      toast({ title: "Success", description: "Competition updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["allCompetitions"] });
      queryClient.invalidateQueries({ queryKey: ["competitionTimelineStatus"] });
      if (selectedCompId) queryClient.invalidateQueries({ queryKey: ["competitionDetail", selectedCompId] });
      setShowCreatePanel(false);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update competition.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => competitionAPI.deleteCompetition(id),
    onSuccess: () => {
      toast({ title: "Success", description: "Competition deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["allCompetitions"] });
      queryClient.invalidateQueries({ queryKey: ["competitionTimelineStatus"] });
      setDeletingComp(null);
      if (view === "detail") {
        setView("list");
        setSelectedCompId(null);
      }
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete competition.",
        variant: "destructive",
      });
    },
  });

  // Form State
  const blankCompForm = () => ({
    title: "",
    competitionType: "Crypto",
    typeSubcategory: "USDT",
    typeSubcategories: ["All assets"],
    customTypeDescription: "",
    tagline: "",
    seasonLabel: "Season 1",
    prizePool: "",
    status: "UPCOMING",
    startDate: "",
    endDate: "",
    entryCondition: "Deposit qualifying amount to participate",
    minQualifyAmount: "",
  });

  const [compForm, setCompForm] = useState(blankCompForm());

  const countdown = useCountdown(currentDetailComp?.endDate);

  const projectedSpend = competitions
    .filter((c) => c.status?.toUpperCase() === "LIVE" || c.status?.toUpperCase() === "UPCOMING")
    .reduce((a, c) => a + (c.prizePool || 0), 0);
  const reserveOk = reserveBalance >= projectedSpend * 1.1;

  const openCreate = () => {
    setCompForm(blankCompForm());
    setEditTarget(null);
    setShowCreatePanel(true);
  };

  const openEdit = (comp: CompetitionItem) => {
    setEditTarget(comp);
    setCompForm({
      title: comp.title || "",
      competitionType: comp.competitionType || "Crypto",
      typeSubcategory: comp.assets?.[0] || "USDT",
      typeSubcategories: comp.assets && comp.assets.length ? comp.assets : ["All assets"],
      customTypeDescription: comp.competitionType === "Custom" ? comp.assets?.[0] || "" : "",
      tagline: comp.tagline || "",
      seasonLabel: comp.seasonLabel || "Season 1",
      prizePool: String(comp.prizePool ?? ""),
      status: comp.status?.toUpperCase() || "UPCOMING",
      startDate: comp.startDate ? comp.startDate.split("T")[0] : "",
      endDate: comp.endDate ? comp.endDate.split("T")[0] : "",
      entryCondition: comp.entryCondition || "",
      minQualifyAmount: String(comp.minQualifyAmount ?? ""),
    });
    setShowCreatePanel(true);
  };

  const saveComp = () => {
    if (!compForm.title.trim()) {
      toast({ title: "Validation Error", description: "Title is required", variant: "destructive" });
      return;
    }

    const payload: CreateCompetitionPayload = {
      title: compForm.title,
      competitionType: compForm.competitionType,
      assets: compForm.typeSubcategories && compForm.typeSubcategories.length ? compForm.typeSubcategories : ["All assets"],
      tagline: compForm.tagline,
      seasonLabel: compForm.seasonLabel,
      status: compForm.status,
      minQualifyAmount: parseInt(compForm.minQualifyAmount) || 0,
      entryCondition: compForm.entryCondition || "Qualifying activity required",
      prizePool: parseInt(compForm.prizePool) || 0,
      startDate: compForm.startDate ? `${compForm.startDate}T00:00:00.000Z` : new Date().toISOString(),
      endDate: compForm.endDate ? `${compForm.endDate}T00:00:00.000Z` : new Date().toISOString(),
    };

    if (editTarget) {
      updateMutation.mutate({ id: editTarget._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredComps = competitions.filter((comp) => {
    if (filterStatus === "all") return true;
    return comp.status?.toUpperCase() === filterStatus.toUpperCase();
  });

  const statusColors: Record<string, string> = {
    LIVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    UPCOMING: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    upcoming: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    ENDED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
    ended: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
    DRAFT: "bg-zinc-600/15 text-zinc-500 border-zinc-600/20",
    draft: "bg-zinc-600/15 text-zinc-500 border-zinc-600/20",
  };

  const statusLabel = (s: string) => {
    const upper = s?.toUpperCase();
    if (upper === "LIVE" || upper === "ACTIVE") return "● Live";
    if (upper === "UPCOMING") return "Upcoming";
    if (upper === "ENDED") return "Ended";
    if (upper === "DRAFT") return "Draft";
    return s;
  };

  const medalColor = (r: number) => (r === 1 ? "text-amber-400" : r === 2 ? "text-zinc-300" : "text-amber-600");

  // ── List View ──────────────────────────────────────────────────────────────

  if (view === "list") {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-7">
        <PageHeader
          title="Competitions"
          subtitle="Manage all prize competitions — create, edit, and settle seasons"
          action={
            <PurpleBtn onClick={openCreate}>
              <Plus size={13} /> New Competition
            </PurpleBtn>
          }
        />

        {/* Reserve wallet banner */}
        <div
          className={`mb-5 p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            reserveOk ? "bg-emerald-500/[0.05] border-emerald-500/20" : "bg-red-500/[0.07] border-red-500/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`size-9 rounded-xl flex items-center justify-center ${reserveOk ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
              <Wallet size={16} className={reserveOk ? "text-emerald-400" : "text-red-400"} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-foreground">Prize Reserve Wallet</p>
              <p className="text-[11px] text-muted-foreground">
                Balance: <span className="font-bold text-foreground">{ngn(reserveBalance)}</span>
                <span className="mx-2">·</span>
                Projected spend: <span className="font-semibold">{ngn(projectedSpend)}</span>
                {!reserveOk && <span className="ml-2 text-red-400 font-semibold">⚠ Below 110% safety threshold</span>}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowTopUp(true)}
            className="text-[11px] font-semibold border border-border rounded-lg px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Plus size={11} /> Top Up Reserve
          </button>
        </div>

        {/* 4 Summary StatCards from API */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            label="Active Competitions"
            value={isLoadingTimeline ? "..." : String(timelineStats.activeCompetition)}
          />
          <StatCard
            label="Total Prize Pool (Active)"
            value={isLoadingTimeline ? "..." : ngn(timelineStats.totalPrizePool)}
          />
          <StatCard
            label="Total Participants"
            value={isLoadingTimeline ? "..." : fmtN(timelineStats.totalParticipant)}
          />
          <StatCard
            label="Pending Disbursement"
            value={isLoadingTimeline ? "..." : String(timelineStats.pendingDisbursments)}
            sub="ended, not yet paid out"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 mb-5 flex-wrap">
          {["all", "LIVE", "UPCOMING", "ENDED", "DRAFT"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all capitalize whitespace-nowrap ${
                filterStatus === s ? "text-white" : "text-muted-foreground hover:text-foreground border border-border"
              }`}
              style={filterStatus === s ? { background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" } : {}}
            >
              {s === "all"
                ? `All (${competitions.length})`
                : `${statusLabel(s)} (${competitions.filter((c) => c.status?.toUpperCase() === s.toUpperCase()).length})`}
            </button>
          ))}
        </div>

        {/* Competitions Table */}
        <TableWrap>
          <THead cols={["Competition", "Type & Assets", "Status", "Prize Pool", "Qualifying Amount", "Start / End", "Actions"]} />
          <tbody className="divide-y divide-border">
            {isLoadingComps ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : filteredComps.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[13px] text-muted-foreground">
                  No competitions found in this filter.
                </td>
              </tr>
            ) : (
              filteredComps.map((comp) => {
                const isEnded = comp.status?.toUpperCase() === "ENDED";
                const needsDisburse = isEnded && !disbursedComps.has(comp._id);

                return (
                  <tr key={comp._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-semibold text-foreground">{comp.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {comp.seasonLabel}
                        {comp.tagline ? ` · ${comp.tagline}` : ""}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground">{comp.competitionType}</span>
                        <p className="text-[11px] font-bold text-foreground">
                          {Array.isArray(comp.assets) ? comp.assets.join(", ") : comp.assets || "All assets"}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[comp.status] || "border-border text-muted-foreground"}`}>
                        {statusLabel(comp.status)}
                      </span>
                      {needsDisburse && (
                        <p className="text-[9px] text-amber-400 font-semibold flex items-center gap-1 mt-1">
                          <Clock size={8} /> Pending Disbursement
                        </p>
                      )}
                      {disbursedComps.has(comp._id) && (
                        <p className="text-[9px] text-emerald-400 font-semibold mt-0.5">✓ Disbursed</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-mono font-bold text-foreground">{ngn(comp.prizePool)}</td>
                    <td className="px-5 py-3.5 text-[12px] font-mono text-muted-foreground">{ngn(comp.minQualifyAmount)}</td>
                    <td className="px-5 py-3.5 text-[12px] text-muted-foreground">
                      {comp.startDate ? new Date(comp.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-"}
                      {" - "}
                      {comp.endDate ? new Date(comp.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedCompId(comp._id);
                            setBoardSearch("");
                            setView("detail");
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                          <Eye size={11} /> View
                        </button>
                        <button
                          onClick={() => openEdit(comp)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                          <Pencil size={11} /> Edit
                        </button>
                        <button
                          onClick={() => setDeletingComp(comp)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </TableWrap>

        {renderCreatePanel()}
        {renderDeleteDialog()}
      </div>
    );
  }

  // ── Detail View ────────────────────────────────────────────────────────────

  const isFrozen = selectedCompId ? boardFrozen.has(selectedCompId) : false;
  const isDisbursed = selectedCompId ? disbursedComps.has(selectedCompId) : false;

  const filteredParticipants = participantsList.filter(
    (p) =>
      !boardSearch ||
      (p.user && p.user.toLowerCase().includes(boardSearch.toLowerCase())) ||
      (p.email && p.email.toLowerCase().includes(boardSearch.toLowerCase())) ||
      (p._id && p._id.toLowerCase().includes(boardSearch.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-7">
      {/* Navigation header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => {
            setView("list");
            setSelectedCompId(null);
          }}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-1.5"
        >
          <ChevronLeft size={13} /> All Competitions
        </button>
        <ChevronRight size={13} className="text-muted-foreground" />
        <span className="text-[13px] font-semibold text-foreground">{currentDetailComp?.title || "Competition Details"}</span>
      </div>

      {isLoadingSingleComp ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : !currentDetailComp ? (
        <div className="p-8 text-center text-muted-foreground">Competition not found.</div>
      ) : (
        <>
          {/* Header Card */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{ background: `radial-gradient(ellipse at 80% 50%, #7B3FE4, transparent 60%)` }}
            />
            <div className="relative flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusColors[currentDetailComp.status] || "border-border text-muted-foreground"}`}>
                    {statusLabel(currentDetailComp.status)}
                  </span>
                  <span className="text-[11px] font-semibold bg-secondary px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                    {currentDetailComp.competitionType}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{currentDetailComp.seasonLabel}</span>
                </div>
                <h2 className="text-[22px] font-black text-foreground mb-0.5">{currentDetailComp.title}</h2>
                <p className="text-[13px] text-muted-foreground mb-4">
                  {currentDetailComp.tagline} · Prize pool: <span className="font-bold text-foreground">{ngn(currentDetailComp.prizePool)}</span> · Qualifying amount: <span className="font-bold text-foreground">{ngn(currentDetailComp.minQualifyAmount)}</span>
                </p>

                {(currentDetailComp.status?.toUpperCase() === "LIVE" || currentDetailComp.status?.toUpperCase() === "UPCOMING") && (
                  <div className="flex items-center gap-3">
                    {[{ v: countdown.d, l: "D" }, { v: countdown.h, l: "H" }, { v: countdown.m, l: "M" }, { v: countdown.s, l: "S" }].map(({ v, l }) => (
                      <div key={l} className="flex flex-col items-center bg-secondary/80 border border-border rounded-xl px-4 py-2 min-w-[48px]">
                        <span className="text-[18px] font-black text-foreground font-mono leading-none">{String(v).padStart(2, "0")}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{l}</span>
                      </div>
                    ))}
                    <span className="text-[11px] text-muted-foreground">
                      {currentDetailComp.status?.toUpperCase() === "LIVE" ? "remaining" : `starts ${currentDetailComp.startDate ? new Date(currentDetailComp.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}`}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-row sm:flex-col gap-2 shrink-0 flex-wrap">
                <PurpleBtn onClick={() => openEdit(currentDetailComp)} size="sm">
                  <Pencil size={12} /> Edit Competition
                </PurpleBtn>
                {currentDetailComp.status?.toUpperCase() === "LIVE" && (
                  <button
                    onClick={() =>
                      setBoardFrozen((s) => {
                        const n = new Set(s);
                        isFrozen ? n.delete(selectedCompId!) : n.add(selectedCompId!);
                        return n;
                      })
                    }
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors flex items-center gap-1.5 ${
                      isFrozen ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Lock size={11} /> {isFrozen ? "Board Frozen" : "Freeze Board"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {/* Participants / Leaderboard section */}
            <div className="sm:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-bold text-foreground">{currentDetailComp.title} — Participants</p>
                  <p className="text-[11px] text-muted-foreground">{participantsList.length} registered participants</p>
                </div>
                <div className="flex items-center gap-2">
                  {isFrozen && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                      <Lock size={9} /> Frozen
                    </span>
                  )}
                  <div className="relative">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={boardSearch}
                      onChange={(e) => setBoardSearch(e.target.value)}
                      placeholder="Search participant…"
                      className="bg-secondary border border-border rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 w-40"
                    />
                  </div>
                  <PurpleBtn size="sm">
                    <Download size={11} /> CSV
                  </PurpleBtn>
                </div>
              </div>

              <div className="divide-y divide-border">
                {isLoadingParticipants ? (
                  <div className="py-12 text-center">
                    <LoadingSpinner />
                  </div>
                ) : filteredParticipants.length === 0 ? (
                  <div className="py-12 text-center text-[13px] text-muted-foreground">
                    No participants recorded yet for this competition.
                  </div>
                ) : (
                  filteredParticipants.map((entry, index) => {
                    const rank = entry.rank || index + 1;
                    const userName = entry.user || (typeof entry.userId === "object" ? entry.userId.fullName || entry.userId.email : entry.userId) || entry.email || `User #${rank}`;

                    return (
                      <div key={entry._id || index} className="px-5 py-3 flex items-center gap-4">
                        <div className="w-7 shrink-0 text-center">
                          {rank <= 3 ? (
                            <Medal size={16} className={medalColor(rank)} />
                          ) : (
                            <span className="text-[12px] font-bold text-muted-foreground">{rank}</span>
                          )}
                        </div>
                        <Avatar name={userName} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-foreground">{userName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {entry.metric !== undefined ? `${entry.metric.toLocaleString()} ${entry.metricLabel || ""}` : entry.email || "Participant"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sidebar Details */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl overflow-hidden p-5">
                <p className="text-[13px] font-bold text-foreground mb-3">Entry Condition</p>
                <p className="text-[12px] text-muted-foreground bg-secondary/50 p-3 rounded-xl border border-border">
                  {currentDetailComp.entryCondition || "No specific entry conditions set."}
                </p>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden p-5 space-y-3">
                <p className="text-[13px] font-bold text-foreground">Competition Details</p>
                <div className="text-[12px] space-y-2">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-semibold text-foreground">{currentDetailComp.competitionType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Assets:</span>
                    <span className="font-semibold text-foreground">{Array.isArray(currentDetailComp.assets) ? currentDetailComp.assets.join(", ") : currentDetailComp.assets}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Prize Pool:</span>
                    <span className="font-bold text-foreground font-mono">{ngn(currentDetailComp.prizePool)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Min Qualify:</span>
                    <span className="font-bold text-foreground font-mono">{ngn(currentDetailComp.minQualifyAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {renderCreatePanel()}
      {renderDeleteDialog()}
    </div>
  );

  // ── Create / Edit Panel ───────────────────────────────────────────────────

  function renderCreatePanel() {
    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
      <SlidePanel
        open={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        title={editTarget ? `Edit: ${editTarget.title}` : "New Competition"}
        subtitle={editTarget ? "Update competition details" : "Fill in competition details"}
        footer={
          <div className="flex gap-3">
            <PurpleBtn onClick={saveComp} disabled={isPending}>
              {isPending ? "Saving..." : editTarget ? "Save Changes" : "Create Competition"}
            </PurpleBtn>
            <button
              onClick={() => setShowCreatePanel(false)}
              className="flex-1 border border-border text-muted-foreground text-[13px] rounded-xl hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              value={compForm.title}
              onChange={(e) => setCompForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              placeholder="e.g. Crypto deposit"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] text-muted-foreground font-semibold block">Competition Type</label>
            <div className="flex flex-wrap gap-1.5">
              {COMP_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setCompForm((f) => ({
                      ...f,
                      competitionType: t,
                      typeSubcategories: COMP_CATEGORIES[t] ? [COMP_CATEGORIES[t][0]] : ["All assets"],
                      typeSubcategory: COMP_CATEGORIES[t] ? COMP_CATEGORIES[t][0] : "All assets",
                    }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                    compForm.competitionType === t
                      ? "bg-primary/15 text-primary border-primary/40"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-white/20"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div>
              {compForm.competitionType === "Custom" ? (
                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold block mb-1.5">Describe custom target asset / subcategory</label>
                  <input
                    value={compForm.customTypeDescription}
                    onChange={(e) =>
                      setCompForm((f) => ({
                        ...f,
                        customTypeDescription: e.target.value,
                        typeSubcategories: [e.target.value || "Custom"],
                      }))
                    }
                    placeholder="e.g. First deposit or custom asset"
                    className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                  />
                </div>
              ) : (
                <>
                  <p className="text-[10px] text-muted-foreground mb-1.5 font-semibold">Select Target Assets / Subcategories</p>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {(COMP_CATEGORIES[compForm.competitionType] || ["All assets"]).map((s) => {
                      const sel = compForm.typeSubcategories.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setCompForm((f) => {
                              const next = sel ? f.typeSubcategories.filter((x) => x !== s) : [...f.typeSubcategories.filter((x) => x !== "All assets"), s];
                              const final = next.length === 0 ? ["All assets"] : next;
                              return { ...f, typeSubcategories: final };
                            });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            sel ? "bg-primary/20 text-primary border-primary/40" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Tagline</label>
            <input
              value={compForm.tagline}
              onChange={(e) => setCompForm((f) => ({ ...f, tagline: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              placeholder="e.g. Cryptoparalle"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Season Label</label>
              <input
                value={compForm.seasonLabel}
                onChange={(e) => setCompForm((f) => ({ ...f, seasonLabel: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                placeholder="e.g. 202000 or Season 1"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Status</label>
              <select
                value={compForm.status}
                onChange={(e) => setCompForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-primary/50"
              >
                <option value="DRAFT">Draft</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="LIVE">Live</option>
                <option value="ENDED">Ended</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateInput label="Start Date" value={compForm.startDate} onChange={(v) => setCompForm((f) => ({ ...f, startDate: v }))} />
            <DateInput label="End Date" value={compForm.endDate} onChange={(v) => setCompForm((f) => ({ ...f, endDate: v }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Prize Pool (₦)</label>
              <input
                type="number"
                value={compForm.prizePool}
                onChange={(e) => setCompForm((f) => ({ ...f, prizePool: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                placeholder="e.g. 1000"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Min Qualifying Amount (₦)</label>
              <input
                type="number"
                value={compForm.minQualifyAmount}
                onChange={(e) => setCompForm((f) => ({ ...f, minQualifyAmount: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                placeholder="e.g. 20000"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Entry Condition</label>
            <textarea
              value={compForm.entryCondition}
              onChange={(e) => setCompForm((f) => ({ ...f, entryCondition: e.target.value }))}
              rows={2}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
              placeholder="e.g. if you deposit 20000 cryptocurrency get 1000 naira"
            />
          </div>
        </div>
      </SlidePanel>
    );
  }

  function renderDeleteDialog() {
    return (
      <Dialog
        open={!!deletingComp}
        onOpenChange={(open) => {
          if (!open) setDeletingComp(null);
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Delete Competition</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-[13px] text-muted-foreground">
            Are you sure you want to delete{" "}
            {deletingComp?.title ? <span className="font-semibold text-foreground">{deletingComp.title}</span> : "this competition"}?
            This action cannot be undone.
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex flex-col sm:flex-row">
            <button
              type="button"
              onClick={() => setDeletingComp(null)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-[12px] font-semibold border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (deletingComp) {
                  deleteMutation.mutate(deletingComp._id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-[12px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {deleteMutation.isPending ? <LoadingSpinner size="sm" /> : "Delete Competition"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
}