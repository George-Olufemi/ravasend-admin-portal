import { ViralStep, ViralTriggerType } from "./types";

export function fmtN(num: number) {
  return new Intl.NumberFormat().format(num || 0);
}

export function buildConditionSummary(s: Pick<ViralStep, "triggerType" | "kycTier" | "txnTypes" | "threshold" | "thresholdCurrency" | "operator">): string {
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

export const mkViralStep = (
  id: string, step: number, trigger: string, desc: string,
  triggerType: ViralTriggerType, txnTypes: string[], threshold: string, thresholdCurrency: string,
  referrerReward: string, referredReward: string, color: string,
  operator: ViralStep["operator"] = "gte", rewardTiming: ViralStep["rewardTiming"] = "instant",
  kycTier: ViralStep["kycTier"] = "1"
): ViralStep => ({
  id, step, trigger, desc, triggerType, kycTier, txnTypes, threshold, thresholdCurrency,
  operator, rewardTiming, referrerReward, referredReward, enabled: true, color,
});
