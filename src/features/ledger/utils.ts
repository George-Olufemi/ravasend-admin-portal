import { LedgerEntry } from "@/lib/api";
import { ArrowUpRight, ArrowDownLeft, Repeat } from "lucide-react";

export const getUserId = (entry: LedgerEntry): string => {
	if (!entry?.userId) return "—";
	if (typeof entry.userId === "string") return entry.userId;
	return entry.userId._id || "—";
};

export const getUserEmail = (entry: LedgerEntry): string => {
	if (!entry?.userId) return "—";
	if (typeof entry.userId === "object" && entry.userId.email) {
		return entry.userId.email;
	}
	return typeof entry.userId === "string" ? entry.userId : "—";
};

export function getTypeDetails(type?: string, description?: string) {
	const normType = (type || "").toUpperCase();
	const normDesc = (description || "").toUpperCase();

	if (normType.includes("SWAP") || normDesc.includes("SWAP") || normDesc.includes("CONVERTED")) {
		return {
			category: "SWAP" as const,
			label: normType.includes("SWAP") ? normType : "SWAP",
			badgeClass: "bg-violet-500/10 text-violet-400 border-violet-500/20",
			textClass: "text-violet-400",
			prefix: "⇄",
			icon: Repeat,
		};
	}

	if (normType.includes("DEBIT") || normDesc.startsWith("DEBIT")) {
		return {
			category: "DEBIT" as const,
			label: "DEBIT",
			badgeClass: "bg-red-500/10 text-red-400 border-red-500/20",
			textClass: "text-red-400",
			prefix: "−",
			icon: ArrowUpRight,
		};
	}

	if (normType.includes("DEPOSIT")) {
		return {
			category: "DEPOSIT" as const,
			label: "DEPOSIT",
			badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
			textClass: "text-emerald-400",
			prefix: "+",
			icon: ArrowDownLeft,
		};
	}

	// Default CREDIT
	return {
		category: "CREDIT" as const,
		label: normType.startsWith("CREDIT") ? normType : "CREDIT",
		badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
		textClass: "text-emerald-400",
		prefix: "+",
		icon: ArrowDownLeft,
	};
}

export const downloadLedgerCSV = (filtered: LedgerEntry[], search: string) => {
	if (!filtered.length) return;

	const headers = [
		"ID",
		"User Email",
		"User ID",
		"Type",
		"Amount",
		"Currency",
		"Balance Before",
		"Balance After",
		"Created At",
	];

	const rows = filtered.map((e) => [
		e._id,
		`"${getUserEmail(e)}"`,
		`"${getUserId(e)}"`,
		`"${e.type}"`,
		e.amount,
		e.currency || "NGN",
		e.balanceBefore,
		e.balanceAfter,
		e.createdAt,
	]);

	const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map((row) => row.join(",")).join("\n");
	const encodedUri = encodeURI(csvContent);
	const link = document.createElement("a");
	link.setAttribute("href", encodedUri);
	link.setAttribute("download", search ? "filtered-ledger.csv" : "ledger.csv");
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};
