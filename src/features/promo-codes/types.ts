export interface PromoCode {
  id?: string;
  code: string;
  tier: "premium" | "standard";
  rewardAmt: string;
  description: string;
  minTxn: string;
  segment?: string | null;
  uses: number;
  limit: number | null;
  expires: string;
  status: "active" | "inactive";
}
