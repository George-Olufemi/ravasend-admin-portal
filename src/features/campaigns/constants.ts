export interface GoalOption {
  id: string;
  label: string;
  desc: string;
  icon?: string;
}

export const GOAL_OPTIONS: GoalOption[] = [
  { id: "deposit", label: "Make a Deposit", desc: "User deposits funds into wallet", icon: "💰" },
  { id: "send_money", label: "Send Money", desc: "User sends money via P2P or bank transfer", icon: "💸" },
  { id: "bill_payment", label: "Bill Payment", desc: "User pays utilities, airtime, data, etc.", icon: "🧾" },
  { id: "invite_friends", label: "Invite Friends", desc: "User refers new active users", icon: "👥" },
  { id: "kyc_upgrade", label: "KYC Upgrade", desc: "User upgrades verification tier", icon: "🆔" },
];

export const DEPOSIT_TYPES: Record<string, string[]> = {
  Crypto: ["Any Crypto", "USDT", "BTC", "ETH", "SOL"],
  Fiat: ["Bank Transfer", "Card Deposit", "Direct Debit"],
};

export const GOAL_CURRENCIES = ["NGN", "USD", "USDT"];

export const DEPOSIT_SUBTYPES = ["first Deposit", "any Deposit", "recurring Deposit"];
