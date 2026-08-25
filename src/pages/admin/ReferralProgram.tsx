import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Download,
  Users,
  Share2,
  TrendingUp,
  DollarSign,
  Zap,
  Search,
  ChevronRight,
  GitMerge,
  Save,
  CheckCircle2,
  Loader2,
  Edit2,
  Trash2,
  Plus,
} from "lucide-react";
import { referralAPI, ReferralBonus, ReferralDetailRecord } from "@/lib/api";
import ReferralDownline from "./ReferralDownline";

type Page =
  | "dashboard"
  | "analytics"
  | "users"
  | "transactions"
  | "promo-codes"
  | "ledger"
  | "audits"
  | "fee"
  | "referral"
  | "referral-overview"
  | "referral-details"
  | "referral-explorer"
  | "competitions"
  | "segments"
  | "campaigns"
  | "withdrawals"
  | "admin-roles";

function fmtN(num: number) {
  return new Intl.NumberFormat().format(num || 0);
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
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95 ${
        size === "sm" ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-[12px]"
      } ${className}`}
      style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
    >
      {children}
    </button>
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

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.025] border border-border rounded-xl overflow-x-auto w-full mb-4">
      <table className="w-full text-left border-collapse">{children}</table>
    </div>
  );
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-border bg-white/[0.02]">
        {cols.map((c, i) => (
          <th key={i} className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Pagination({ page, total, perPage, onChange }: { page: number; total: number; perPage: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-[12px] text-muted-foreground">
      <span>Showing {Math.min((page - 1) * perPage + 1, total)} - {Math.min(page * perPage, total)} of {total}</span>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-white/5 transition-colors">Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-white/5 transition-colors">Next</button>
      </div>
    </div>
  );
}

// ─── Viral Loop Step Config Types & Helpers ─────────────────────────────────────

type ViralTriggerType =
  | "invite_sent"
  | "registration"
  | "kyc"
  | "first_txn"
  | "single_txn"
  | "cumulative_volume"
  | "txn_count";

const REFERRAL_TXN_TYPES = [
  "Fiat Deposit",
  "Crypto Deposit",
  "Cross-border Receive",
  "Cross-border Send",
  "Bank Withdrawal",
  "Crypto Withdrawal",
  "Internal Transfer",
  "Bill Payment",
  "Crypto Swap",
  "Airtime / Data",
] as const;

interface ViralStep {
  id: string;
  step: number;
  trigger: string;
  desc: string;
  triggerType: ViralTriggerType;
  kycTier: "1" | "2" | "3";
  txnTypes: string[];
  threshold: string;
  thresholdCurrency: string;
  operator: "gte" | "lte";
  rewardTiming: "instant" | "t+1d" | "t+7d";
  referrerReward: string;
  referredReward: string;
  enabled: boolean;
  color: string;
}

function buildConditionSummary(s: Pick<ViralStep, "triggerType" | "kycTier" | "txnTypes" | "threshold" | "thresholdCurrency" | "operator">): string {
  const op = s.operator === "gte" ? "≥" : "≤";
  const txnLabel = s.txnTypes.length === 0 ? "any transaction" : s.txnTypes.join(" or ");
  switch (s.triggerType) {
    case "invite_sent":       return "Per invite link shared";
    case "registration":      return "On account creation";
    case "kyc":               return `On KYC Tier ${s.kycTier ?? "1"} approval`;
    case "first_txn":         return `First ${txnLabel}`;
    case "single_txn":        return `Single ${txnLabel} ${op} ${s.thresholdCurrency} ${s.threshold}`;
    case "cumulative_volume": return `Cumulative ${txnLabel} ${op} ${s.thresholdCurrency} ${s.threshold}`;
    case "txn_count":         return `${s.txnTypes.length > 0 ? txnLabel : "Transactions"} count ${op} ${s.threshold}`;
    default: return "";
  }
}

const mkViralStep = (
  id: string, step: number, trigger: string, desc: string,
  triggerType: ViralTriggerType, txnTypes: string[], threshold: string, thresholdCurrency: string,
  referrerReward: string, referredReward: string, color: string,
  operator: ViralStep["operator"] = "gte", rewardTiming: ViralStep["rewardTiming"] = "instant",
  kycTier: ViralStep["kycTier"] = "1"
): ViralStep => ({
  id, step, trigger, desc, triggerType, kycTier, txnTypes, threshold, thresholdCurrency,
  operator, rewardTiming, referrerReward, referredReward, enabled: true, color,
});

const DEFAULT_VIRAL_STEPS: ViralStep[] = [
  mkViralStep("v1", 1,
    "Invite Sent",
    "Referrer shares their link via email, WhatsApp, or copy-paste",
    "invite_sent", [], "", "—",
    "0.50", "0", "#7B3FE4", "gte", "instant"
  ),
  mkViralStep("v2", 2,
    "Invitee Registers",
    "Referred user creates a Ravasend account using the referral link",
    "registration", [], "", "—",
    "5.00", "0.50", "#6366F1", "gte", "instant"
  ),
  mkViralStep("v3", 3,
    "Wallet Created (KYC Tier 1)",
    "Invitee passes BVN/NIN check and their wallet is activated",
    "kyc", [], "", "—",
    "10.00", "0", "#3B82F6", "gte", "instant", "1"
  ),
  mkViralStep("v4", 4,
    "Cumulative Receive ≥ $100",
    "Invitee's total inbound volume (Fiat Deposit + Cross-border Receive) reaches $100 equivalent",
    "cumulative_volume", ["Fiat Deposit", "Cross-border Receive"], "100", "USD",
    "1000.00", "100.00", "#10B981", "gte", "instant"
  ),
  mkViralStep("v5", 5,
    "First Bill Payment ≥ ₦500",
    "Invitee pays any bill (Airtime, Data, Electricity, TV, etc.) of ₦500 or more",
    "single_txn", ["Bill Payment", "Airtime / Data"], "500", "NGN",
    "1.50", "0", "#F59E0B", "gte", "instant"
  ),
  mkViralStep("v6", 6,
    "Cumulative Receive ≥ $500",
    "Invitee's total inbound reaches $500 equivalent",
    "cumulative_volume", ["Fiat Deposit", "Cross-border Receive"], "500", "USD",
    "3500.00", "900.00", "#EF4444", "gte", "t+1d"
  ),
  mkViralStep("v7", 7,
    "Cumulative Receive ≥ $1,000",
    "Invitee's total inbound reaches $1,000 equivalent",
    "cumulative_volume", ["Fiat Deposit", "Cross-border Receive"], "1000", "USD",
    "5500.00", "0", "#EC4899", "gte", "t+7d"
  ),
];

const TRIGGER_TYPE_META: Record<ViralTriggerType, { label: string; desc: string; needsTxnTypes: boolean; needsThreshold: boolean; thresholdLabel: string }> = {
  invite_sent:       { label: "Invite Sent",          desc: "Fires when the referrer shares their link. No transaction required.", needsTxnTypes: false, needsThreshold: false, thresholdLabel: "" },
  registration:      { label: "Account Registration", desc: "Fires when the invitee creates a Ravasend account via the referral link.", needsTxnTypes: false, needsThreshold: false, thresholdLabel: "" },
  kyc:               { label: "KYC Tier Passed",       desc: "Fires when invitee reaches the selected KYC tier. Each tier fires at most once per user. Tier 2 implies Tier 1 already passed; Tier 3 implies Tier 2.", needsTxnTypes: false, needsThreshold: false, thresholdLabel: "" },
  first_txn:         { label: "First Transaction",    desc: "Fires on the very first transaction of the selected type(s). Fires once per user.", needsTxnTypes: true, needsThreshold: false, thresholdLabel: "" },
  single_txn:        { label: "Single Transaction ≥ threshold", desc: "Fires whenever a single transaction of the selected type meets the amount threshold. Can fire multiple times.", needsTxnTypes: true, needsThreshold: true, thresholdLabel: "Min Amount" },
  cumulative_volume: { label: "Cumulative Volume ≥ threshold", desc: "Fires once when the running total of selected transaction types crosses the threshold. Uses USD equivalent for multi-currency.", needsTxnTypes: true, needsThreshold: true, thresholdLabel: "Total Volume" },
  txn_count:         { label: "Transaction Count ≥ N", desc: "Fires once when the invitee completes N transactions of the selected type(s).", needsTxnTypes: true, needsThreshold: true, thresholdLabel: "Count (N)" },
};

const STEP_COLORS_LIST = [
  "#7B3FE4","#6366F1","#3B82F6","#10B981","#F59E0B","#EF4444","#EC4899","#8B5CF6","#06B6D4",
];

function ViralLoopEditor({ detailsData }: { detailsData?: ReferralDetailRecord[] }) {
  const [steps, setSteps] = useState<ViralStep[]>(DEFAULT_VIRAL_STEPS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<ViralStep>>({});
  const [saving, setSaving] = useState(false);

  const totalMaxReferrer = steps.filter((s) => s.enabled).reduce((a, s) => a + parseFloat(s.referrerReward || "0"), 0);
  const totalMaxReferred = steps.filter((s) => s.enabled).reduce((a, s) => a + parseFloat(s.referredReward || "0"), 0);

  // Compute values from getAllReferralDetails endpoint response if available
  const apiReferrerEarnings = detailsData
    ?.filter((d) => d.type === "referral" || d.type === "invite_reward" || Boolean(d.referredBy))
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const apiReferredBonus = detailsData
    ?.filter((d) => d.type === "welcome_bonus")
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const displayMaxReferrer =
    apiReferrerEarnings !== undefined && apiReferrerEarnings > 0
      ? apiReferrerEarnings
      : totalMaxReferrer;

  const displayMaxReferred =
    apiReferredBonus !== undefined && apiReferredBonus > 0
      ? apiReferredBonus
      : totalMaxReferred;

  const startEdit = (s: ViralStep) => {
    setEditingId(s.id);
    setDraft({ ...s });
  };
  const cancelEdit = () => { setEditingId(null); setDraft({}); };
  const saveEdit = (id: string) => {
    setSaving(true);
    // auto-generate condition summary from structured fields before saving
    const conditionSummary = buildConditionSummary({
      triggerType: (draft.triggerType ?? "registration"),
      kycTier: draft.kycTier ?? "1",
      txnTypes: draft.txnTypes ?? [],
      threshold: draft.threshold ?? "",
      thresholdCurrency: draft.thresholdCurrency ?? "USD",
      operator: draft.operator ?? "gte",
    });
    setTimeout(() => {
      setSteps((ss) => ss.map((s) => (s.id === id ? { ...s, ...draft, desc: draft.desc || conditionSummary } : s)));
      setEditingId(null);
      setSaving(false);
    }, 400);
  };
  const toggleStep = (id: string) => setSteps((ss) => ss.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  const deleteStep = (id: string) => { setSteps((ss) => ss.filter((s) => s.id !== id).map((s, i) => ({ ...s, step: i + 1 }))); if (editingId === id) cancelEdit(); };
  const addStep = () => {
    const newStep: ViralStep = mkViralStep(`v${Date.now()}`, steps.length + 1, "New Milestone", "Describe the invitee action", "registration", [], "", "USD", "0", "0", STEP_COLORS_LIST[steps.length % STEP_COLORS_LIST.length]);
    setSteps((ss) => [...ss, newStep]);
    setEditingId(newStep.id);
    setDraft({ ...newStep });
  };

  const toggleDraftTxn = (t: string) => setDraft((d) => ({ ...d, txnTypes: (d.txnTypes ?? []).includes(t) ? (d.txnTypes ?? []).filter((x) => x !== t) : [...(d.txnTypes ?? []), t] }));

  const liveCondition = draft.triggerType ? buildConditionSummary({
    triggerType: draft.triggerType,
    kycTier: draft.kycTier ?? "1",
    txnTypes: draft.txnTypes ?? [],
    threshold: draft.threshold ?? "",
    thresholdCurrency: draft.thresholdCurrency ?? "USD",
    operator: draft.operator ?? "gte",
  }) : "";

  return (
    <div>
      {/* Max payout banner */}
      <div className="flex items-center gap-4 mb-5 p-3.5 bg-primary/8 border border-primary/20 rounded-xl">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">Max referrer earnings (all active steps)</p>
          <p className="text-[22px] font-bold text-foreground font-mono">₦{fmtN(Math.round(displayMaxReferrer))}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">Max referred user bonus</p>
          <p className="text-[18px] font-bold text-foreground font-mono">₦{fmtN(Math.round(displayMaxReferred))}</p>
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((s, i) => {
          const condSummary = buildConditionSummary(s);
          return (
            <div key={s.id} className={`border rounded-xl overflow-hidden transition-all ${s.enabled ? "border-border bg-white/[0.02]" : "border-border/30 bg-white/[0.005] opacity-40"}`}>

              {/* ── Collapsed row ── */}
              {editingId !== s.id && (
                <div className="flex items-start gap-3 p-3.5">
                  <div className="size-7 rounded-lg flex items-center justify-center text-[11px] font-black text-white shrink-0 mt-0.5"
                    style={{ background: s.enabled ? `linear-gradient(135deg, ${s.color}cc, ${s.color})` : "#3f3f46" }}>
                    {s.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-[12px] font-bold text-foreground">{s.trigger}</p>
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">{condSummary}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">{s.desc}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {parseFloat(s.referrerReward) > 0 && <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">+₦{parseFloat(s.referrerReward) >= 1000 ? fmtN(parseFloat(s.referrerReward)) : s.referrerReward} referrer</span>}
                      {parseFloat(s.referredReward) > 0 && <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">+₦{parseFloat(s.referredReward) >= 1000 ? fmtN(parseFloat(s.referredReward)) : s.referredReward} referred</span>}
                      {parseFloat(s.referrerReward) === 0 && parseFloat(s.referredReward) === 0 && <span className="text-[10px] text-zinc-500">No reward</span>}
                      <span className={`text-[9px] font-semibold ml-auto px-1.5 py-0.5 rounded border ${s.rewardTiming === "instant" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{s.rewardTiming === "instant" ? "Instant" : s.rewardTiming === "t+1d" ? "T+1 day" : "T+7 days"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"><Edit2 size={10} /></button>
                    <button onClick={() => toggleStep(s.id)} className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${s.enabled ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border-zinc-700"}`}>{s.enabled ? "ON" : "OFF"}</button>
                    {steps.length > 1 && <button onClick={() => deleteStep(s.id)} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/20 transition-all"><Trash2 size={10} /></button>}
                  </div>
                </div>
              )}

              {/* ── Expanded edit form ── */}
              {editingId === s.id && (
                <div className="p-4 space-y-4 border-l-2" style={{ borderLeftColor: draft.color ?? s.color }}>
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0"
                      style={{ background: `linear-gradient(135deg, ${draft.color ?? s.color}cc, ${draft.color ?? s.color})` }}>
                      {s.step}
                    </div>
                    <p className="text-[11px] font-bold text-foreground">Step {s.step} — Edit</p>
                    <div className="ml-auto flex items-center gap-1.5">
                      <button onClick={() => saveEdit(s.id)} disabled={saving} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white disabled:opacity-50" style={{ background: "linear-gradient(135deg,#7B3FE4,#5B2AB8)" }}>{saving ? "Saving…" : "Save"}</button>
                      <button onClick={cancelEdit} className="px-2.5 py-1.5 rounded-lg text-[10px] text-muted-foreground border border-border hover:text-foreground transition-colors">Cancel</button>
                    </div>
                  </div>

                  {/* Display label */}
                  <div>
                    <label className="text-[10px] text-muted-foreground font-semibold block mb-1">Display Label <span className="font-normal opacity-60">(shown to users)</span></label>
                    <input autoFocus value={draft.trigger ?? ""} onChange={(e) => setDraft((d) => ({ ...d, trigger: e.target.value }))}
                      placeholder="e.g. Cumulative Receive ≥ $100"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary/50" />
                  </div>

                  {/* ── TRIGGER TYPE ── key system field */}
                  <div className="bg-secondary/40 border border-border rounded-xl p-3.5 space-y-3">
                    <p className="text-[10px] font-black text-foreground uppercase tracking-wider">Trigger Type <span className="font-normal normal-case text-muted-foreground">— how the engine detects completion</span></p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.keys(TRIGGER_TYPE_META) as ViralTriggerType[]).map((tt) => (
                        <button key={tt} onClick={() => setDraft((d) => ({ ...d, triggerType: tt, txnTypes: [], threshold: "", thresholdCurrency: "USD", kycTier: "1" }))}
                          className={`px-2.5 py-2 rounded-lg text-left transition-all border ${draft.triggerType === tt ? "border-primary/40 bg-primary/10" : "border-border hover:border-white/15"}`}>
                          <p className={`text-[10px] font-bold ${draft.triggerType === tt ? "text-primary" : "text-foreground"}`}>{TRIGGER_TYPE_META[tt].label}</p>
                        </button>
                      ))}
                    </div>
                    {draft.triggerType && (
                      <p className="text-[10px] text-muted-foreground bg-background/50 rounded-lg px-3 py-2">{TRIGGER_TYPE_META[draft.triggerType].desc}</p>
                    )}

                    {/* Transaction types (only for txn-based triggers) */}
                    {draft.triggerType && TRIGGER_TYPE_META[draft.triggerType].needsTxnTypes && (
                      <div>
                        <label className="text-[10px] text-muted-foreground font-semibold block mb-1.5">
                          Which Transaction Types Count? <span className="font-normal">(empty = all)</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {REFERRAL_TXN_TYPES.map((t) => {
                            const sel = (draft.txnTypes ?? []).includes(t);
                            return (
                              <button key={t} onClick={() => toggleDraftTxn(t)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${sel ? "bg-primary/15 text-primary border-primary/40" : "border-border text-muted-foreground hover:text-foreground hover:border-white/20"}`}>
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Threshold (only for volume/count/single triggers) */}
                    {draft.triggerType && TRIGGER_TYPE_META[draft.triggerType].needsThreshold && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground font-semibold block mb-1">{TRIGGER_TYPE_META[draft.triggerType].thresholdLabel}</label>
                          <input type="number" min="0" value={draft.threshold ?? ""}
                            onChange={(e) => setDraft((d) => ({ ...d, threshold: e.target.value }))}
                            placeholder={draft.triggerType === "txn_count" ? "e.g. 3" : "e.g. 100"}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-foreground font-mono focus:outline-none focus:border-primary/50" />
                        </div>
                        {draft.triggerType !== "txn_count" && (
                          <div>
                            <label className="text-[10px] text-muted-foreground font-semibold block mb-1">Currency</label>
                            <select value={draft.thresholdCurrency ?? "USD"} onChange={(e) => setDraft((d) => ({ ...d, thresholdCurrency: e.target.value }))}
                              className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary/50">
                              {["USD","NGN","GBP","EUR","GHS","USDT","USDC","BTC","ETH","SOL"].map((c) => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* KYC tier selector */}
                    {draft.triggerType === "kyc" && (
                      <div>
                        <label className="text-[10px] text-muted-foreground font-semibold block mb-1.5">KYC Tier Required</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["1","2","3"] as const).map((tier) => (
                            <button key={tier} onClick={() => setDraft((d) => ({ ...d, kycTier: tier }))}
                              className={`py-2 rounded-lg text-left px-3 border transition-all ${draft.kycTier === tier ? "border-primary/40 bg-primary/10" : "border-border hover:border-white/15"}`}>
                              <p className={`text-[10px] font-bold ${draft.kycTier === tier ? "text-primary" : "text-foreground"}`}>Tier {tier}</p>
                              <p className="text-[9px] text-muted-foreground mt-0.5">{tier === "1" ? "BVN/NIN" : tier === "2" ? "Address + Face" : "Full PoA"}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Auto-generated condition summary */}
                    {liveCondition && (
                      <div className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                        <CheckCircle2 size={11} className="text-primary shrink-0" />
                        <p className="text-[10px] font-bold text-primary">Engine rule: <span className="font-mono">{liveCondition}</span></p>
                      </div>
                    )}
                  </div>

                  {/* Rewards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground font-semibold block mb-1">Referrer Reward (₦)</label>
                      <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden focus-within:border-primary/50">
                        <span className="px-2.5 text-[12px] text-muted-foreground border-r border-border">₦</span>
                        <input type="number" min="0" value={draft.referrerReward ?? ""} onChange={(e) => setDraft((d) => ({ ...d, referrerReward: e.target.value }))} placeholder="0"
                          className="flex-1 bg-transparent px-2.5 py-2 text-[12px] text-foreground focus:outline-none font-mono" />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1">Paid to the person who referred</p>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-semibold block mb-1">Referred User Reward (₦)</label>
                      <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden focus-within:border-primary/50">
                        <span className="px-2.5 text-[12px] text-muted-foreground border-r border-border">₦</span>
                        <input type="number" min="0" value={draft.referredReward ?? ""} onChange={(e) => setDraft((d) => ({ ...d, referredReward: e.target.value }))} placeholder="0"
                          className="flex-1 bg-transparent px-2.5 py-2 text-[12px] text-foreground focus:outline-none font-mono" />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1">Paid to the invitee (0 = referrer only)</p>
                    </div>
                  </div>

                  {/* Reward timing */}
                  <div>
                    <label className="text-[10px] text-muted-foreground font-semibold block mb-1.5">Reward Disbursement</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([["instant","Instant","Credited immediately on trigger"],["t+1d","T+1 Day","Held for 24h, then released"],["t+7d","T+7 Days","Held for 7 days, then released"]] as const).map(([id, label, hint]) => (
                        <button key={id} onClick={() => setDraft((d) => ({ ...d, rewardTiming: id }))}
                          className={`px-2.5 py-2 rounded-lg text-left border transition-all ${draft.rewardTiming === id ? "border-primary/40 bg-primary/10" : "border-border hover:border-white/15"}`}>
                          <p className={`text-[10px] font-bold ${draft.rewardTiming === id ? "text-primary" : "text-foreground"}`}>{label}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">{hint}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step color + description */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground font-semibold block mb-1.5">Step Color</label>
                      <div className="flex flex-wrap gap-2">
                        {STEP_COLORS_LIST.map((c) => (
                          <button key={c} onClick={() => setDraft((d) => ({ ...d, color: c }))} style={{ background: c }}
                            className={`size-5 rounded-md transition-all ${(draft.color ?? s.color) === c ? "ring-2 ring-white/60 ring-offset-1 ring-offset-background scale-110" : "opacity-60 hover:opacity-100"}`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-semibold block mb-1">Internal Note</label>
                      <input value={draft.desc ?? ""} onChange={(e) => setDraft((d) => ({ ...d, desc: e.target.value }))}
                        placeholder="Context for the team"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[11px] text-foreground focus:outline-none focus:border-primary/50" />
                    </div>
                  </div>
                </div>
              )}

              {i < steps.length - 1 && editingId !== s.id && (
                <div className="flex justify-start pl-[26px]"><div className="w-px h-3 bg-border/50" /></div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={addStep} className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-border text-[11px] font-semibold text-muted-foreground hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center gap-1.5">
        <Plus size={12} /> Add New Step
      </button>
    </div>
  );
}

// ─── Referral Overview ────────────────────────────────────────────────────────

function ReferralOverviewPage({
  setPage,
  overviewData,
  detailsData,
  isLoading,
  exportCsv,
}: {
  setPage: (p: Page) => void;
  overviewData?: { count?: number; data?: ReferralBonus[] };
  detailsData?: ReferralDetailRecord[];
  isLoading?: boolean;
  exportCsv?: () => void;
}) {
  const referrals: ReferralBonus[] = overviewData?.data || [];

  const totalReferrersCount = referrals.length;
  const totalInvites = overviewData?.count ?? referrals.length;
  const totalReward = referrals.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Calculate conversion rate from actual data
  const convertedUsers = referrals.filter((r) => r.userId?.dollarWallet && r.userId.dollarWallet > 0).length;
  const conversionRate = referrals.length > 0 ? Math.round((convertedUsers / referrals.length) * 100) : 0;

  const REFERRAL_TABS: { label: string; page: Page }[] = [
    { label: "Overview", page: "referral-overview" },
    { label: "User Details", page: "referral-details" },
    { label: "Downline Explorer", page: "referral-explorer" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Referral Program</h1>
          <PurpleBtn size="sm" onClick={exportCsv}><Download size={12} /> Export CSV</PurpleBtn>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Track every invite, signup, and reward across your network.</p>
      </div>

      {/* Sub-nav */}
      <div className="flex items-center gap-1 mb-7 bg-white/[0.03] border border-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
        {REFERRAL_TABS.map((t) => (
          <button key={t.page} onClick={() => setPage(t.page)}
            className={`px-4 sm:px-5 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all ${t.page === "referral-overview" ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            style={t.page === "referral-overview" ? { background: "linear-gradient(135deg,#7B3FE4,#5B2AB8)" } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <div className="bg-white/[0.025] border border-border rounded-xl p-5 flex items-start gap-3">
          <div className="size-9 rounded-xl bg-white/5 border border-border flex items-center justify-center shrink-0"><Users size={16} className="text-primary" /></div>
          <div>
            <p className="text-[11px] text-muted-foreground">Total Referrers</p>
            <p className="text-[22px] font-bold text-foreground leading-none mt-0.5">{totalReferrersCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Unique users who referred</p>
          </div>
        </div>
        <div className="bg-white/[0.025] border border-border rounded-xl p-5 flex items-start gap-3">
          <div className="size-9 rounded-xl bg-white/5 border border-border flex items-center justify-center shrink-0"><Share2 size={16} className="text-emerald-400" /></div>
          <div>
            <p className="text-[11px] text-muted-foreground">Total Referred</p>
            <p className="text-[22px] font-bold text-foreground leading-none mt-0.5">{totalInvites}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Users brought in</p>
          </div>
        </div>
        <div className="bg-white/[0.025] border border-border rounded-xl p-5 flex items-start gap-3">
          <div className="size-9 rounded-xl bg-white/5 border border-border flex items-center justify-center shrink-0"><TrendingUp size={16} className="text-amber-400" /></div>
          <div>
            <p className="text-[11px] text-muted-foreground">Conversion Rate</p>
            <p className="text-[22px] font-bold text-foreground leading-none mt-0.5">{conversionRate}%</p>
            <p className="text-[10px] text-muted-foreground mt-1">Active deposited users</p>
          </div>
        </div>
        <div className="bg-white/[0.025] border border-border rounded-xl p-5 flex items-start gap-3">
          <div className="size-9 rounded-xl bg-white/5 border border-border flex items-center justify-center shrink-0"><DollarSign size={16} className="text-violet-400" /></div>
          <div>
            <p className="text-[11px] text-muted-foreground">Rewards Paid</p>
            <p className="text-[22px] font-bold text-foreground leading-none mt-0.5">₦{totalReward.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Total referral rewards</p>
          </div>
        </div>
      </div>

      {/* Performance chart */}
      <div className="bg-white/[0.025] border border-border rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[13px] font-bold text-foreground">Top Referrers</p>
            <p className="text-[11px] text-muted-foreground">By referrals sent and conversion rate</p>
          </div>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-[12px] flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={14} /> Loading referrers performance...
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.length > 0 ? (
              referrals.map((r, i) => {
                const referredCount = r.referredCount || 0;
                const converted = r.userId?.dollarWallet && r.userId.dollarWallet > 0 ? 1 : 0;
                const pct = referredCount > 0 ? Math.round((converted / referredCount) * 100) : 0;
                return (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 group border-b border-border/30 sm:border-0 pb-3 sm:pb-0">
                    <div className="flex items-center gap-2.5 w-full sm:w-52 shrink-0">
                      <div className="size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ background: `hsl(${260 + i * 30}, 70%, 55%)` }}>
                        {r.userId?.fullName?.split(" ").map((w) => w[0]).join("").slice(0, 2) || "??"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-foreground truncate">{r.userId?.fullName || "Unknown User"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{r.userId?.email || "-"}</p>
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="h-7 bg-secondary rounded-lg overflow-hidden relative">
                        <div className="h-full rounded-lg flex items-center justify-end px-2.5 transition-all"
                          style={{ width: `${Math.min(100, Math.max(20, ((r.amount || 0) / 30) * 100))}%`, minWidth: 60, background: `linear-gradient(90deg, hsl(${260 + i * 30}, 70%, 45%), hsl(${260 + i * 30}, 70%, 55%))` }}>
                          <span className="text-[10px] font-bold text-white">₦{r.amount || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-36 shrink-0">
                      <div className="text-left sm:text-right flex-1">
                        <p className="text-[11px] font-bold text-foreground">{referredCount} referred</p>
                        <p className={`text-[10px] font-semibold ${pct >= 50 ? "text-emerald-400" : pct > 0 ? "text-amber-400" : "text-zinc-500"}`}>{pct}% converted</p>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${pct > 0 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"}`}>
                        {pct > 0 ? "active" : "inactive"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-muted-foreground text-[12px]">No referral data available</div>
            )}
          </div>
        )}
      </div>

      {/* Viral Loop section header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="size-5 rounded-lg bg-primary/15 flex items-center justify-center">
            <Zap size={11} className="text-primary" />
          </div>
          <h2 className="text-[14px] font-bold text-foreground">Viral Loop — 7-Step Reward System</h2>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">LIVE</span>
        </div>
        <p className="text-[12px] text-muted-foreground ml-7">Configure rewards at each step of the referral journey. Referrers can earn up to ₦13,869 per successful invite.</p>
      </div>

      {/* Viral Loop Editor + Funnel side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 mb-6">
        <div className="bg-white/[0.025] border border-border rounded-xl p-4 sm:p-5 overflow-y-auto max-h-[600px]">
          <ViralLoopEditor detailsData={detailsData} />
        </div>
        <div className="space-y-4">
          {/* Funnel */}
          <div className="bg-white/[0.025] border border-border rounded-xl p-5">
            <p className="text-[13px] font-bold text-foreground mb-1">Conversion Funnel</p>
            <p className="text-[11px] text-muted-foreground mb-4">Where referred users stand across 7 steps</p>
            <div className="space-y-2">
              {[
                { label: "Step 1 — Invite sent", pct: 100, color: "#7B3FE4" },
                { label: "Step 2 — Registered", pct: 72, color: "#6366F1" },
                { label: "Step 3 — KYC / Wallet", pct: 51, color: "#3B82F6" },
                { label: "Step 4 — ≥$100 in", pct: 34, color: "#10B981" },
                { label: "Step 5 — First bill", pct: 28, color: "#F59E0B" },
                { label: "Step 6 — ≥$500 in", pct: 18, color: "#EF4444" },
                { label: "Step 7 — ≥$1K in", pct: 9, color: "#EC4899" },
              ].map((f) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">{f.label}</span>
                    <span className="text-[10px] font-bold text-foreground">{f.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${f.pct}%`, backgroundColor: f.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* K-Factor card */}
          <div className="bg-white/[0.025] border border-border rounded-xl p-5">
            <p className="text-[13px] font-bold text-foreground mb-3">Virality Metrics</p>
            <div className="space-y-3">
              {[
                { label: "K-Factor", value: "0.72", sub: "avg invites × conversion", color: "text-primary" },
                { label: "Avg time to Step 4", value: "11d", sub: "invite to first deposit", color: "text-amber-400" },
                { label: "Avg referrer lifetime", value: `₦${fmtN(Math.round(totalReward / (referrals.length || 1)))}`, sub: "avg reward earned", color: "text-emerald-400" },
                { label: "Viral cycle time", value: "4.2d", sub: "trigger to new signup", color: "text-violet-400" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">{m.label}</p>
                    <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                  </div>
                  <span className={`text-[16px] font-black font-mono ${m.color}`}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Referral User Details ────────────────────────────────────────────────────

function ReferralDetailsPage({
  setPage,
  detailsData,
  isLoading,
  exportCsv,
}: {
  setPage: (p: Page) => void;
  detailsData?: ReferralDetailRecord[];
  isLoading?: boolean;
  exportCsv?: () => void;
}) {
  const [pg, setPg] = useState(1);
  const [search, setSearch] = useState("");
  const perPage = 8;

  const rows = detailsData?.map((d) => ({
    referred: d.user?.fullName || "Unknown User",
    rEmail: d.user?.email || "-",
    rPhone: d.user?.phoneNumber || "-",
    by: d.referredBy?.fullName || "",
    bEmail: d.referredBy?.email || "",
    stage: d.type || "welcome_bonus",
    amount: d.amount || 0,
    date: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
  })) || [];

  const REFERRAL_TABS: { label: string; page: Page }[] = [
    { label: "Overview", page: "referral-overview" },
    { label: "User Details", page: "referral-details" },
    { label: "Downline Explorer", page: "referral-explorer" },
  ];

  const STAGE_BADGE: Record<string, string> = {
    welcome_bonus: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    invite_reward: "bg-violet-500/15 text-violet-400 border-violet-500/20",
    referral: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  };
  const STAGE_LABEL: Record<string, string> = {
    welcome_bonus: "Welcome Bonus",
    invite_reward: "Invite Reward",
    referral: "Referral",
  };

  const filtered = rows.filter((r) => !search || 
    r.referred.toLowerCase().includes(search.toLowerCase()) || 
    r.rEmail.toLowerCase().includes(search.toLowerCase()) || 
    r.by.toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice((pg - 1) * perPage, pg * perPage);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Referral Program</h1>
        <PurpleBtn size="sm" onClick={exportCsv}><Download size={12} /> Export CSV</PurpleBtn>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground mb-6">Track every invite, signup, and reward across your network.</p>
      <div className="flex items-center gap-1 mb-7 bg-white/[0.03] border border-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
        {REFERRAL_TABS.map((t) => (
          <button key={t.page} onClick={() => setPage(t.page)}
            className={`px-4 sm:px-5 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all ${t.page === "referral-details" ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            style={t.page === "referral-details" ? { background: "linear-gradient(135deg,#7B3FE4,#5B2AB8)" } : {}}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Referral Records" value={String(rows.length)} sub="Total events logged" />
        <StatCard label="Total Rewards" value={`₦${rows.reduce((a, r) => a + r.amount, 0).toFixed(2)}`} sub="Combined payout amount" />
        <StatCard label="Referral Linked" value={String(rows.filter((r) => r.by).length)} sub="Records with referrer" />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-border rounded-xl px-3.5 py-2.5">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPg(1); }} placeholder="Search by name or email…"
            className="bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none flex-1" />
        </div>
      </div>
      <TableWrap>
        <THead cols={["Referred User", "Referred By", "Stage", "Reward", "Date"]} />
        <tbody className="divide-y divide-border">
          {isLoading ? (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-[12px] text-muted-foreground">
                <Loader2 className="animate-spin inline mr-2" size={14} /> Loading referral user details...
              </td>
            </tr>
          ) : paged.length > 0 ? (
            paged.map((r, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}>
                      {r.referred.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">{r.referred}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{r.rEmail}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {r.by
                    ? <div><p className="text-[12px] font-semibold text-foreground">{r.by}</p><p className="text-[10px] text-muted-foreground">{r.bEmail}</p></div>
                    : <span className="text-[11px] text-muted-foreground italic">Organic signup</span>}
                </td>
                <td className="px-5 py-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STAGE_BADGE[r.stage] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"}`}>
                    {STAGE_LABEL[r.stage] || r.stage}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[13px] font-mono font-bold text-emerald-400">+₦{r.amount.toFixed(2)}</span>
                </td>
                <td className="px-5 py-4 text-[11px] text-muted-foreground">{r.date}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-[12px] text-muted-foreground">
                No referral details available
              </td>
            </tr>
          )}
        </tbody>
      </TableWrap>
      <Pagination page={pg} total={filtered.length} perPage={perPage} onChange={setPg} />
    </div>
  );
}

// ─── Referral Downline Tab Wrapper ──────────────────────────────────────────

function ReferralDownlineTabWrapper({ setPage }: { setPage: (p: Page) => void }) {
  const REFERRAL_TABS: { label: string; page: Page }[] = [
    { label: "Overview", page: "referral-overview" },
    { label: "User Details", page: "referral-details" },
    { label: "Downline Explorer", page: "referral-explorer" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Referral Program
        </h1>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground mb-6">
        Track every invite, signup, and reward across your network.
      </p>

      {/* Referral tabs */}
      <div className="flex items-center gap-1 mb-7 bg-white/[0.03] border border-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
        {REFERRAL_TABS.map((t) => (
          <button
            key={t.page}
            onClick={() => setPage(t.page)}
            className={`px-4 sm:px-5 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all ${
              t.page === "referral-explorer"
                ? "text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={
              t.page === "referral-explorer"
                ? {
                    background:
                      "linear-gradient(135deg,#7B3FE4,#5B2AB8)",
                  }
                : {}
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Downline content */}
      <ReferralDownline isTab />
    </div>
  );
}

const ReferralProgram = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab =
    (searchParams.get("tab") as "overview" | "details" | "downline") ??
    "overview";

  const overviewQuery = useQuery({
    queryKey: ["referrals"],
    queryFn: referralAPI.getAll,
  });

  const detailsQuery = useQuery({
    queryKey: ["referral-details"],
    queryFn: referralAPI.getAllReferralDetails,
  });

  const handleTabChange = (page: Page) => {
    if (page === "referral-overview") {
      setSearchParams({ tab: "overview" });
    } else if (page === "referral-details") {
      setSearchParams({ tab: "details" });
    } else if (page === "referral-explorer") {
      setSearchParams({ tab: "downline" });
    } else {
      navigate(`/admin/${page}`);
    }
  };

  const exportCsv = () => {
    const list: ReferralBonus[] = overviewQuery.data?.data || [];

    if (!list.length) return;

    const headers = [
      "Referrer Name",
      "Referrer Email",
      "Deposit (USD)",
      "Reward (NGN)",
    ];

    const rows = list.map((item) => [
      item.userId?.fullName || "Unknown User",
      item.userId?.email || "-",
      (item.userId?.dollarWallet || 0).toFixed(2),
      (item.amount || 0).toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((e) => e.join(","))
        .join("\n");

    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `referral-report-${new Date().toISOString()}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (activeTab === "details") {
    return (
      <ReferralDetailsPage
        setPage={handleTabChange}
        detailsData={detailsQuery.data?.data}
        isLoading={detailsQuery.isLoading}
        exportCsv={exportCsv}
      />
    );
  }

  if (activeTab === "downline") {
    return <ReferralDownlineTabWrapper setPage={handleTabChange} />;
  }

  return (
    <ReferralOverviewPage
      setPage={handleTabChange}
      overviewData={overviewQuery.data}
      detailsData={detailsQuery.data?.data}
      isLoading={overviewQuery.isLoading}
      exportCsv={exportCsv}
    />
  );
};

export default ReferralProgram;