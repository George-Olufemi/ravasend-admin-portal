export interface ReferralUserNode {
  name: string;
  email: string;
  joined: string;
  status: "active" | "inactive" | "pending";
  volume: number;
  txns: number;
}

export interface ReferralNode {
  code: string;
  user: ReferralUserNode;
  referrals: ReferralNode[];
}
