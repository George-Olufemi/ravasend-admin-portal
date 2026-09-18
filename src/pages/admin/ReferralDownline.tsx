import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  GitMerge,
  Loader2,
} from "lucide-react";
import { referralAPI } from "@/lib/api";
import { PageHeader, PurpleBtn } from "@/components/admin/shared";
import {
  ReferralNode,
  buildTreeFromApi,
  countDownline,
  fmtCompact,
  getSearchParams,
  ReferralNodeRow,
} from "@/features/referral-downline";

const ReferralDownline = ({ isTab = false }: { isTab?: boolean }) => {
  const [query, setQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searched, setSearched] = useState(false);

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
    <div className={`flex-1 overflow-y-auto ${isTab ? "" : ""}`}>
      {!isTab && (
        <PageHeader
          title="Downline Explorer"
          subtitle="Follow the full referral chain for any user. Search by referral code, name, or email."
        />
      )}

      {/* Search Bar Box */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Search Referral Chain</p>
        <div className="flex flex-col sm:flex-row gap-3">
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
          <PurpleBtn onClick={() => handleSearch()} disabled={isLoading} className="justify-center">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
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
          <div className="bg-card border border-border rounded-xl p-3 sm:p-4 space-y-1 mb-6 overflow-x-auto">
            <ReferralNodeRow node={resultTree} depth={0} />
          </div>

          {/* Metric Summary Cards */}
          {(() => {
            const allChildren = resultTree.referrals.flatMap(r => [r, ...r.referrals]);
            const activeCount = allChildren.filter(r => r.user.status === "active").length;
            const totalVolume = allChildren.reduce((a, r) => a + r.user.volume, 0);
            const totalTxns = allChildren.reduce((a, r) => a + r.user.txns, 0);
            
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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