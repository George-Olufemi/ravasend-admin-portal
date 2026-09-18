export const WITHDRAWAL_STATUS_QUERY_KEY = ["withdrawal-pause-status"] as const;
export const WITHDRAWAL_AUDIT_LOG_QUERY_KEY = ["withdrawal-pause-audit-log"] as const;

export const SAMPLE_AUDIT_LOG = [
  { id: "1", action: "PAUSED", actor: "Chukwuemeka Obi", role: "Super Admin", reason: "Elevated risk on high-value transfer batch", at: "Jul 2, 2026 at 14:23" },
  { id: "2", action: "RESUMED", actor: "Tobi Oluwaseun", role: "Super Admin", reason: "Batch cleared risk checks", at: "Jun 28, 2026 at 09:15" },
  { id: "3", action: "PAUSED", actor: "Chidinma Eze", role: "Finance / Ops", reason: "Upstream provider maintenance on PalmPay channel", at: "Jun 14, 2026 at 18:40" },
];
