import { AuditLogEntry } from "./types";

export const parseAuditEntry = (entry: AuditLogEntry) => {
  const isPause = entry.featureName?.toLowerCase().includes("disabled");
  return {
    action: isPause ? "PAUSED" : "RESUMED",
    label: isPause ? "Withdrawals PAUSED" : "Withdrawals RESUMED",
  };
};
