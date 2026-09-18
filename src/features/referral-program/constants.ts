import { ViralStep, ViralTriggerType } from "./types";
import { mkViralStep } from "./utils";

export const REFERRAL_TXN_TYPES = [
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

export const DEFAULT_VIRAL_STEPS: ViralStep[] = [
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

export const TRIGGER_TYPE_META: Record<ViralTriggerType, { label: string; desc: string; needsTxnTypes: boolean; needsThreshold: boolean; thresholdLabel: string }> = {
  invite_sent:       { label: "Invite Sent",          desc: "Fires when the referrer shares their link. No transaction required.", needsTxnTypes: false, needsThreshold: false, thresholdLabel: "" },
  registration:      { label: "Account Registration", desc: "Fires when the invitee creates a Ravasend account via the referral link.", needsTxnTypes: false, needsThreshold: false, thresholdLabel: "" },
  kyc:               { label: "KYC Tier Passed",       desc: "Fires when invitee reaches the selected KYC tier. Each tier fires at most once per user. Tier 2 implies Tier 1 already passed; Tier 3 implies Tier 2.", needsTxnTypes: false, needsThreshold: false, thresholdLabel: "" },
  first_txn:         { label: "First Transaction",    desc: "Fires on the very first transaction of the selected type(s). Fires once per user.", needsTxnTypes: true, needsThreshold: false, thresholdLabel: "" },
  single_txn:        { label: "Single Transaction ≥ threshold", desc: "Fires whenever a single transaction of the selected type meets the amount threshold. Can fire multiple times.", needsTxnTypes: true, needsThreshold: true, thresholdLabel: "Min Amount" },
  cumulative_volume: { label: "Cumulative Volume ≥ threshold", desc: "Fires once when the running total of selected transaction types crosses the threshold. Uses USD equivalent for multi-currency.", needsTxnTypes: true, needsThreshold: true, thresholdLabel: "Total Volume" },
  txn_count:         { label: "Transaction Count ≥ N", desc: "Fires once when the invitee completes N transactions of the selected type(s).", needsTxnTypes: true, needsThreshold: true, thresholdLabel: "Count (N)" },
};

export const STEP_COLORS_LIST = [
  "#7B3FE4","#6366F1","#3B82F6","#10B981","#F59E0B","#EF4444","#EC4899","#8B5CF6","#06B6D4",
];
