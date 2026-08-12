import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  GitMerge,
  ChevronRight,
  Loader2,
  Users,
  Wallet,
  Lock,
  Gift,
  DollarSign,
  Bitcoin,
  Mail,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { referralAPI } from "@/lib/api";

// ── Types ──
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

// ── Helpers ──
function countDownline(node: ReferralNode): number {
  return node.referrals.reduce((acc, child) => acc + 1 + countDownline(child), 0);
}

function fmtCompact(num: number): string {
  if (num >= 1_000_000) return `₦${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `₦${(num / 1_000).toFixed(1)}K`;
  return `₦${num.toLocaleString()}`;
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";
  return (
    <div
      className={`${
        size === "sm" ? "size-7 text-[10px]" : "size-9 text-[11px]"
      } rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isAct = status?.toLowerCase() === "active" || status?.toLowerCase() === "completed" || status?.toLowerCase() === "done";
  return (
    <span
      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
        isAct
          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
          : "bg-zinc-500/15 text-zinc-400 border-zinc-500/25"
      }`}
    >
      {isAct ? "Active" : "Inactive"}
    </span>
  );
}

function PurpleBtn({
  children,
  onClick,
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[12px] text-white shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
    >
      {children}
    </button>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      {subtitle && <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ── Node Row Component ──
function ReferralNodeRow({ node, depth = 0 }: { node: ReferralNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.referrals.length > 0;
  const totalDownline = countDownline(node);

  return (
    <div>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
          depth === 0
            ? "bg-primary/8 border border-primary/20 mb-1"
            : "hover:bg-white/[0.025] border border-transparent hover:border-border"
        }`}
        style={{ marginLeft: depth * 24 }}
        onClick={() => hasChildren && setExpanded((e) => !e)}
      >
        {hasChildren ? (
          <div className="size-5 rounded-md border border-border flex items-center justify-center text-muted-foreground shrink-0">
            <ChevronRight size={11} className={`transition-transform duration-150 ${expanded ? "rotate-90" : ""}`} />
          </div>
        ) : (
          <div className="size-5 shrink-0" />
        )}
        <Avatar name={node.user.name} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold text-foreground ${depth === 0 ? "text-[13px]" : "text-[12px]"}`}>{node.user.name}</p>
            <code className="text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">{node.code}</code>
            <StatusBadge status={node.user.status} />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {node.user.email} · Joined {node.user.joined}
          </p>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <div className="text-right">
            <p className="text-[12px] font-mono font-bold text-foreground">{fmtCompact(node.user.volume)}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">volume</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-mono font-bold text-foreground">{node.user.txns}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">txns</p>
          </div>
          {hasChildren && (
            <div className="text-right min-w-[36px]">
              <p className="text-[12px] font-mono font-bold text-primary">{totalDownline}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">downline</p>
            </div>
          )}
        </div>
      </div>
      {expanded && node.referrals.map((child) => <ReferralNodeRow key={child.code} node={child} depth={depth + 1} />)}
    </div>
  );
}

// ── Helper to convert API Response to ReferralNode tree ──
function buildTreeFromApi(apiData: any): ReferralNode {
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

const ReferralDownline = ({ isTab = false }: { isTab?: boolean }) => {
  const [query, setQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searched, setSearched] = useState(false);

  const getSearchParams = (search: string) => {
    if (!search) return {};
    if (search.includes("@")) return { email: search };
    if (/^[A-Z0-9]{6}$/i.test(search)) return { referralCode: search };
    return { username: search };
  };

  const {
    data: apiResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["referralDownline", activeSearch],
    queryFn: () => referralAPI.getAllReferralDownline(getSearchParams(activeSearch)),
    enabled: !!activeSearch,
    staleTime: 2 * 60 * 1000,
  });

  const handleSearch = (qText?: string) => {
    const searchTerm = (qText !== undefined ? qText : query).trim();
    if (!searchTerm) return;
    setSearched(true);
    setActiveSearch(searchTerm);
  };

  // Build result tree from API data only
  let resultTree: ReferralNode | null = null;
  if (apiResponse?.data?.user) {
    resultTree = buildTreeFromApi(apiResponse.data);
  }

  const rawApiData = apiResponse?.data;

  return (
    <div className="flex-1 overflow-y-auto p-7">
      {!isTab && (
        <PageHeader
          title="Downline Explorer"
          subtitle="Follow the full referral chain for any user. Search by referral code, name, or email."
        />
      )}

      {/* Search Bar Box */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Search Referral Chain</p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="Enter referral code (e.g. 38B753), name, or email…"
            />
          </div>
          <PurpleBtn onClick={() => handleSearch()} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" size={13} /> : <GitMerge size={13} />} Explore Chain
          </PurpleBtn>
        </div>
      </div>

      {isLoading && (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-[13px]">
          <Loader2 className="animate-spin inline-block mb-3 text-primary" size={24} />
          <p className="font-semibold text-foreground">Fetching referral downline data...</p>
        </div>
      )}

      {searched && !isLoading && resultTree && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[13px] font-bold text-foreground">
                Downline for <span className="text-primary font-mono">{resultTree.code}</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                {countDownline(resultTree)} users in total downline · click any row to expand
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 inline-block" /> Active
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-red-500 inline-block" /> Inactive
              </span>
            </div>
          </div>

          {/* Interactive Tree View */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-1 mb-6">
            <ReferralNodeRow node={resultTree} depth={0} />
          </div>

          {/* Metric Summary Cards */}
          {(() => {
            const allChildren = resultTree.referrals.flatMap(r => [r, ...r.referrals]);
            const activeCount = allChildren.filter(r => r.user.status === "active").length;
            const totalVolume = allChildren.reduce((a, r) => a + r.user.volume, 0);
            const totalTxns = allChildren.reduce((a, r) => a + r.user.txns, 0);
            
            return (
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Total Downline", value: String(countDownline(resultTree)) },
                  { label: "Active in Downline", value: String(activeCount) },
                  { label: "Downline Volume", value: fmtCompact(totalVolume) },
                  { label: "Downline Txns", value: String(totalTxns) },
                ].map((m) => (
                  <div key={m.label} className="bg-card border border-border rounded-xl p-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{m.label}</p>
                    <p className="text-[20px] font-bold text-foreground">{m.value}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Detailed Wallet & User Info from API */}
          {rawApiData && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Naira Wallet</p>
                <p className="text-[20px] font-mono font-bold text-emerald-400">
                  ₦{(rawApiData.wallet?.userId?.nairaWallet || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Dollar Wallet</p>
                <p className="text-[20px] font-mono font-bold text-cyan-400">
                  ${(rawApiData.wallet?.userId?.dollarWallet || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Referral Bonus</p>
                <p className="text-[20px] font-mono font-bold text-violet-400">
                  ₦{(rawApiData.wallet?.amount || 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {searched && !isLoading && !resultTree && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="size-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <GitMerge size={20} className="text-muted-foreground" />
          </div>
          <p className="text-[14px] font-bold text-foreground mb-1">No results found</p>
          <p className="text-[12px] text-muted-foreground">
            No referral chain found for <span className="font-mono text-foreground">"{query || activeSearch}"</span>. Try a different code, name, or email.
          </p>
        </div>
      )}

      {!searched && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <GitMerge size={20} className="text-primary" />
          </div>
          <p className="text-[14px] font-bold text-foreground mb-1">Search to explore a referral chain</p>
          <p className="text-[12px] text-muted-foreground max-w-sm mx-auto">
            Enter a referral code, user name, or email to see the full downline tree with volume, transaction count, and status at every level.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReferralDownline;