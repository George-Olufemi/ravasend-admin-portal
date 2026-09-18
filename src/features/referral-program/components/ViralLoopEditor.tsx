import React, { useState } from "react";
import { CheckCircle2, Edit2, Trash2, Plus } from "lucide-react";
import { ReferralDetailRecord } from "@/lib/api";
import { ViralStep, ViralTriggerType } from "../types";
import { DEFAULT_VIRAL_STEPS, TRIGGER_TYPE_META, STEP_COLORS_LIST, REFERRAL_TXN_TYPES } from "../constants";
import { buildConditionSummary, mkViralStep, fmtN } from "../utils";

export function ViralLoopEditor({ detailsData }: { detailsData?: ReferralDetailRecord[] }) {
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
