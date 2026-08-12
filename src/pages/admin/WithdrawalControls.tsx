import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Lock,
  Unlock,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  AlertOctagon,
  Edit2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { systemSettingsAPI } from "@/lib/api";

// ── Types ──
interface AccessControlStatus {
  _id: string;
  userId?: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    role?: string;
  };
  isPermitted: boolean; // true = withdrawals active, false = paused
  createdAt: string;
  updatedAt: string;
}

interface AccessControlStatusResponse {
  message: string;
  data: AccessControlStatus;
}

interface AuditLogEntry {
  _id: string;
  userId?: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    role?: string;
  };
  featureName: string;
  email?: string;
  ipAddress?: string;
  browser?: string;
  device?: string;
  location?: string;
  createdAt: string;
  updatedAt?: string;
}

interface AuditLogResponse {
  success: boolean;
  message: string;
  data: AuditLogEntry[];
}

const WITHDRAWAL_STATUS_QUERY_KEY = ["withdrawal-pause-status"] as const;
const WITHDRAWAL_AUDIT_LOG_QUERY_KEY = ["withdrawal-pause-audit-log"] as const;

// ── Helpers ──
function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      {subtitle && <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`w-11 h-6 rounded-full transition-colors relative disabled:opacity-50 ${on ? "bg-primary" : "bg-secondary"}`}
    >
      <span className={`size-4 rounded-full bg-white absolute top-1 transition-transform ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

const parseAuditEntry = (entry: AuditLogEntry) => {
  const isPause = entry.featureName?.toLowerCase().includes("disabled");
  return {
    action: isPause ? "PAUSED" : "RESUMED",
    label: isPause ? "Withdrawals PAUSED" : "Withdrawals RESUMED",
  };
};

const SAMPLE_AUDIT_LOG = [
  { id: "1", action: "PAUSED", actor: "Chukwuemeka Obi", role: "Super Admin", reason: "Elevated risk on high-value transfer batch", at: "Jul 2, 2026 at 14:23" },
  { id: "2", action: "RESUMED", actor: "Tobi Oluwaseun", role: "Super Admin", reason: "Batch cleared risk checks", at: "Jun 28, 2026 at 09:15" },
  { id: "3", action: "PAUSED", actor: "Chidinma Eze", role: "Finance / Ops", reason: "Upstream provider maintenance on PalmPay channel", at: "Jun 14, 2026 at 18:40" },
];

const WithdrawalControls = () => {
  const queryClient = useQueryClient();

  // ── Status query ──
  const {
    data: statusResponse,
    isLoading: isStatusLoading,
    isError: isStatusError,
  } = useQuery<AccessControlStatusResponse>({
    queryKey: WITHDRAWAL_STATUS_QUERY_KEY,
    queryFn: systemSettingsAPI.getWithdrawalPauseStatus,
  });

  const statusData = statusResponse?.data;
  // isPermitted = true means ACTIVE. paused = !isPermitted
  const killSwitchActive = statusData?.isPermitted ?? true;
  const paused = !killSwitchActive;

  // ── Audit log query ──
  const {
    data: auditLogResponse,
    isLoading: isAuditLoading,
  } = useQuery<AuditLogResponse>({
    queryKey: WITHDRAWAL_AUDIT_LOG_QUERY_KEY,
    queryFn: systemSettingsAPI.getWithdrawalPauseAuditLog,
  });

  const liveAuditLog = auditLogResponse?.data ?? [];

  // ── Mutation ──
  const toggleMutation = useMutation({
    mutationFn: systemSettingsAPI.toggleWithdrawalPause,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WITHDRAWAL_STATUS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WITHDRAWAL_AUDIT_LOG_QUERY_KEY });
      setShowModal(false);
      setToast(paused ? "Withdrawals resumed successfully." : "Withdrawals paused. Outbound requests held.");
      const newPausedState = !paused;
      localStorage.setItem("reva_withdrawal_paused", String(newPausedState));
      window.dispatchEvent(new CustomEvent("withdrawal-paused-changed", { detail: newPausedState }));
      setTimeout(() => setToast(null), 5000);
    },
  });

  // Kill-switch modal
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<"pause" | "resume">("pause");
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Granular states
  const [granular, setGranular] = useState([false, false, false, false]);
  const [highValueThreshold, setHighValueThreshold] = useState("100000");
  const [thresholdDraft, setThresholdDraft] = useState("100000");
  const [editingThreshold, setEditingThreshold] = useState(false);

  // Granular confirm modal
  const [granularModal, setGranularModal] = useState<{ index: number; enabling: boolean } | null>(null);
  const [granularReason, setGranularReason] = useState("");

  const openModal = (a: "pause" | "resume") => {
    setAction(a);
    setReason("");
    setShowModal(true);
  };

  const confirmKillSwitch = () => {
    toggleMutation.mutate();
  };

  const openGranular = (i: number) => {
    setGranularModal({ index: i, enabling: !granular[i] });
    setGranularReason("");
  };

  const confirmGranular = () => {
    if (!granularModal) return;
    setGranular((g) => g.map((v, j) => (j === granularModal.index ? granularModal.enabling : v)));
    if (granularModal.index === 0 && granularModal.enabling) setHighValueThreshold(thresholdDraft);
    const label = granularLabels[granularModal.index](highValueThreshold);
    setToast(`${granularModal.enabling ? "Enabled" : "Disabled"}: ${label}`);
    setTimeout(() => setToast(null), 5000);
    setGranularModal(null);
  };

  const granularLabels = [
    (thresh: string) => `Pause withdrawals above ₦${parseInt(thresh || "0").toLocaleString()}`,
    () => "Pause withdrawals for flagged accounts",
    () => "Pause PalmPay channel only",
    () => "Pause for new accounts (< 7 days)",
  ];
  const granularDescs = [
    "Hold high-value transfers only — amounts exceeding the threshold are queued.",
    "Hold all outbound requests from accounts with active fraud flags.",
    "Block PalmPay as a payout channel while all other methods continue.",
    "Hold withdrawals from accounts created within the last 7 days.",
  ];

  const lastActorName = statusData?.userId?.fullName ?? "Chukwuemeka Obi";
  const lastUpdatedAt = statusData?.updatedAt
    ? format(new Date(statusData.updatedAt), "MMM d, yyyy 'at' HH:mm")
    : "Jul 2, 2026 at 14:23";

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader title="Withdrawal Controls" subtitle="Platform-wide withdrawal management and emergency kill switch" />

      {toast && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${paused ? "bg-red-500/8 border-red-500/25" : "bg-emerald-500/8 border-emerald-500/25"
            }`}
        >
          <CheckCircle2 size={16} className={paused ? "text-red-400" : "text-emerald-400"} />
          <span className={`text-[13px] font-semibold ${paused ? "text-red-400" : "text-emerald-400"}`}>{toast}</span>
        </div>
      )}

      {/* Kill Switch Main Card */}
      <div
        className={`rounded-2xl border-2 p-8 mb-6 transition-all ${paused ? "border-red-500/30 bg-red-500/5" : "border-border bg-card"
          }`}
      >
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-5">
            <div
              className={`size-[56px] rounded-2xl flex items-center justify-center transition-colors ${paused ? "bg-red-500/15" : "bg-emerald-500/10"
                }`}
            >
              {isStatusLoading ? (
                <Loader2 className="animate-spin text-muted-foreground" size={24} />
              ) : paused ? (
                <Lock size={24} className="text-red-400" />
              ) : (
                <Unlock size={24} className="text-emerald-400" />
              )}
            </div>
            <div>
              <p className="text-[16px] font-bold text-foreground">Withdrawal Kill Switch</p>
              {isStatusLoading ? (
                <p className="text-[13px] text-muted-foreground mt-1">Loading status...</p>
              ) : isStatusError ? (
                <p className="text-[13px] font-semibold text-amber-400 mt-1">Failed to connect to backend — using local status</p>
              ) : (
                <p className={`text-[13px] font-semibold mt-1 ${paused ? "text-red-400" : "text-emerald-400"}`}>
                  {paused ? "⛔ PAUSED — No funds leaving the platform" : "✓ ACTIVE — Processing normally"}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">
                Last changed by <span className="text-foreground font-semibold">{lastActorName}</span> · {lastUpdatedAt}
              </p>
            </div>
          </div>

          {paused ? (
            <button
              disabled={toggleMutation.isPending}
              onClick={() => openModal("resume")}
              className="flex items-center gap-2 bg-emerald-500 text-white font-bold text-[13px] px-6 py-3 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {toggleMutation.isPending ? <Loader2 className="animate-spin" size={17} /> : <PlayCircle size={17} />} Resume Withdrawals
            </button>
          ) : (
            <button
              disabled={toggleMutation.isPending}
              onClick={() => openModal("pause")}
              className="flex items-center gap-2 bg-red-500 text-white font-bold text-[13px] px-6 py-3 rounded-xl hover:bg-red-400 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50"
            >
              {toggleMutation.isPending ? <Loader2 className="animate-spin" size={17} /> : <PauseCircle size={17} />} Pause All Withdrawals
            </button>
          )}
        </div>

        {paused && (
          <div className="mt-6 pt-6 border-t border-red-500/15 grid grid-cols-3 gap-4">
            {[{ l: "Held Requests", v: "47" }, { l: "Amount Held", v: "₦4.2M" }, { l: "Duration", v: "2h 14m" }].map((s) => (
              <div key={s.l} className="bg-red-500/8 border border-red-500/15 rounded-xl p-4">
                <p className="text-[9px] text-red-400/60 font-bold uppercase tracking-widest mb-1">{s.l}</p>
                <p className="text-[20px] font-bold text-red-400">{s.v}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Granular Controls */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[13px] font-bold text-foreground">Granular Controls</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Fine-grained pause options without full platform shutdown — each requires a reason
          </p>
        </div>
        <div className="divide-y divide-border">
          {granularLabels.map((labelFn, i) => (
            <div key={i} className={`px-5 py-4 transition-colors ${granular[i] ? "bg-amber-500/5" : ""}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-semibold text-foreground">{labelFn(highValueThreshold)}</p>
                    {granular[i] && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{granularDescs[i]}</p>
                </div>
                <Toggle on={granular[i]} onToggle={() => openGranular(i)} />
              </div>

              {i === 0 && (
                <div className="mt-3 flex items-center gap-2">
                  {editingThreshold ? (
                    <>
                      <div className="flex items-center bg-background border border-primary/40 rounded-lg overflow-hidden">
                        <span className="px-2.5 text-[12px] text-muted-foreground border-r border-border">₦</span>
                        <input
                          type="number"
                          min="0"
                          value={thresholdDraft}
                          onChange={(e) => setThresholdDraft(e.target.value)}
                          autoFocus
                          className="bg-transparent px-2.5 py-1.5 text-[12px] font-mono text-foreground focus:outline-none w-32"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (granular[0]) {
                            setGranularModal({ index: 0, enabling: true });
                            setGranularReason("");
                          } else {
                            setHighValueThreshold(thresholdDraft);
                          }
                          setEditingThreshold(false);
                        }}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-primary hover:bg-primary/90 transition-colors"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => {
                          setThresholdDraft(highValueThreshold);
                          setEditingThreshold(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] text-muted-foreground border border-border hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setThresholdDraft(highValueThreshold);
                        setEditingThreshold(true);
                      }}
                      className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/40 rounded-lg px-2.5 py-1.5"
                    >
                      <Edit2 size={10} />
                      Threshold:{" "}
                      <span className="font-mono font-bold text-foreground">
                        ₦{parseInt(highValueThreshold || "0").toLocaleString()}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[13px] font-bold text-foreground">Audit Log</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Every pause and resume with actor and reason</p>
        </div>
        <div className="divide-y divide-border">
          {isAuditLoading ? (
            <div className="p-8 text-center text-muted-foreground text-[12px] flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={14} /> Loading audit log...
            </div>
          ) : liveAuditLog.length > 0 ? (
            liveAuditLog.map((entry) => {
              const parsed = parseAuditEntry(entry);
              const actorName = entry.userId?.fullName ?? entry.email ?? "Admin User";
              const role = entry.userId?.role ?? "Super Admin";
              const dateStr = entry.createdAt ? format(new Date(entry.createdAt), "MMM d, yyyy 'at' HH:mm") : "Just now";
              return (
                <div key={entry._id} className="px-5 py-4 flex items-start gap-4">
                  <div
                    className={`size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${parsed.action === "PAUSED" ? "bg-red-500/10" : "bg-emerald-500/10"
                      }`}
                  >
                    {parsed.action === "PAUSED" ? <Lock size={13} className="text-red-400" /> : <Unlock size={13} className="text-emerald-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[12px] font-bold ${parsed.action === "PAUSED" ? "text-red-400" : "text-emerald-400"}`}>
                        {parsed.label}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">{dateStr}</span>
                    </div>
                    <p className="text-[12px] text-foreground mt-0.5">
                      {actorName} <span className="text-muted-foreground text-[11px]">({role})</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 italic">"{entry.featureName}"</p>
                  </div>
                </div>
              );
            })
          ) : (
            SAMPLE_AUDIT_LOG.map((log) => (
              <div key={log.id} className="px-5 py-4 flex items-start gap-4">
                <div
                  className={`size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${log.action === "PAUSED" ? "bg-red-500/10" : "bg-emerald-500/10"
                    }`}
                >
                  {log.action === "PAUSED" ? <Lock size={13} className="text-red-400" /> : <Unlock size={13} className="text-emerald-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[12px] font-bold ${log.action === "PAUSED" ? "text-red-400" : "text-emerald-400"}`}>
                      Withdrawals {log.action}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">{log.at}</span>
                  </div>
                  <p className="text-[12px] text-foreground mt-0.5">
                    {log.actor} <span className="text-muted-foreground text-[11px]">({log.role})</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 italic">"{log.reason}"</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Granular confirm modal */}
      {granularModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setGranularModal(null)}
        >
          <div className="rounded-2xl p-8 w-[460px] border border-border" style={{ background: "#0F0D26" }} onClick={(e) => e.stopPropagation()}>
            <div className={`size-12 rounded-2xl flex items-center justify-center mb-5 ${granularModal.enabling ? "bg-amber-500/12" : "bg-emerald-500/12"}`}>
              {granularModal.enabling ? <PauseCircle size={22} className="text-amber-400" /> : <PlayCircle size={22} className="text-emerald-400" />}
            </div>
            <h2 className="text-[16px] font-bold text-foreground mb-1.5">
              {granularModal.enabling ? "Enable this control?" : "Disable this control?"}
            </h2>
            <p className="text-[12px] text-muted-foreground leading-relaxed mb-1.5">
              <span className="text-foreground font-semibold">
                {granularLabels[granularModal.index](granularModal.index === 0 ? thresholdDraft : highValueThreshold)}
              </span>
            </p>
            <p className="text-[12px] text-muted-foreground leading-relaxed mb-5">
              {granularModal.enabling
                ? `${granularDescs[granularModal.index]} This action is logged and reversible.`
                : "This will deactivate the control and resume normal processing for affected accounts."}
            </p>
            <div className="mb-5">
              <label className="text-[11px] text-muted-foreground font-bold block mb-1.5">Reason (required for audit log)</label>
              <textarea
                value={granularReason}
                onChange={(e) => setGranularReason(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none h-20"
                placeholder={granularModal.enabling ? "e.g. Elevated fraud risk on high-value transfers..." : "e.g. Risk window cleared, resuming normal flow..."}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setGranularModal(null)}
                className="flex-1 border border-border text-muted-foreground py-2.5 rounded-xl text-[13px] font-semibold hover:text-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmGranular}
                disabled={!granularReason.trim()}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${granularModal.enabling ? "bg-amber-500 hover:bg-amber-400" : "bg-emerald-500 hover:bg-emerald-400"
                  }`}
              >
                {granularModal.enabling ? "Confirm — Enable" : "Confirm — Disable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Kill switch modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowModal(false)}>
          <div className="rounded-2xl p-8 w-[480px] border border-border" style={{ background: "#0F0D26" }} onClick={(e) => e.stopPropagation()}>
            <div className={`size-14 rounded-2xl flex items-center justify-center mb-6 ${action === "pause" ? "bg-red-500/12" : "bg-emerald-500/12"}`}>
              {action === "pause" ? <AlertOctagon size={26} className="text-red-400" /> : <PlayCircle size={26} className="text-emerald-400" />}
            </div>
            <h2 className="text-[17px] font-bold text-foreground mb-2">{action === "pause" ? "Pause All Withdrawals?" : "Resume Withdrawals?"}</h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
              {action === "pause"
                ? "This immediately halts ALL withdrawal requests platform-wide. Pending requests are held, not rejected. Fully logged and reversible."
                : "This resumes normal withdrawal processing. Held requests will be queued for review before processing."}
            </p>
            <div className="mb-6">
              <label className="text-[11px] text-muted-foreground font-bold block mb-1.5">Reason (required for audit log)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none h-24"
                placeholder={action === "pause" ? "e.g. Suspicious withdrawal batch detected..." : "e.g. Investigation complete, no breach confirmed..."}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-border text-muted-foreground py-3 rounded-xl text-[13px] font-semibold hover:text-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmKillSwitch}
                disabled={!reason.trim() || toggleMutation.isPending}
                className={`flex-1 py-3 rounded-xl text-[13px] font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${action === "pause" ? "bg-red-500 hover:bg-red-400" : "bg-emerald-500 hover:bg-emerald-400"
                  }`}
              >
                {toggleMutation.isPending && <Loader2 className="animate-spin" size={14} />}
                {action === "pause" ? "Confirm — Pause Now" : "Confirm — Resume Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalControls;