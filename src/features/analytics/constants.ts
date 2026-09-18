import { formatNaira } from "./utils";

export const metricConfig = {
  volume: { label: "Transaction Volume", color: "#7B3FE4", format: formatNaira },
  signups: { label: "New Signups", color: "#34d399", format: (v: number) => v.toLocaleString() },
  fees: { label: "Fees Collected", color: "#f59e0b", format: formatNaira },
  txns: { label: "Transactions", color: "#60a5fa", format: (v: number) => v.toLocaleString() },
};

export const metricKeys: Array<"volume" | "signups" | "fees" | "txns"> = ["volume", "signups", "fees", "txns"];
