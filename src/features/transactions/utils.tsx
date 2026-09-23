import React from "react";
import { Transaction } from "@/lib/api";
import { Hash } from "lucide-react";
import { fmtN, ngn } from "@/lib/formatters";

export const getTxnType = (trx: Transaction): string => {
  const src = (trx.source || "").toLowerCase();
  const curr = (trx.currency || "").toLowerCase();
  const rawType = (trx.type || "").toLowerCase();

  // Crypto Deposit checks first
  if (
    src.includes("crypto deposit") ||
    (src.includes("crypto") && src.includes("deposit")) ||
    rawType === "crypto deposit" ||
    rawType.includes("crypto deposit")
  ) {
    return "Crypto Deposit";
  }

  if (src.includes("crypto swap") || curr.includes("to ngn") || curr.includes("to usd") || rawType.includes("swap")) {
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
    if (["btc", "eth", "usdt", "usdc", "sol", "trx", "bnb", "matic", "xrp", "avax"].includes(curr)) {
      return "Crypto Deposit";
    }
    return "Fiat Deposit";
  }
  if (["btc", "eth", "usdt", "usdc", "sol", "trx", "bnb", "matic", "xrp", "avax"].includes(curr)) {
    return "Crypto Deposit";
  }
  if (src.includes("fee")) {
    return "Fee";
  }
  return trx.source || "Transaction";
};

export const isDeposit = (type: string) => ["Crypto Deposit", "Fiat Deposit"].includes(type);

export const formatTxnAmount = (trx: Transaction, type: string): string => {
  const amt = trx.amount || 0;
  const rawCurr = (trx.currency || "").trim();
  const currUpper = rawCurr.toUpperCase();
  const srcLower = (trx.source || "").toLowerCase();

  const cryptoCoins = ["USDT", "USDC", "BTC", "ETH", "TRX", "SOL", "BNB", "MATIC", "XRP", "AVAX"];
  const isCryptoCurrency = cryptoCoins.includes(currUpper) || srcLower.includes("crypto");

  const sign = isDeposit(type) ? "+" : "";

  // If it's a crypto deposit or crypto currency (not NGN)
  if (type === "Crypto Deposit" || isCryptoCurrency) {
    if (rawCurr && currUpper !== "NGN") {
      const formattedNum = typeof amt === "number" ? fmtN(amt) : amt;
      return `${sign}${formattedNum} ${rawCurr}`;
    }
  }

  // Default NGN or empty currency
  if (!rawCurr || currUpper === "NGN") {
    return `${sign}${ngn(Number(amt) || 0)}`;
  }

  // Other currencies (USD, GBP, EUR)
  const formattedNum = typeof amt === "number" ? fmtN(amt) : amt;
  return `${sign}${formattedNum} ${rawCurr}`;
};

export const formatTxnFee = (trx: Transaction): string => {
  const fee = trx.fee || 0;
  if (!fee) return "—";
  const rawCurr = (trx.currency || "").trim().toUpperCase();
  const cryptoCoins = ["USDT", "USDC", "BTC", "ETH", "TRX", "SOL", "BNB", "MATIC", "XRP", "AVAX"];
  if (cryptoCoins.includes(rawCurr)) {
    return `${fmtN(fee)} ${rawCurr}`;
  }
  return ngn(fee);
};

export const getTypeStyle = (type: string) => {
  if (isDeposit(type)) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  if (type === "Bank Withdrawal") return "bg-amber-500/15 text-amber-400 border-amber-500/20";
  if (type === "Internal Transfer") return "bg-sky-500/15 text-sky-400 border-sky-500/20";
  if (type === "Bill Payment") return "bg-orange-500/15 text-orange-400 border-orange-500/20";
  if (type === "Cross-border") return "bg-cyan-500/15 text-cyan-400 border-cyan-500/20";
  if (type === "Crypto Swap") return "bg-violet-500/15 text-violet-400 border-violet-500/20";
  if (type === "Fee") return "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
  return "bg-muted/15 text-muted-foreground border-border";
};

export const downloadTransactionsCSV = (filtered: Transaction[]) => {
  if (!filtered.length) return;

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

export const renderDetails = (trx: Transaction, type: string) => {
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
