import React, { useState } from "react";
import { Download, Search, Loader2 } from "lucide-react";
import { ReferralDetailRecord } from "@/lib/api";
import { Page } from "../types";
import { PurpleBtn, StatCard, TableWrap, THead, Pagination } from "./shared";

export function ReferralDetailsPage({
  setPage,
  detailsData,
  isLoading,
  exportCsv,
}: {
  setPage: (p: Page) => void;
  detailsData?: ReferralDetailRecord[];
  isLoading?: boolean;
  exportCsv?: () => void;
}) {
  const [pg, setPg] = useState(1);
  const [search, setSearch] = useState("");
  const perPage = 8;

  const rows = detailsData?.map((d) => ({
    referred: d.user?.fullName || "Unknown User",
    rEmail: d.user?.email || "-",
    rPhone: d.user?.phoneNumber || "-",
    by: d.referredBy?.fullName || "",
    bEmail: d.referredBy?.email || "",
    stage: d.type || "welcome_bonus",
    amount: d.amount || 0,
    date: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
  })) || [];

  const REFERRAL_TABS: { label: string; page: Page }[] = [
    { label: "Overview", page: "referral-overview" },
    { label: "User Details", page: "referral-details" },
    { label: "Downline Explorer", page: "referral-explorer" },
  ];

  const STAGE_BADGE: Record<string, string> = {
    welcome_bonus: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    invite_reward: "bg-violet-500/15 text-violet-400 border-violet-500/20",
    referral: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  };
  const STAGE_LABEL: Record<string, string> = {
    welcome_bonus: "Welcome Bonus",
    invite_reward: "Invite Reward",
    referral: "Referral",
  };

  const filtered = rows.filter((r) => !search || 
    r.referred.toLowerCase().includes(search.toLowerCase()) || 
    r.rEmail.toLowerCase().includes(search.toLowerCase()) || 
    r.by.toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice((pg - 1) * perPage, pg * perPage);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Referral Program</h1>
        <PurpleBtn size="sm" onClick={exportCsv}><Download size={12} /> Export CSV</PurpleBtn>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground mb-6">Track every invite, signup, and reward across your network.</p>
      <div className="flex items-center gap-1 mb-7 bg-white/[0.03] border border-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
        {REFERRAL_TABS.map((t) => (
          <button key={t.page} onClick={() => setPage(t.page)}
            className={`px-4 sm:px-5 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all ${t.page === "referral-details" ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            style={t.page === "referral-details" ? { background: "linear-gradient(135deg,#7B3FE4,#5B2AB8)" } : {}}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Referral Records" value={String(rows.length)} sub="Total events logged" />
        <StatCard label="Total Rewards" value={`₦${rows.reduce((a, r) => a + r.amount, 0).toFixed(2)}`} sub="Combined payout amount" />
        <StatCard label="Referral Linked" value={String(rows.filter((r) => r.by).length)} sub="Records with referrer" />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-border rounded-xl px-3.5 py-2.5">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPg(1); }} placeholder="Search by name or email…"
            className="bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none flex-1" />
        </div>
      </div>
      <TableWrap>
        <THead cols={["Referred User", "Referred By", "Stage", "Reward", "Date"]} />
        <tbody className="divide-y divide-border">
          {isLoading ? (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-[12px] text-muted-foreground">
                <Loader2 className="animate-spin inline mr-2" size={14} /> Loading referral user details...
              </td>
            </tr>
          ) : paged.length > 0 ? (
            paged.map((r, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}>
                      {r.referred.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">{r.referred}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{r.rEmail}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {r.by
                    ? <div><p className="text-[12px] font-semibold text-foreground">{r.by}</p><p className="text-[10px] text-muted-foreground">{r.bEmail}</p></div>
                    : <span className="text-[11px] text-muted-foreground italic">Organic signup</span>}
                </td>
                <td className="px-5 py-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STAGE_BADGE[r.stage] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"}`}>
                    {STAGE_LABEL[r.stage] || r.stage}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[13px] font-mono font-bold text-emerald-400">+₦{r.amount.toFixed(2)}</span>
                </td>
                <td className="px-5 py-4 text-[11px] text-muted-foreground">{r.date}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-[12px] text-muted-foreground">
                No referral details available
              </td>
            </tr>
          )}
        </tbody>
      </TableWrap>
      <Pagination page={pg} total={filtered.length} perPage={perPage} onChange={setPg} />
    </div>
  );
}
