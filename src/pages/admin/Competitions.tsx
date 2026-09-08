import React, { useState } from "react";
import {
  AlertTriangle, ChevronLeft, ChevronRight, Clock, Download,
  Eye, EyeOff, Flag, Lock, Medal, Pencil, Plus, RefreshCw,
  Search, Send, Trash2, TrendingDown, TrendingUp, Wallet, CheckCircle2,
} from "lucide-react";
import type { PrizeTier, Competition, CompLeaderboardEntry } from "./competitions/types";
import { COMP_CATEGORIES, COMP_TYPES, INITIAL_COMPETITIONS, INITIAL_LEADERBOARDS } from "./competitions/data";
import {
  ngn, fmtN, Avatar, DateInput, PageHeader, PurpleBtn, SlidePanel, StatCard, THead, TableWrap,
} from "./competitions/ui";

// ─── Competitions ─────────────────────────────────────────────────────────────

function useCountdown(endDateStr: string) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  React.useEffect(() => {
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

// ─── CompetitionsPage ─────────────────────────────────────────────────────────

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>(INITIAL_COMPETITIONS);
  const [leaderboards, setLeaderboards] = useState<Record<string, CompLeaderboardEntry[]>>(INITIAL_LEADERBOARDS);
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [editTarget, setEditTarget] = useState<Competition | null>(null);
  const [boardSearch, setBoardSearch] = useState("");
  const [boardFrozen, setBoardFrozen] = useState<Set<string>>(new Set());
  const [flagTarget, setFlagTarget] = useState<{ compId: string; userId: string; user: string } | null>(null);
  const [flagNote, setFlagNote] = useState("");
  const [disbursedComps, setDisbursedComps] = useState<Set<string>>(new Set());
  const [showDisburseConfirm, setShowDisburseConfirm] = useState<string | null>(null);
  const [tiersDraft, setTiersDraft] = useState<PrizeTier[]>([]);
  const [editPrizesFor, setEditPrizesFor] = useState<string | null>(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpNote, setTopUpNote] = useState("");
  const [reserveBalance, setReserveBalance] = useState(2_400_000);
  const [topUpHistory, setTopUpHistory] = useState([
    { date: "Jul 15, 2026", amount: 1_000_000, note: "Q3 reserve top-up" },
    { date: "Jun 1, 2026", amount: 500_000, note: "Bills Bonanza prep" },
  ]);

  const blankCompForm = () => ({
    title: "", typeCategory: "Crypto", typeSubcategory: "USDT", typeSubcategories: ["USDT"] as string[],
    customTypeDescription: "",
    tagline: "", season: "Season 1",
    prizePool: "", status: "upcoming" as Competition["status"],
    start: "", end: "", entryCondition: "auto" as "auto" | "manual",
    minQualifyingAmt: "", visibility: "public" as "public" | "hidden",
    notes: "", referralBonus: "",
    prizeTiers: [{ rankFrom: 1, rankTo: 1, label: "1st place", prize: 300_000 }] as PrizeTier[],
  });
  const [compForm, setCompForm] = useState(blankCompForm());

  const countdown = useCountdown(selectedComp?.end ?? "2099-01-01");

  const projectedSpend = competitions.filter(c => c.status === "active" || c.status === "upcoming").reduce((a, c) => a + c.prizePool, 0);
  const reserveOk = reserveBalance >= projectedSpend * 1.1;

  const openCreate = () => { setCompForm(blankCompForm()); setEditTarget(null); setShowCreatePanel(true); };
  const openEdit = (comp: Competition) => {
    setEditTarget(comp);
    setCompForm({
      title: comp.title, typeCategory: comp.typeCategory || "Crypto", typeSubcategory: comp.typeSubcategory || "USDT", typeSubcategories: comp.typeSubcategories?.length ? comp.typeSubcategories : [comp.typeSubcategory || "USDT"],
      customTypeDescription: comp.typeCategory === "Custom" ? (comp.typeSubcategory || "") : "",
      tagline: comp.tagline, season: comp.season,
      prizePool: String(comp.prizePool), status: comp.status,
      start: comp.start, end: comp.end, entryCondition: comp.entryCondition,
      minQualifyingAmt: String(comp.minQualifyingAmt), visibility: comp.visibility,
      notes: comp.notes, referralBonus: String(comp.referralBonus ?? ""),
      prizeTiers: [...comp.prizeTiers],
    });
    setShowCreatePanel(true);
  };
  const saveComp = () => {
    if (!compForm.title) return;
    const comp: Competition = {
      id: editTarget?.id ?? `c${Date.now()}`,
      title: compForm.title,
      type: `${compForm.typeCategory} — ${compForm.typeSubcategories.join(", ")}`,
      typeCategory: compForm.typeCategory,
      typeSubcategory: compForm.typeSubcategories[0] || compForm.typeSubcategory,
      typeSubcategories: compForm.typeSubcategories,
      tagline: compForm.tagline, season: compForm.season,
      prizePool: parseInt(compForm.prizePool) || 0, status: compForm.status,
      start: compForm.start, end: compForm.end,
      participants: editTarget?.participants ?? 0,
      accentColor: editTarget?.accentColor ?? "#7B3FE4",
      entryCondition: compForm.entryCondition,
      minQualifyingAmt: parseInt(compForm.minQualifyingAmt) || 0,
      visibility: compForm.visibility, notes: compForm.notes,
      referralBonus: compForm.referralBonus ? parseInt(compForm.referralBonus) : undefined,
      prizeTiers: compForm.prizeTiers,
    };
    if (editTarget) {
      setCompetitions(cs => cs.map(c => c.id === editTarget.id ? comp : c));
      if (selectedComp?.id === editTarget.id) setSelectedComp(comp);
    } else {
      setCompetitions(cs => [...cs, comp]);
    }
    setShowCreatePanel(false);
  };
  const duplicateComp = (comp: Competition) => {
    setCompetitions(cs => [...cs, { ...comp, id: `c${Date.now()}`, title: `${comp.title} (Copy)`, status: "draft", participants: 0 }]);
  };
  const deleteComp = (id: string) => setCompetitions(cs => cs.filter(c => c.id !== id));

  const submitFlag = () => {
    if (!flagTarget || !flagNote.trim()) return;
    setLeaderboards(lb => ({ ...lb, [flagTarget.compId]: (lb[flagTarget.compId] || []).map(e => e.userId === flagTarget.userId ? { ...e, flagged: true, flagNote } : e) }));
    setFlagTarget(null); setFlagNote("");
  };
  const unflagUser = (compId: string, userId: string) => {
    setLeaderboards(lb => ({ ...lb, [compId]: (lb[compId] || []).map(e => e.userId === userId ? { ...e, flagged: false, flagNote: "" } : e) }));
  };

  const openEditPrizes = (comp: Competition) => { setEditPrizesFor(comp.id); setTiersDraft([...comp.prizeTiers]); };
  const savePrizes = () => {
    if (!editPrizesFor) return;
    setCompetitions(cs => cs.map(c => c.id === editPrizesFor ? { ...c, prizeTiers: tiersDraft } : c));
    if (selectedComp?.id === editPrizesFor) setSelectedComp(c => c ? { ...c, prizeTiers: tiersDraft } : c);
    setEditPrizesFor(null);
  };

  const filteredComps = filterStatus === "all" ? competitions : competitions.filter(c => c.status === filterStatus);

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    upcoming: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    ended: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
    draft: "bg-zinc-600/15 text-zinc-500 border-zinc-600/20",
  };
  const statusLabel = (s: string) => s === "active" ? "● Live" : s.charAt(0).toUpperCase() + s.slice(1);
  const medalColor = (r: number) => r === 1 ? "text-amber-400" : r === 2 ? "text-zinc-300" : "text-amber-600";

  const prizeForRank = (tiers: PrizeTier[], rank: number) => tiers.find(t => rank >= t.rankFrom && rank <= t.rankTo)?.prize ?? null;

  // ── List View ──────────────────────────────────────────────────────────────

  if (view === "list") {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-7">
        <PageHeader title="Competitions" subtitle="Manage all prize competitions — create, edit, and settle seasons"
          action={<PurpleBtn onClick={openCreate}><Plus size={13} /> New Competition</PurpleBtn>} />

        {/* Reserve wallet banner */}
        <div className={`mb-5 p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${reserveOk ? "bg-emerald-500/[0.05] border-emerald-500/20" : "bg-red-500/[0.07] border-red-500/30"}`}>
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
          <button onClick={() => setShowTopUp(true)}
            className="text-[11px] font-semibold border border-border rounded-lg px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            <Plus size={11} /> Top Up Reserve
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard label="Active Competitions" value={String(competitions.filter(c => c.status === "active").length)} />
          <StatCard label="Total Prize Pool (Active)" value={ngn(competitions.filter(c => c.status === "active").reduce((a, c) => a + c.prizePool, 0))} />
          <StatCard label="Total Participants" value={fmtN(competitions.reduce((a, c) => a + c.participants, 0))} />
          <StatCard label="Pending Disbursement" value={String(competitions.filter(c => c.status === "ended" && !disbursedComps.has(c.id)).length)} sub="ended, not yet paid out" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 mb-5 flex-wrap">
          {["all", "active", "upcoming", "ended", "draft"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all capitalize whitespace-nowrap ${filterStatus === s ? "text-white" : "text-muted-foreground hover:text-foreground border border-border"}`}
              style={filterStatus === s ? { background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" } : {}}>
              {s === "all" ? `All (${competitions.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${competitions.filter(c => c.status === s).length})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <TableWrap>
          <THead cols={["Competition", "Type", "Status", "Prize Pool", "Participants", "Ends", "Actions"]} />
          <tbody className="divide-y divide-border">
            {filteredComps.map(comp => {
              const needsDisburse = comp.status === "ended" && !disbursedComps.has(comp.id);
              // Auto-disburse: 23h after end date
              const endMs = new Date(comp.end).getTime();
              const autoDisburseMs = endMs + 23 * 60 * 60 * 1000;
              const nowMs = Date.now();
              const msLeft = autoDisburseMs - nowMs;
              const autoDisburseCountdown = msLeft > 0
                ? `${Math.floor(msLeft / 3600000)}h ${Math.floor((msLeft % 3600000) / 60000)}m`
                : "Overdue";
              const flaggedUsers = leaderboards[comp.id]?.filter(e => e.flagged) ?? [];
              const autoDisburseBlocked = flaggedUsers.length > 0;
              return (
                <tr key={comp.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] font-semibold text-foreground">{comp.title}</p>
                    <p className="text-[11px] text-muted-foreground">{comp.season}{comp.tagline ? ` · ${comp.tagline}` : ""}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground">{comp.typeCategory}</span>
                      <p className="text-[11px] font-bold text-foreground">{(comp.typeSubcategories?.length ? comp.typeSubcategories : [comp.typeSubcategory]).slice(0, 3).join(", ")}{(comp.typeSubcategories?.length ?? 0) > 3 ? ` +${comp.typeSubcategories.length - 3}` : ""}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[comp.status]}`}>{statusLabel(comp.status)}</span>
                    {needsDisburse && !disbursedComps.has(comp.id) && (
                      <div className="mt-1">
                        {autoDisburseBlocked
                          ? <p className="text-[9px] text-red-400 font-semibold flex items-center gap-1"><Flag size={8} /> Auto-disburse blocked ({flaggedUsers.length} flagged)</p>
                          : <p className="text-[9px] text-amber-400 font-semibold flex items-center gap-1"><Clock size={8} /> Auto in {autoDisburseCountdown}</p>}
                      </div>
                    )}
                    {disbursedComps.has(comp.id) && <p className="text-[9px] text-emerald-400 font-semibold mt-0.5">✓ Disbursed</p>}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] font-mono font-bold text-foreground">{ngn(comp.prizePool)}</td>
                  <td className="px-5 py-3.5 text-[12px] text-muted-foreground">{fmtN(comp.participants)}</td>
                  <td className="px-5 py-3.5 text-[12px] text-muted-foreground">{new Date(comp.end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setSelectedComp(comp); setBoardSearch(""); setView("detail"); }}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"><Eye size={11} /> View</button>
                      <button onClick={() => openEdit(comp)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"><Pencil size={11} /> Edit</button>
                      <button onClick={() => duplicateComp(comp)}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors" title="Duplicate"><RefreshCw size={11} /></button>
                      <button onClick={() => deleteComp(comp.id)}
                        className="p-1.5 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredComps.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-[13px] text-muted-foreground">No competitions in this filter.</td></tr>
            )}
          </tbody>
        </TableWrap>

        {/* Create/Edit panel */}
        {renderCreatePanel()}
        {renderEditPrizesPanel()}
      </div>
    );
  }

  // ── Detail View ────────────────────────────────────────────────────────────

  const comp = selectedComp!;
  const board = (leaderboards[comp.id] || []).filter(e => !boardSearch || e.user.toLowerCase().includes(boardSearch.toLowerCase()) || e.userId.toLowerCase().includes(boardSearch.toLowerCase()));
  const isFrozen = boardFrozen.has(comp.id);
  const isDisbursed = disbursedComps.has(comp.id);
  const compTiers = competitions.find(c => c.id === comp.id)?.prizeTiers ?? comp.prizeTiers;
  const totalAllocated = compTiers.reduce((a, t) => a + t.prize * Math.max(1, t.rankTo - t.rankFrom + 1), 0);
  const flaggedCount = (leaderboards[comp.id] || []).filter(e => e.flagged).length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-7">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-1.5">
          <ChevronLeft size={13} /> All Competitions
        </button>
        <ChevronRight size={13} className="text-muted-foreground" />
        <span className="text-[13px] font-semibold text-foreground">{comp.title}</span>
      </div>

      {/* Competition header card */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ background: `radial-gradient(ellipse at 80% 50%, ${comp.accentColor}, transparent 60%)` }} />
        <div className="relative flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusColors[comp.status]}`}>{statusLabel(comp.status)}</span>
              <span className="text-[11px] font-semibold bg-secondary px-2 py-0.5 rounded-full border border-border text-muted-foreground">{comp.type}</span>
              <span className="text-[11px] text-muted-foreground">{comp.season}</span>
              {comp.visibility === "hidden" && <span className="flex items-center gap-1 text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5"><EyeOff size={9} /> Hidden</span>}
            </div>
            <h2 className="text-[22px] font-black text-foreground mb-0.5">{comp.title}</h2>
            <p className="text-[13px] text-muted-foreground mb-4">{comp.tagline} · Prize pool: <span className="font-bold text-foreground">{ngn(comp.prizePool)}</span> · {fmtN(comp.participants)} competing</p>

            {(comp.status === "active" || comp.status === "upcoming") && (
              <div className="flex items-center gap-3">
                {[{ v: countdown.d, l: "D" }, { v: countdown.h, l: "H" }, { v: countdown.m, l: "M" }, { v: countdown.s, l: "S" }].map(({ v, l }) => (
                  <div key={l} className="flex flex-col items-center bg-secondary/80 border border-border rounded-xl px-4 py-2 min-w-[48px]">
                    <span className="text-[18px] font-black text-foreground font-mono leading-none">{String(v).padStart(2, "0")}</span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{l}</span>
                  </div>
                ))}
                <span className="text-[11px] text-muted-foreground">{comp.status === "active" ? "remaining" : `starts ${new Date(comp.start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}</span>
              </div>
            )}
          </div>
          <div className="flex flex-row sm:flex-col gap-2 shrink-0 flex-wrap">
            <PurpleBtn onClick={() => openEdit(comp)} size="sm"><Pencil size={12} /> Edit Competition</PurpleBtn>
            <button onClick={() => openEditPrizes(comp)} className="px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"><Pencil size={11} /> Edit Prizes</button>
            {comp.status === "active" && (
              <button onClick={() => setBoardFrozen(s => { const n = new Set(s); isFrozen ? n.delete(comp.id) : n.add(comp.id); return n; })}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors flex items-center gap-1.5 ${isFrozen ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "border-border text-muted-foreground hover:text-foreground"}`}>
                <Lock size={11} /> {isFrozen ? "Board Frozen" : "Freeze Board"}
              </button>
            )}
          </div>
        </div>
      </div>

      {flaggedCount > 0 && (
        <div className="mb-4 p-3.5 bg-red-500/[0.07] border border-red-500/25 rounded-xl flex items-center gap-3">
          <AlertTriangle size={14} className="text-red-400 shrink-0" />
          <p className="text-[12px] text-foreground"><span className="font-bold text-red-400">{flaggedCount} flagged</span> user{flaggedCount > 1 ? "s" : ""} on this leaderboard — review before disbursement.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Leaderboard */}
        <div className="sm:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-bold text-foreground">{comp.title} — Leaderboard</p>
              <p className="text-[11px] text-muted-foreground">{(leaderboards[comp.id] || []).length} ranked participants</p>
            </div>
            <div className="flex items-center gap-2">
              {isFrozen && <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full flex items-center gap-1"><Lock size={9} /> Frozen</span>}
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={boardSearch} onChange={e => setBoardSearch(e.target.value)} placeholder="Search user…"
                  className="bg-secondary border border-border rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 w-40" />
              </div>
              <PurpleBtn size="sm"><Download size={11} /> CSV</PurpleBtn>
            </div>
          </div>
          <div className="divide-y divide-border">
            {board.length === 0 && <p className="py-10 text-center text-[13px] text-muted-foreground">No entries yet.</p>}
            {board.map(entry => {
              const prize = prizeForRank(compTiers, entry.rank);
              return (
                <div key={entry.userId} className={`px-5 py-3 flex items-center gap-4 ${entry.flagged ? "bg-red-500/[0.04]" : entry.rank <= 3 ? "bg-primary/[0.02]" : ""}`}>
                  <div className="w-7 shrink-0 text-center">
                    {entry.rank <= 3
                      ? <Medal size={16} className={medalColor(entry.rank)} />
                      : <span className="text-[12px] font-bold text-muted-foreground">{entry.rank}</span>}
                  </div>
                  <Avatar name={entry.user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-semibold text-foreground">{entry.user}</p>
                      {entry.flagged && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full"><Flag size={8} /> Flagged</span>
                      )}
                    </div>
                    {entry.flagged && entry.flagNote && <p className="text-[10px] text-red-400/70 mt-0.5">{entry.flagNote}</p>}
                    {!entry.flagged && <p className="text-[10px] text-muted-foreground">{entry.metric.toLocaleString()} {entry.metricLabel}</p>}
                  </div>
                  {!entry.flagged && (
                    <div className="flex items-center gap-1">
                      {entry.trend === "up" ? <TrendingUp size={12} className="text-emerald-400" /> : <TrendingDown size={12} className="text-red-400" />}
                    </div>
                  )}
                  {prize
                    ? <span className={`text-[11px] font-bold whitespace-nowrap ${entry.flagged ? "text-muted-foreground line-through" : "text-amber-400"}`}>{ngn(prize)}</span>
                    : <span className="text-[10px] text-muted-foreground">–</span>}
                  <div className="flex items-center gap-1">
                    {entry.flagged
                      ? <button onClick={() => unflagUser(comp.id, entry.userId)} className="text-[10px] text-muted-foreground hover:text-emerald-400 border border-border rounded-lg px-2 py-1 transition-colors">Clear flag</button>
                      : <button onClick={() => { setFlagTarget({ compId: comp.id, userId: entry.userId, user: entry.user }); setFlagNote(""); }}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/30 transition-colors" title="Flag user"><Flag size={11} /></button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Prize distribution */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-[13px] font-bold text-foreground">Prize Distribution</p>
              <p className={`text-[11px] font-semibold ${totalAllocated > comp.prizePool ? "text-red-400" : totalAllocated === comp.prizePool ? "text-emerald-400" : "text-amber-400"}`}>{ngn(totalAllocated)} / {ngn(comp.prizePool)} allocated</p>
            </div>
            <div className="p-4 space-y-2">
              {compTiers.map((tier, i) => {
                const total = tier.prize * Math.max(1, tier.rankTo - tier.rankFrom + 1);
                return (
                  <div key={i} className={`rounded-xl p-3 border ${i === 0 ? "bg-amber-500/8 border-amber-500/20" : i === 1 ? "bg-zinc-500/8 border-zinc-500/20" : i === 2 ? "bg-amber-700/8 border-amber-700/20" : "bg-secondary/50 border-border"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${i === 0 ? "text-amber-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>{tier.label}</p>
                        <p className={`text-[14px] font-black ${i < 3 ? [, "text-amber-400", "text-zinc-300", "text-amber-600"][i + 1] : "text-foreground"}`}>{ngn(tier.prize)}{tier.rankTo > tier.rankFrom ? " ea" : ""}</p>
                      </div>
                      {tier.rankTo > tier.rankFrom && <p className="text-[9px] text-muted-foreground text-right">Total:<br /><span className="font-bold text-foreground text-[11px]">{ngn(total)}</span></p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disbursement panel (ended only) */}
          {comp.status === "ended" && (
            <div className={`bg-card border rounded-2xl overflow-hidden ${isDisbursed ? "border-emerald-500/30" : "border-amber-500/30"}`}>
              <div className="px-5 py-4 border-b border-border">
                <p className="text-[13px] font-bold text-foreground">Prize Disbursement</p>
                {isDisbursed
                  ? <p className="text-[11px] text-emerald-400 font-semibold">All prizes credited ✓</p>
                  : <p className="text-[11px] text-amber-400 font-semibold">Pending your approval</p>}
              </div>
              {!isDisbursed && (
                <div className="p-4">
                  <div className="space-y-1.5 mb-4">
                    {(leaderboards[comp.id] || []).map(entry => {
                      const prize = prizeForRank(compTiers, entry.rank);
                      if (!prize) return null;
                      return (
                        <div key={entry.userId} className={`flex items-center justify-between text-[11px] py-1.5 px-2 rounded-lg ${entry.flagged ? "bg-red-500/[0.05] border border-red-500/15" : ""}`}>
                          <span className={`font-medium ${entry.flagged ? "text-red-400" : "text-foreground"}`}>
                            {entry.rank}. {entry.user} {entry.flagged && "⚠"}
                          </span>
                          <span className={`font-bold font-mono ${entry.flagged ? "text-muted-foreground line-through" : "text-amber-400"}`}>{ngn(prize)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-4 px-2">
                    <span>Total outgoing</span>
                    <span className="font-bold text-foreground font-mono">{ngn(totalAllocated)}</span>
                  </div>
                  {flaggedCount > 0 && (
                    <div className="mb-3 p-2.5 bg-red-500/[0.07] border border-red-500/20 rounded-xl text-[10px] text-red-400">
                      {flaggedCount} flagged user{flaggedCount > 1 ? "s" : ""} will be skipped — clear flags first if eligible.
                    </div>
                  )}
                  <button onClick={() => setShowDisburseConfirm(comp.id)}
                    className="w-full py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 text-white transition-all"
                    style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}>
                    <Send size={13} /> Approve &amp; Disburse
                  </button>
                </div>
              )}
              {isDisbursed && (
                <div className="p-4 space-y-1.5">
                  {(leaderboards[comp.id] || []).filter(e => prizeForRank(compTiers, e.rank)).map(entry => (
                    <div key={entry.userId} className="flex items-center justify-between text-[11px] py-1">
                      <span className="text-foreground">{entry.rank}. {entry.user}</span>
                      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold"><CheckCircle2 size={11} /> Credited</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Flag user panel */}
      <SlidePanel open={!!flagTarget} onClose={() => setFlagTarget(null)} title="Flag User" subtitle="Flagged users stay on the board but are excluded from prizes pending review"
        footer={<div className="flex gap-3">
          <button onClick={submitFlag} disabled={!flagNote.trim()} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-40 transition-all" style={{ background: "linear-gradient(135deg, #EF4444, #B91C1C)" }}>Flag User</button>
          <button onClick={() => setFlagTarget(null)} className="flex-1 border border-border text-muted-foreground text-[13px] rounded-xl hover:text-foreground transition-colors">Cancel</button>
        </div>}>
        {flagTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-4">
              <Avatar name={flagTarget.user} />
              <div>
                <p className="text-[13px] font-bold text-foreground">{flagTarget.user}</p>
                <p className="text-[11px] text-muted-foreground">User ID: {flagTarget.userId}</p>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Reason for flagging <span className="text-red-400">*</span></label>
              <textarea value={flagNote} onChange={e => setFlagNote(e.target.value)} rows={3}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
                placeholder="e.g. Unusual spike — 5 transactions over ₦10K in 1 hour" />
            </div>
            <div className="p-3 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl text-[11px] text-muted-foreground space-y-1.5">
              <p className="font-semibold text-amber-400">What flagging does:</p>
              <p>· User stays visible on the leaderboard</p>
              <p>· Prize is blocked until flag is cleared</p>
              <p>· A case is logged permanently in Audits</p>
              <p>· Flag can be cleared at any time</p>
            </div>
          </div>
        )}
      </SlidePanel>

      {/* Disburse confirm modal */}
      {showDisburseConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center"><Send size={18} className="text-primary" /></div>
              <div>
                <p className="text-[14px] font-bold text-foreground">Confirm Disbursement</p>
                <p className="text-[11px] text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground mb-1">You are about to credit prizes to all eligible winners of:</p>
            <p className="text-[14px] font-bold text-foreground mb-4">{comp.title} — {comp.season}</p>
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-border mb-5">
              <span className="text-[12px] text-muted-foreground">Total leaving prize reserve</span>
              <span className="text-[14px] font-black text-foreground font-mono">{ngn(totalAllocated)}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setDisbursedComps(s => new Set([...s, comp.id])); setShowDisburseConfirm(null); }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}>
                <Send size={13} /> Disburse Now
              </button>
              <button onClick={() => setShowDisburseConfirm(null)} className="flex-1 border border-border text-muted-foreground text-[13px] rounded-xl hover:text-foreground transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {renderCreatePanel()}
      {renderEditPrizesPanel()}

      {/* Top-Up Reserve Panel */}
      <SlidePanel open={showTopUp} onClose={() => setShowTopUp(false)} title="Top Up Prize Reserve"
        subtitle="Transfer funds into the prize reserve wallet"
        footer={
          <div className="flex gap-3">
            <PurpleBtn onClick={() => {
              const amt = parseInt(topUpAmount.replace(/,/g, "")) || 0;
              if (!amt) return;
              setReserveBalance(b => b + amt);
              setTopUpHistory(h => [{ date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), amount: amt, note: topUpNote || "Manual top-up" }, ...h]);
              setTopUpAmount(""); setTopUpNote(""); setShowTopUp(false);
            }}><Plus size={13} /> Confirm Top Up</PurpleBtn>
            <button onClick={() => setShowTopUp(false)} className="flex-1 border border-border text-muted-foreground text-[13px] rounded-xl hover:text-foreground transition-colors">Cancel</button>
          </div>
        }>
        <div className="space-y-5">
          {/* Current balance */}
          <div className={`p-4 rounded-xl border ${reserveOk ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">Current Reserve Balance</p>
                <p className="text-[22px] font-black text-foreground">{ngn(reserveBalance)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground">Projected Spend</p>
                <p className="text-[16px] font-bold text-foreground">{ngn(projectedSpend)}</p>
                <p className={`text-[10px] font-semibold mt-0.5 ${reserveOk ? "text-emerald-400" : "text-red-400"}`}>
                  {reserveOk ? `${Math.round((reserveBalance / projectedSpend) * 100)}% coverage` : "⚠ Below 110% threshold"}
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Amount to Add (₦)</label>
            <input value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} type="number"
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              placeholder="e.g. 1000000" />
            {topUpAmount && <p className="text-[11px] text-primary mt-1">New balance: {ngn(reserveBalance + (parseInt(topUpAmount) || 0))}</p>}
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Note (Finance reference)</label>
            <input value={topUpNote} onChange={e => setTopUpNote(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              placeholder="e.g. Q3 prize fund allocation" />
          </div>
          {/* Top-up history */}
          {topUpHistory.length > 0 && (
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold block mb-2">Top-up History</label>
              <div className="space-y-1.5">
                {topUpHistory.map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">{ngn(h.amount)}</p>
                      <p className="text-[10px] text-muted-foreground">{h.note}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{h.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SlidePanel>
    </div>
  );

  // ── Shared sub-panels (rendered in both views) ─────────────────────────────

  function renderCreatePanel() {
    const tierTotal = compForm.prizeTiers.reduce((a, t) => a + t.prize * Math.max(1, t.rankTo - t.rankFrom + 1), 0);
    const pool = parseInt(compForm.prizePool) || 0;
    return (
      <SlidePanel open={showCreatePanel} onClose={() => setShowCreatePanel(false)}
        title={editTarget ? `Edit: ${editTarget.title}` : "New Competition"}
        subtitle={editTarget ? "Changes to live competitions are audited" : "Fill in competition details"}
        footer={<div className="flex gap-3">
          <PurpleBtn onClick={saveComp}>{editTarget ? "Save Changes" : "Create Competition"}</PurpleBtn>
          <button onClick={() => setShowCreatePanel(false)} className="flex-1 border border-border text-muted-foreground text-[13px] rounded-xl hover:text-foreground transition-colors">Cancel</button>
        </div>}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Title <span className="text-red-400">*</span></label>
              <input value={compForm.title} onChange={e => setCompForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" placeholder="e.g. Crypto Rain" />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] text-muted-foreground font-semibold block">Competition Type</label>
              {/* Category selector */}
              <div className="flex flex-wrap gap-1.5">
                {COMP_TYPES.map(t => (
                  <button key={t} type="button"
                    onClick={() => setCompForm(f => ({ ...f, typeCategory: t, typeSubcategories: [COMP_CATEGORIES[t][0]], typeSubcategory: COMP_CATEGORIES[t][0] }))}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${compForm.typeCategory === t ? "bg-primary/15 text-primary border-primary/40" : "border-border text-muted-foreground hover:text-foreground hover:border-white/20"}`}>
                    {t}
                  </button>
                ))}
              </div>
              {/* Subcategory multi-select pills / custom description */}
              <div>
                {compForm.typeCategory === "Custom" ? (
                  <div>
                    <label className="text-[10px] text-muted-foreground font-semibold block mb-1.5">Describe this competition type</label>
                    <input
                      value={compForm.customTypeDescription}
                      onChange={e => setCompForm(f => ({ ...f, customTypeDescription: e.target.value, typeSubcategories: [e.target.value || "Custom"], typeSubcategory: e.target.value || "Custom" }))}
                      placeholder="e.g. First 100 users to complete profile verification"
                      className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] text-muted-foreground mb-1.5 font-semibold">
                      {compForm.typeCategory === "Cross-border" ? "Destination Countries" : "Select Assets / Subcategories"}
                      {compForm.typeSubcategories.length > 0 && <span className="ml-1.5 text-primary">{compForm.typeSubcategories.length} selected</span>}
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {(COMP_CATEGORIES[compForm.typeCategory] || []).map(s => {
                        const isAll = s.startsWith("All") || s.startsWith("Any");
                        const sel = compForm.typeSubcategories.includes(s);
                        return (
                          <button key={s} type="button"
                            onClick={() => {
                              if (isAll) {
                                setCompForm(f => ({ ...f, typeSubcategories: [s], typeSubcategory: s }));
                              } else {
                                setCompForm(f => {
                                  const without = f.typeSubcategories.filter(x => !x.startsWith("All") && !x.startsWith("Any"));
                                  const next = sel ? without.filter(x => x !== s) : [...without, s];
                                  const final = next.length === 0 ? [COMP_CATEGORIES[f.typeCategory][0]] : next;
                                  return { ...f, typeSubcategories: final, typeSubcategory: final[0] };
                                });
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${sel ? "bg-primary/15 text-primary border-primary/40" : "border-border text-muted-foreground hover:text-foreground hover:border-white/15"}`}>
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Tagline</label>
            <input value={compForm.tagline} onChange={e => setCompForm(f => ({ ...f, tagline: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" placeholder="1-sentence shown on the card in-app" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Season Label</label>
              <input value={compForm.season} onChange={e => setCompForm(f => ({ ...f, season: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" placeholder="e.g. Season 2" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Status</label>
              <select value={compForm.status} onChange={e => setCompForm(f => ({ ...f, status: e.target.value as Competition["status"] }))}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-primary/50">
                <option value="draft">Draft</option>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active (Live)</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateInput label="Start Date" value={compForm.start} onChange={v => setCompForm(f => ({ ...f, start: v }))} />
            <DateInput label="End Date" value={compForm.end} min={compForm.start || undefined} onChange={v => setCompForm(f => ({ ...f, end: v }))} />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Prize Pool (₦)</label>
            <input type="number" value={compForm.prizePool} onChange={e => setCompForm(f => ({ ...f, prizePool: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" placeholder="e.g. 1000000" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Min Qualifying Amount (₦)</label>
              <input type="number" value={compForm.minQualifyingAmt} onChange={e => setCompForm(f => ({ ...f, minQualifyingAmt: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" placeholder="e.g. 500" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Entry Condition</label>
              <select value={compForm.entryCondition} onChange={e => setCompForm(f => ({ ...f, entryCondition: e.target.value as "auto" | "manual" }))}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-primary/50">
                <option value="auto">Auto-enter on first qualifying activity</option>
                <option value="manual">Manual opt-in</option>
              </select>
            </div>
          </div>
          {compForm.type === "Referrals" && (
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Referral Bonus per Person (₦)</label>
              <input type="number" value={compForm.referralBonus} onChange={e => setCompForm(f => ({ ...f, referralBonus: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" placeholder="e.g. 500" />
            </div>
          )}
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Visibility</label>
            <div className="flex gap-2">
              {(["public", "hidden"] as const).map(v => (
                <button key={v} type="button" onClick={() => setCompForm(f => ({ ...f, visibility: v }))}
                  className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border transition-all flex items-center justify-center gap-1.5 ${compForm.visibility === v ? "bg-primary/15 text-primary border-primary/40" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {v === "public" ? <><Eye size={12} /> Public</> : <><EyeOff size={12} /> Hidden (dry run)</>}
                </button>
              ))}
            </div>
          </div>

          {/* Prize tiers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] text-muted-foreground font-semibold">Prize Structure</label>
              <span className={`text-[10px] font-semibold ${tierTotal > pool && pool > 0 ? "text-red-400" : "text-muted-foreground"}`}>{ngn(tierTotal)} allocated {pool > 0 ? `/ ${ngn(pool)}` : ""}</span>
            </div>
            <div className="space-y-2">
              {compForm.prizeTiers.map((tier, i) => (
                <div key={i} className="bg-secondary/50 border border-border rounded-xl p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                    <div className="col-span-2">
                      <label className="text-[9px] text-muted-foreground font-semibold block mb-1">Label</label>
                      <input value={tier.label} onChange={e => setCompForm(f => ({ ...f, prizeTiers: f.prizeTiers.map((t, j) => j === i ? { ...t, label: e.target.value } : t) }))}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[12px] text-foreground focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground font-semibold block mb-1">From</label>
                      <input type="number" value={tier.rankFrom} onChange={e => setCompForm(f => ({ ...f, prizeTiers: f.prizeTiers.map((t, j) => j === i ? { ...t, rankFrom: parseInt(e.target.value) || 1 } : t) }))}
                        className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-[12px] text-foreground text-center focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground font-semibold block mb-1">To</label>
                      <input type="number" value={tier.rankTo} onChange={e => setCompForm(f => ({ ...f, prizeTiers: f.prizeTiers.map((t, j) => j === i ? { ...t, rankTo: parseInt(e.target.value) || 1 } : t) }))}
                        className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-[12px] text-foreground text-center focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="flex items-end gap-1">
                      <div className="flex-1">
                        <label className="text-[9px] text-muted-foreground font-semibold block mb-1">Prize (₦)</label>
                        <input type="number" value={tier.prize} onChange={e => setCompForm(f => ({ ...f, prizeTiers: f.prizeTiers.map((t, j) => j === i ? { ...t, prize: parseInt(e.target.value) || 0 } : t) }))}
                          className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-[12px] text-foreground focus:outline-none focus:border-primary/50" />
                      </div>
                      <button onClick={() => setCompForm(f => ({ ...f, prizeTiers: f.prizeTiers.filter((_, j) => j !== i) }))} className="p-1.5 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 transition-colors mb-0.5"><Trash2 size={11} /></button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setCompForm(f => ({ ...f, prizeTiers: [...f.prizeTiers, { rankFrom: (f.prizeTiers[f.prizeTiers.length - 1]?.rankTo ?? 0) + 1, rankTo: (f.prizeTiers[f.prizeTiers.length - 1]?.rankTo ?? 0) + 1, label: `${f.prizeTiers.length + 1}th place`, prize: 10_000 }] }))}
                className="w-full py-2.5 rounded-xl border border-dashed border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center justify-center gap-1.5">
                <Plus size={12} /> Add Prize Tier
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Internal Notes</label>
            <textarea value={compForm.notes} onChange={e => setCompForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
              placeholder="Not shown to users" />
          </div>
        </div>
      </SlidePanel>
    );
  }

  function renderEditPrizesPanel() {
    const tDraft = tiersDraft;
    const editComp = editPrizesFor ? (competitions.find(c => c.id === editPrizesFor) ?? null) : null;
    const allocated = tDraft.reduce((a, t) => a + t.prize * Math.max(1, t.rankTo - t.rankFrom + 1), 0);
    const pool = editComp?.prizePool ?? 0;
    return (
      <SlidePanel open={!!editPrizesFor} onClose={() => setEditPrizesFor(null)} title={`Prize Tiers — ${editComp?.title ?? ""}`} subtitle="Set prize per rank range"
        footer={<div className="flex gap-3">
          <PurpleBtn onClick={savePrizes}>Save Prize Tiers</PurpleBtn>
          <button onClick={() => setEditPrizesFor(null)} className="flex-1 border border-border text-muted-foreground text-[13px] rounded-xl hover:text-foreground transition-colors">Cancel</button>
        </div>}>
        <div className="space-y-3">
          {tDraft.map((tier, i) => (
            <div key={i} className="bg-secondary/50 border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <input value={tier.label} onChange={e => setTiersDraft(d => d.map((t, j) => j === i ? { ...t, label: e.target.value } : t))}
                  className="bg-transparent text-[12px] font-bold text-foreground focus:outline-none border-b border-transparent focus:border-primary/40 w-32" />
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  Ranks
                  <input type="number" value={tier.rankFrom} onChange={e => setTiersDraft(d => d.map((t, j) => j === i ? { ...t, rankFrom: parseInt(e.target.value) || 1 } : t))}
                    className="w-12 bg-background border border-border rounded px-1.5 py-1 text-[11px] text-center focus:outline-none" />
                  <span>–</span>
                  <input type="number" value={tier.rankTo} onChange={e => setTiersDraft(d => d.map((t, j) => j === i ? { ...t, rankTo: parseInt(e.target.value) || 1 } : t))}
                    className="w-12 bg-background border border-border rounded px-1.5 py-1 text-[11px] text-center focus:outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground font-semibold block mb-1">Prize per winner (₦)</label>
                  <input type="number" value={tier.prize} onChange={e => setTiersDraft(d => d.map((t, j) => j === i ? { ...t, prize: parseInt(e.target.value) || 0 } : t))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-primary/50" />
                </div>
                <button onClick={() => setTiersDraft(d => d.filter((_, j) => j !== i))} className="mt-5 p-2 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Total: <span className="font-bold text-foreground">{ngn(tier.prize * Math.max(1, tier.rankTo - tier.rankFrom + 1))}</span></p>
            </div>
          ))}
          <button onClick={() => setTiersDraft(d => [...d, { rankFrom: (d[d.length - 1]?.rankTo ?? 0) + 1, rankTo: (d[d.length - 1]?.rankTo ?? 0) + 1, label: `${d.length + 1}th place`, prize: 10_000 }])}
            className="w-full py-3 rounded-xl border border-dashed border-border text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center justify-center gap-2">
            <Plus size={13} /> Add Prize Tier
          </button>
          <div className={`flex items-center justify-between p-3 rounded-xl border ${allocated > pool ? "bg-red-500/8 border-red-500/20" : "bg-secondary/50 border-border"}`}>
            <p className="text-[12px] text-muted-foreground">Total allocated</p>
            <p className={`text-[13px] font-bold ${allocated > pool ? "text-red-400" : "text-foreground"}`}>{ngn(allocated)} / {ngn(pool)}</p>
          </div>
        </div>
      </SlidePanel>
    );
  }
}