import { ReferralNode } from "./types";

export function countDownline(node: ReferralNode): number {
  return node.referrals.reduce((acc, child) => acc + 1 + countDownline(child), 0);
}

export function fmtCompact(num: number): string {
  if (num >= 1_000_000) return `₦${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `₦${(num / 1_000).toFixed(1)}K`;
  return `₦${num.toLocaleString()}`;
}

export function buildTreeFromApi(apiData: any): ReferralNode {
  const u = apiData.user;
  const w = apiData.wallet;
  const invitedList = apiData.invitedUsers || [];
  const txnsList = apiData.transactions || [];

  const totalNairaVal = w?.userId?.nairaWallet || w?.amount || 0;
  const totalTxnCount = txnsList.length;

  const children: ReferralNode[] = invitedList.map((inv: any) => {
    const invUser = inv.userId || {};
    return {
      code: (invUser._id || inv._id || "").slice(-6).toUpperCase(),
      user: {
        name: invUser.fullName || "Invited User",
        email: invUser.email || "-",
        joined: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Recently",
        status: invUser.status || "pending",
        volume: inv.lockedAmount || inv.amount || 0,
        txns: inv.amount > 0 ? 1 : 0,
      },
      referrals: [],
    };
  });

  return {
    code: u?.referralCode || u?.username || "REF-CODE",
    user: {
      name: u?.fullName || "User",
      email: u?.email || "-",
      joined: u?.createdAt ? new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Recently",
      status: u?.status || "pending",
      volume: totalNairaVal,
      txns: totalTxnCount,
    },
    referrals: children,
  };
}

export const getSearchParams = (search: string) => {
  if (!search) return {};
  if (search.includes("@")) return { email: search };
  if (/^[A-Z0-9]{6}$/i.test(search)) return { referralCode: search };
  return { username: search };
};
