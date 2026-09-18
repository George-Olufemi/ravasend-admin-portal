export type Page =
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

export type ViralTriggerType =
  | "invite_sent"
  | "registration"
  | "kyc"
  | "first_txn"
  | "single_txn"
  | "cumulative_volume"
  | "txn_count";

export interface ViralStep {
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
