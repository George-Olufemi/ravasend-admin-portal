import { Fee as ApiFee } from "@/lib/api";

export interface FeeRule {
  id: string;
  _id?: string;
  name: string;
  category: string;
  feeModel: "flat" | "percentage" | "flat+percentage" | "free" | "commission";
  scope: "all" | "specific";
  providers: string[];
  direction: "all" | "deposit" | "withdrawal" | "swap";
  base: string;
  percent: string;
  cap: string;
  noCap: boolean;
  currencies: string[];
  minAmount: string;
  maxAmount: string;
  commissionUserPct: number;
  commissionPlatformPct: number;
  status: "active" | "inactive";
  updatedAt?: string;
  rawItem?: ApiFee;
}

export type FeeFormState = {
  name: string;
  category: string;
  feeModel: string;
  scope: "all" | "specific";
  providers: string[];
  direction: "all" | "deposit" | "withdrawal" | "swap";
  base: string;
  percent: string;
  cap: string;
  noCap: boolean;
  currencies: string[];
  minAmount: string;
  maxAmount: string;
  commissionUserPct: number;
  commissionPlatformPct: number;
}
