import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Search, Hash, Loader2 } from "lucide-react";
import { transactionAPI, Transaction } from "@/lib/api";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

function fmtN(num: number) {
  return new Intl.NumberFormat().format(num || 0);
}

function ngn(num: number) {
  return "₦" + fmtN(num);
}

function PageHeader({
  title,
  subtitle,
  search,
  onSearch,
  action,
}: {
  title: string;
  subtitle?: string;
  search?: string;
  onSearch?: (v: string) => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        {search !== undefined && onSearch && (
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
        )}
        {action}
      </div>
    </div>
  );
}

function PurpleBtn({
  children,
  onClick,
  className = "",
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <Button
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/[0.025] border border-border rounded-xl p-5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-[22px] font-bold text-foreground leading-none mt-1">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.025] border border-border rounded-xl overflow-x-auto w-full mb-4">
      <table className="w-full text-left border-collapse">{children}</table>
    </div>
  );
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-border bg-white/[0.02]">
        {cols.map((c, i) => (
          <th key={i} className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Pagination({ page, total, perPage, onChange }: { page: number; total: number; perPage: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-[12px] text-muted-foreground">
      <span>Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)} - {Math.min(page * perPage, total)} of {total}</span>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-white/5 transition-colors">Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-white/5 transition-colors">Next</button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const norm = (status || "").toUpperCase();
  if (["COMPLETED", "SUCCESS", "SUCCESSFUL", "DONE", "ACCEPTED"].includes(norm)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase">
        {status}
      </span>
    );
  }
  if (["FAILED", "REJECTED", "CANCELLED"].includes(norm)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/15 text-red-400 border border-red-500/20 uppercase">
        {status}
      </span>
    );
  }
  if (["PENDING", "PROCESSING"].includes(norm)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 uppercase">
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-zinc-500/15 text-zinc-400 border border-zinc-500/20 uppercase">
      {status || "UNKNOWN"}
    </span>
  );
}

function getTxnType(trx: Transaction): string {
  const src = (trx.source || "").toLowerCase();
  const curr = (trx.currency || "").toLowerCase();

  if (src.includes("crypto swap") || curr.includes("to ngn") || curr.includes("to usd")) {
    return "Crypto Swap";
  }
  if (src.includes("forex") || src.includes("monirate") || curr.includes("-") || curr.includes("usd to ngn")) {
    return "Cross-border";
  }
  if (src.includes("internal transfer") || src.includes("in-trf")) {
    return "Internal Transfer";
  }
  if (src.includes("bill") || src.includes("airtime") || src.includes("data")) {
    return "Bill Payment";
  }
  if (src.includes("bank transfer")) {
    if (trx.destinationAccountNumber || trx.destinationAccountName) {
      return "Bank Withdrawal";
    }
    return "Fiat Deposit";
  }
  if (src.includes("transfer received") || src.includes("wallet funding") || src.includes("convert paymentlink") || src.includes("deposit")) {
    return "Fiat Deposit";
  }
  if (src.includes("crypto deposit") || curr.includes("btc") || curr.includes("eth") || curr.includes("usdt") || curr.includes("usdc") || curr.includes("sol")) {
    return "Crypto Deposit";
  }
  if (src.includes("fee")) {
    return "Fee";
  }
  return trx.source || "Transaction";
}

const Transactions = () => {
  const [pg, setPg] = useState(1);
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const perPage = 8;

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: transactionAPI.getAll,
  });

  const { data: volumeData } = useQuery({
    queryKey: ["transaction-volume"],
    queryFn: transactionAPI.getTransactionVolume,
  });

  const { data: failedData } = useQuery({
    queryKey: ["failed-transactions"],
    queryFn: transactionAPI.getFailedTransaction,
  });

  const transactions: Transaction[] = useMemo(() => transactionsData?.data || [], [transactionsData]);

  const tabs = [
    "All",
    "Deposits",
    "Bank Withdrawals",
    "Internal Transfers",
    "Bill Payments",
    "Cross-border",
    "Crypto Swaps",
    "Fees",
  ];

  const isDeposit = (type: string) => ["Crypto Deposit", "Fiat Deposit"].includes(type);

  const typeStyle = (type: string) => {
    if (isDeposit(type)) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
    if (type === "Bank Withdrawal") return "bg-amber-500/15 text-amber-400 border-amber-500/20";
    if (type === "Internal Transfer") return "bg-sky-500/15 text-sky-400 border-sky-500/20";
    if (type === "Bill Payment") return "bg-orange-500/15 text-orange-400 border-orange-500/20";
    if (type === "Cross-border") return "bg-cyan-500/15 text-cyan-400 border-cyan-500/20";
    if (type === "Crypto Swap") return "bg-violet-500/15 text-violet-400 border-violet-500/20";
    if (type === "Fee") return "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
    return "bg-muted/15 text-muted-foreground border-border";
  };

  const tabFilter = (type: string) => {
    if (tab === "All") return true;
    if (tab === "Deposits") return ["Crypto Deposit", "Fiat Deposit"].includes(type);
    if (tab === "Bank Withdrawals") return type === "Bank Withdrawal";
    if (tab === "Internal Transfers") return type === "Internal Transfer";
    if (tab === "Bill Payments") return type === "Bill Payment";
    if (tab === "Cross-border") return type === "Cross-border";
    if (tab === "Crypto Swaps") return type === "Crypto Swap";
    if (tab === "Fees") return type === "Fee";
    return true;
  };

  const filtered = useMemo(() => {
    return transactions.filter((trx) => {
      const type = getTxnType(trx);
      if (!tabFilter(type)) return false;
      if (!search.trim()) return true;
      const lower = search.toLowerCase();
      const userName = trx.userId?.fullName || "";
      const id = trx._id || "";
      return (
        userName.toLowerCase().includes(lower) ||
        id.toLowerCase().includes(lower) ||
        type.toLowerCase().includes(lower) ||
        (trx.reference || "").toLowerCase().includes(lower)
      );
    });
  }, [transactions, tab, search]);

  const paged = useMemo(() => {
    return filtered.slice((pg - 1) * perPage, pg * perPage);
  }, [filtered, pg, perPage]);

  const renderDetails = (trx: Transaction, type: string) => {
    if (type === "Crypto Swap" || (trx.currency || "").toLowerCase().includes("to")) {
      const cryptoAmt = (trx as any).cryptoAmount;
      return (
        <div>
          <p className="text-[11px] font-mono font-bold text-violet-400">
            {cryptoAmt ? `${cryptoAmt} ` : ""}{trx.currency}
          </p>
          <p className="text-[9px] text-muted-foreground font-mono">Ref: {trx.reference?.slice(-12) || "-"}</p>
        </div>
      );
    }

    if (type === "Bank Withdrawal" || trx.destinationAccountName) {
      const bank = trx.destinationBankName || trx.destionationBankName || "Bank Transfer";
      return (
        <div>
          <p className="text-[11px] font-semibold text-foreground">{bank}</p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {trx.destinationAccountNumber || "-"} · {trx.destinationAccountName || "-"}
          </p>
        </div>
      );
    }

    if (type === "Cross-border" || (trx.currency || "").includes("-")) {
      const metadata = (trx as any).metadata;
      const creditDetails = metadata?.buyerCreditPaymentDetails;
      return (
        <div>
          <p className="text-[11px] font-semibold text-foreground">
            {creditDetails?.providerName || trx.destinationBankName || trx.destionationBankName || "Forex Transfer"}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {trx.currency} · {creditDetails?.accountName || trx.destinationAccountName || "-"}
          </p>
        </div>
      );
    }

    if (type === "Internal Transfer" || (trx.source || "").toLowerCase().includes("internal transfer")) {
      const recipientName = trx.source.includes("to")
        ? trx.source.replace("Internal Transfer to ", "")
        : trx.source.replace("Internal Transfer from ", "");
      return (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
            <Hash size={9} />{trx.reference?.slice(-8) || "TRANSFER"}
          </span>
          <span className="text-[10px] text-muted-foreground">{recipientName || trx.destination || "-"}</span>
        </div>
      );
    }

    if (type === "Fiat Deposit") {
      const senderBank = (trx as any).senderBankName;
      const senderName = (trx as any).senderAccountName;
      if (senderBank || senderName) {
        return (
          <div>
            <p className="text-[11px] font-semibold text-foreground">{senderBank || "Deposit"}</p>
            <p className="text-[10px] text-muted-foreground">{senderName || trx.reference}</p>
          </div>
        );
      }
      return (
        <div>
          <p className="text-[11px] font-semibold text-foreground">{trx.source || "Fiat Deposit"}</p>
          <p className="text-[10px] text-muted-foreground font-mono">Ref: {trx.reference?.slice(-12) || "-"}</p>
        </div>
      );
    }

    if (type === "Fee") {
      return <p className="text-[10px] text-muted-foreground font-mono">{trx.reference || "-"}</p>;
    }

    return (
      <div>
        <p className="text-[11px] font-semibold text-foreground">{trx.source || "Transaction"}</p>
        <p className="text-[10px] text-muted-foreground font-mono">Ref: {trx.reference?.slice(-12) || "-"}</p>
      </div>
    );
  };

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tabs.forEach((t) => {
      counts[t] = transactions.filter((trx) => {
        const type = getTxnType(trx);
        if (t === "All") return true;
        if (t === "Deposits") return ["Crypto Deposit", "Fiat Deposit"].includes(type);
        if (t === "Bank Withdrawals") return type === "Bank Withdrawal";
        if (t === "Internal Transfers") return type === "Internal Transfer";
        if (t === "Bill Payments") return type === "Bill Payment";
        if (t === "Cross-border") return type === "Cross-border";
        if (t === "Crypto Swaps") return type === "Crypto Swap";
        if (t === "Fees") return type === "Fee";
        return false;
      }).length;
    });
    return counts;
  }, [transactions]);

  const todayCount = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return transactions.filter((t) => (t.createdAt || "").startsWith(todayStr)).length;
  }, [transactions]);

  const totalVolume = Number(volumeData?.data?.totalAmount || 0);
  const failedAmount = Number(failedData?.data?.totalAmount || 0);

  const failedCount = useMemo(() => {
    return transactions.filter((t) => (t.status || "").toUpperCase() === "FAILED").length;
  }, [transactions]);

  const failureRate = transactions.length > 0 ? ((failedCount / transactions.length) * 100).toFixed(2) : "0.00";

  const handleDownloadCSV = () => {
    if (!transactions.length) return;

    const headers = [
      "Transaction ID",
      "Full Name",
      "Email",
      "Phone Number",
      "Type",
      "Source",
      "Amount (NGN)",
      "Currency",
      "Fee (NGN)",
      "Net Amount (NGN)",
      "Status",
      "Date",
    ];

    const rows = filtered.map((trx) => [
      trx._id,
      trx.userId?.fullName || "",
      trx.userId?.email || "",
      trx.userId?.phoneNumber || "",
      getTxnType(trx),
      trx.source || "",
      trx.amount || 0,
      trx.currency || "",
      trx.fee || 0,
      trx.netAmount || 0,
      trx.status || "",
      trx.createdAt || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-7">
      <PageHeader
        title="Transactions"
        subtitle="Every naira in, every naira out — in real time"
        search="Search by user, ID, type…"
        onSearch={(v) => {
          setSearch(v);
          setPg(1);
        }}
        action={
          <PurpleBtn onClick={handleDownloadCSV}>
            <Download size={13} /> Download CSV
          </PurpleBtn>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Transactions" value={fmtN(transactions.length)} />
        <StatCard label="Today" value={fmtN(todayCount)} sub="+18% vs yesterday" />
        <StatCard label="Volume" value={ngn(Math.round(totalVolume))} />
        <StatCard label="Failed" value={ngn(failedAmount)} sub={`${failureRate}% failure rate`} />
      </div>

      {/* Type filter tabs */}
      <div className="flex items-center gap-1 mb-5 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setPg(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${tab === t
                ? "text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground border border-border"
              }`}
            style={tab === t ? { background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" } : {}}
          >
            {t}
            <span className={`ml-1.5 text-[10px] ${tab === t ? "text-white/60" : "text-muted-foreground"}`}>
              {tabCounts[t] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <TableWrap>
        <THead cols={["Txn ID", "User", "Type", "Details", "Amount", "Fee", "Status", "Date"]} />
        <tbody className="divide-y divide-border">
          {isLoading ? (
            <tr>
              <td colSpan={8} className="px-5 py-12 text-center text-[12px] text-muted-foreground">
                <Loader2 className="animate-spin inline mr-2" size={14} /> Loading user transactions...
              </td>
            </tr>
          ) : paged.length > 0 ? (
            paged.map((t) => {
              const type = getTxnType(t);
              return (
                <tr key={t._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <code className="text-[11px] font-mono text-primary">ID: {t._id.slice(-6)}</code>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] font-semibold text-foreground max-w-[140px] truncate">
                    {t.userId?.fullName || "Unknown User"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${typeStyle(type)}`}>
                      {type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 max-w-[200px]">{renderDetails(t, type)}</td>
                  <td className="px-5 py-3.5">
                    <p
                      className={`text-[13px] font-mono font-bold whitespace-nowrap ${isDeposit(type)
                          ? "text-emerald-400"
                          : type === "Fee"
                            ? "text-zinc-400"
                            : type === "Internal Transfer"
                              ? "text-sky-400"
                              : "text-foreground"
                        }`}
                    >
                      {isDeposit(type) ? "+" : ""}{ngn(t.amount || 0)}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    {t.fee && t.fee > 0 ? (
                      <p className="text-[11px] font-mono text-amber-400">{ngn(t.fee)}</p>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-5 py-3.5 text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                    {t.createdAt ? format(new Date(t.createdAt), "dd/MM/yyyy HH:mm") : "-"}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={8} className="px-5 py-12 text-center text-[12px] text-muted-foreground">
                No transactions match.
              </td>
            </tr>
          )}
        </tbody>
      </TableWrap>

      <Pagination page={pg} total={filtered.length} perPage={perPage} onChange={setPg} />
    </div>
  );
};

export default Transactions;
