import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { transactionAPI, Transaction } from "@/lib/api";
import { format } from "date-fns";
import { fmtN, ngn } from "@/lib/formatters";
import {
  PageHeader,
  PurpleBtn,
  StatCard,
  TableWrap,
  THead,
  Pagination,
  StatusBadge,
} from "@/components/admin/shared";
import {
  TABS,
  getTxnType,
  isDeposit,
  getTypeStyle,
  downloadTransactionsCSV,
  renderDetails,
} from "@/features/transactions";

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

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TABS.forEach((t) => {
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
    downloadTransactionsCSV(filtered);
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
        {TABS.map((t) => (
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
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${getTypeStyle(type)}`}>
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
                    <StatusBadge status={t.status || "UNKNOWN"} />
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
