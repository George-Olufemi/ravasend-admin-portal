import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	Download,
	Search,
	X,
	ArrowUpRight,
	ArrowDownLeft,
	BarChart2,
	CheckCircle2,
	AlertOctagon,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { ledgerAPI, usersAPI, LedgerEntry, LedgerResponse, UserLedgerEntry } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function ngn(amount: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		maximumFractionDigits: 2,
	}).format(amount || 0);
}

function fmtN(num: number) {
	return new Intl.NumberFormat().format(num || 0);
}

const getUserId = (entry: LedgerEntry): string => {
	if (!entry?.userId) return "—";
	if (typeof entry.userId === "string") return entry.userId;
	return entry.userId._id || "—";
};

const getUserEmail = (entry: LedgerEntry): string => {
	if (!entry?.userId) return "—";
	if (typeof entry.userId === "object" && entry.userId.email) {
		return entry.userId.email;
	}
	return typeof entry.userId === "string" ? entry.userId : "—";
};

function TypeBadge({ type }: { type: string }) {
	const norm = (type || "").toUpperCase();
	const isDebit = norm.startsWith("DEBIT");
	if (isDebit) {
		return (
			<Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] gap-1 font-bold">
				<ArrowUpRight size={11} /> DEBIT
			</Badge>
		);
	}
	return (
		<Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] gap-1 font-bold">
			<ArrowDownLeft size={11} /> CREDIT
		</Badge>
	);
}

function PurpleBtn({
	children,
	onClick,
	disabled,
	className = "",
}: {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={`text-[12px] font-bold text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-glow ${className}`}
			style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
		>
			{children}
		</button>
	);
}

// ─── Main Ledger Component ──────────────────────────────────────────────────

const Ledger = () => {
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [selectedUserEmail, setSelectedUserEmail] = useState<string>("");
	const [pg, setPg] = useState(1);
	const [search, setSearch] = useState("");
	const perPage = 10;

	// ── Fetch Live Data ──────────────────────────────────────────────────────

	const {
		data: ledgerData,
		isLoading: isLedgerLoading,
		error: ledgerError,
	} = useQuery<LedgerResponse>({
		queryKey: ["ledger"],
		queryFn: ledgerAPI.getAll,
	});

	const { data: usersData } = useQuery({
		queryKey: ["users"],
		queryFn: usersAPI.getAll,
	});

	const { data: userLedgerData, isLoading: userLedgerLoading } = useQuery({
		queryKey: ["user-ledger", selectedUserId],
		queryFn: () => ledgerAPI.viewuserledger(selectedUserId!),
		enabled: !!selectedUserId,
	});

	const entries: LedgerEntry[] = useMemo(() => ledgerData?.data || [], [ledgerData]);
	const users = useMemo(() => usersData?.users || [], [usersData]);
	const userEntries: UserLedgerEntry[] = useMemo(() => userLedgerData?.data || [], [userLedgerData]);

	const totalCreditsIn = useMemo(() => {
		return entries
			.filter((e) => {
				const t = (e.type || "").toUpperCase();
				return (t.startsWith("CREDIT") || t.startsWith("DEPOSIT")) && (e.currency?.toUpperCase() === "NGN" || !e.currency);
			})
			.reduce((acc, e) => acc + (e.amount || 0), 0);
	}, [entries]);

	const totalCreditsOut = useMemo(() => {
		return entries
			.filter((e) => {
				const t = (e.type || "").toUpperCase();
				return t.startsWith("DEBIT") && (e.currency?.toUpperCase() === "NGN" || !e.currency);
			})
			.reduce((acc, e) => acc + (e.amount || 0), 0);
	}, [entries]);

	const netBalance = totalCreditsIn - totalCreditsOut;

	// Actual net balance = sum of user wallet balances
	const actualNetBalance = useMemo(() => {
		return users.reduce((acc, u) => acc + (u.nairaWallet ?? u.ngn ?? 0), 0);
	}, [users]);

	const reconciliationGap = netBalance - actualNetBalance;
	const isReconciled = Math.abs(reconciliationGap) < 1;

	const filtered = useMemo(() => {
		if (!search.trim()) return entries;
		const s = search.toLowerCase();
		return entries.filter((e) => {
			const email = getUserEmail(e).toLowerCase();
			const id = getUserId(e).toLowerCase();
			const type = (e.type || "").toLowerCase();
			const curr = (e.currency || "").toLowerCase();
			return email.includes(s) || id.includes(s) || type.includes(s) || curr.includes(s);
		});
	}, [entries, search]);

	useEffect(() => {
		setPg(1);
	}, [search]);

	const totalPages = Math.ceil(filtered.length / perPage) || 1;
	const paged = useMemo(() => {
		return filtered.slice((pg - 1) * perPage, pg * perPage);
	}, [filtered, pg, perPage]);

	// ── Per-User Summary ────────────────────────────────────────────────────

	const userCreditsIn = useMemo(() => {
		return userEntries
			.filter((e) => {
				const t = (e.type || "").toUpperCase();
				return (t.startsWith("CREDIT") || t.startsWith("DEPOSIT")) && (e.currency?.toUpperCase() === "NGN" || !e.currency);
			})
			.reduce((acc, e) => acc + (e.amount || 0), 0);
	}, [userEntries]);

	const userCreditsOut = useMemo(() => {
		return userEntries
			.filter((e) => {
				const t = (e.type || "").toUpperCase();
				return t.startsWith("DEBIT") && (e.currency?.toUpperCase() === "NGN" || !e.currency);
			})
			.reduce((acc, e) => acc + Math.abs(e.amount || 0), 0);
	}, [userEntries]);

	const userBalance = useMemo(() => {
		if (userEntries.length === 0) return 0;
		return userEntries[0]?.balanceAfter ?? 0;
	}, [userEntries]);

	// ── CSV Export ──────────────────────────────────────────────────────────

	const downloadCSV = () => {
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

	if (isLedgerLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (ledgerError) {
		return (
			<Card className="bg-gradient-card border-border/50">
				<CardContent className="pt-6">
					<div className="text-center text-destructive">
						Error loading ledger: {(ledgerError as any)?.message || "Unknown error"}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto p-4 sm:p-7 relative space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Ledger</h1>
					<p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
						View all platform ledger entries and balance movements
					</p>
				</div>
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
					<div className="relative w-full sm:w-72">
						<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search by email, type, ID, currency…"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full bg-secondary border border-border rounded-xl pl-9 pr-8 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
						/>
						{search && (
							<button
								type="button"
								onClick={() => setSearch("")}
								className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
							>
								<X size={14} />
							</button>
						)}
					</div>
					<PurpleBtn onClick={downloadCSV}>
						<Download size={13} /> Download CSV
					</PurpleBtn>
				</div>
			</div>

			{/* Platform-level Reconciliation Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
				{/* Total Credits In */}
				<div className="bg-card border border-border/50 rounded-xl p-5 shadow-card">
					<div className="flex items-center gap-2 mb-3">
						<div className="size-6 rounded-md bg-emerald-500/15 flex items-center justify-center">
							<ArrowDownLeft size={13} className="text-emerald-400" />
						</div>
						<p className="text-[11px] text-muted-foreground font-semibold">Total Credits In</p>
					</div>
					<p className="text-[20px] font-bold text-emerald-400 leading-none">{ngn(totalCreditsIn)}</p>
					<p className="text-[10px] text-muted-foreground mt-1.5">All CREDIT entries (NGN)</p>
				</div>

				{/* Total Credits Out */}
				<div className="bg-card border border-border/50 rounded-xl p-5 shadow-card">
					<div className="flex items-center gap-2 mb-3">
						<div className="size-6 rounded-md bg-red-500/15 flex items-center justify-center">
							<ArrowUpRight size={13} className="text-red-400" />
						</div>
						<p className="text-[11px] text-muted-foreground font-semibold">Total Credits Out</p>
					</div>
					<p className="text-[20px] font-bold text-red-400 leading-none">{ngn(totalCreditsOut)}</p>
					<p className="text-[10px] text-muted-foreground mt-1.5">All DEBIT entries (NGN)</p>
				</div>

				{/* Ledger Net */}
				<div
					className={`border rounded-xl p-5 shadow-card ${netBalance >= 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
						}`}
				>
					<div className="flex items-center gap-2 mb-3">
						<div className={`size-6 rounded-md flex items-center justify-center ${netBalance >= 0 ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
							<BarChart2 size={13} className={netBalance >= 0 ? "text-emerald-400" : "text-red-400"} />
						</div>
						<p className="text-[11px] text-muted-foreground font-semibold">Ledger Net</p>
					</div>
					<p className={`text-[20px] font-bold leading-none ${netBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
						{netBalance >= 0 ? "+" : ""}
						{ngn(netBalance)}
					</p>
					<p className="text-[10px] text-muted-foreground mt-1.5">All credits in minus all debits out</p>
				</div>

				{/* Total User Wallets / Reconciliation Status */}
				<div
					className={`border rounded-xl p-5 shadow-card ${isReconciled
							? "bg-primary/5 border-primary/20"
							: reconciliationGap < 0
								? "bg-red-500/5 border-red-500/20"
								: "bg-amber-500/5 border-amber-500/20"
						}`}
				>
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2">
							<div
								className={`size-6 rounded-md flex items-center justify-center ${isReconciled
										? "bg-primary/15"
										: reconciliationGap < 0
											? "bg-red-500/15"
											: "bg-amber-500/15"
									}`}
							>
								{isReconciled ? (
									<CheckCircle2 size={13} className="text-primary" />
								) : (
									<AlertOctagon size={13} className={reconciliationGap < 0 ? "text-red-400" : "text-amber-400"} />
								)}
							</div>
							<p className="text-[11px] text-muted-foreground font-semibold">Total User Wallets</p>
						</div>
						<span
							className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${isReconciled
									? "text-primary bg-primary/10 border-primary/20"
									: reconciliationGap < 0
										? "text-red-400 bg-red-500/10 border-red-500/20"
										: "text-amber-400 bg-amber-500/10 border-amber-500/20"
								}`}
						>
							{isReconciled ? "RECONCILED" : reconciliationGap < 0 ? "OVERPAID" : "SURPLUS"}
						</span>
					</div>
					<p
						className={`text-[20px] font-bold leading-none ${isReconciled ? "text-primary" : reconciliationGap < 0 ? "text-red-400" : "text-foreground"
							}`}
					>
						{ngn(actualNetBalance)}
					</p>
					<p className="text-[10px] text-muted-foreground mt-1.5">
						{isReconciled ? (
							"Matches ledger exactly — no discrepancy"
						) : reconciliationGap < 0 ? (
							<span className="text-red-400 font-semibold">
								Users hold {ngn(Math.abs(reconciliationGap))} more than ledger — investigate
							</span>
						) : (
							<span className="text-amber-400">
								Ledger is {ngn(reconciliationGap)} above wallet total — likely retained fees
							</span>
						)}
					</p>
				</div>
			</div>

			{/* Main Ledger Table Card */}
			<Card className="bg-gradient-card border-border/50 shadow-card flex-1 flex flex-col min-h-0">
				<CardContent className="flex-1 flex flex-col min-h-0 p-4 md:p-6 space-y-4 overflow-hidden">
					<div>
						<h2 className="text-[13px] font-bold text-foreground uppercase tracking-wider">All Ledger Entries</h2>
						<p className="text-[11px] text-muted-foreground mt-0.5">
							{fmtN(filtered.length)} entries · Click any row to drill into the user's history
						</p>
					</div>

					<div className="flex-1 overflow-x-auto w-full rounded-lg border border-border/50">
						<table className="w-full text-left text-[13px]">
							<thead className="bg-muted/30 text-muted-foreground text-[11px] font-semibold border-b border-border/50 uppercase tracking-wider">
								<tr>
									<th className="px-5 py-3">User</th>
									<th className="px-5 py-3">Type</th>
									<th className="px-5 py-3">Description</th>
									<th className="px-5 py-3">Amount</th>
									<th className="px-5 py-3">Balance Before</th>
									<th className="px-5 py-3">Balance After</th>
									<th className="px-5 py-3">Date</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/50">
								{paged.length === 0 ? (
									<tr>
										<td colSpan={7} className="text-center py-12 text-muted-foreground">
											No ledger entries found matching your search.
										</td>
									</tr>
								) : (
									paged.map((e) => {
										const uid = getUserId(e);
										const email = getUserEmail(e);
										const normType = (e.type || "").toUpperCase();
										const isDebit = normType.startsWith("DEBIT");

										return (
											<tr
												key={e._id}
												className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${selectedUserId === uid ? "bg-primary/10" : ""
													}`}
												onClick={() => {
													if (selectedUserId === uid) {
														setSelectedUserId(null);
													} else {
														setSelectedUserId(uid);
														setSelectedUserEmail(email);
													}
												}}
											>
												<td className="px-5 py-3.5">
													<p className="text-[12px] font-semibold text-foreground">{email}</p>
													<p className="text-[10px] text-muted-foreground font-mono">ID: {e._id?.slice(-8) || uid?.slice(-8)}</p>
												</td>
												<td className="px-5 py-3.5">
													<TypeBadge type={e.type} />
												</td>
												<td className="px-5 py-3.5 max-w-[260px]">
													<p className="text-[12px] text-muted-foreground truncate" title={e.type}>
														{e.type}
													</p>
												</td>
												<td className={`px-5 py-3.5 text-[13px] font-mono font-bold ${isDebit ? "text-red-400" : "text-emerald-400"}`}>
													{isDebit ? "−" : "+"}
													{e.currency === "USDC" ? `${e.amount} USDC` : ngn(e.amount)}
												</td>
												<td className="px-5 py-3.5 text-[12px] font-mono text-muted-foreground">
													{ngn(e.balanceBefore)}
												</td>
												<td className="px-5 py-3.5 text-[12px] font-mono text-muted-foreground">
													{ngn(e.balanceAfter)}
												</td>
												<td className="px-5 py-3.5 text-[12px] text-muted-foreground whitespace-nowrap">
													{e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>

					{/* Pagination controls */}
					{filtered.length > 0 && (
						<div className="flex items-center justify-between pt-2 border-t border-border/50 shrink-0">
							<span className="text-[12px] text-muted-foreground">
								Showing {Math.min((pg - 1) * perPage + 1, filtered.length)} -{" "}
								{Math.min(pg * perPage, filtered.length)} of {filtered.length} entries
							</span>
							<div className="flex items-center gap-2">
								<button
									type="button"
									disabled={pg === 1}
									onClick={() => setPg((p) => Math.max(1, p - 1))}
									className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
								>
									<ChevronLeft size={14} />
								</button>
								<span className="text-[12px] font-medium text-foreground">
									Page {pg} of {totalPages}
								</span>
								<button
									type="button"
									disabled={pg >= totalPages}
									onClick={() => setPg((p) => Math.min(totalPages, p + 1))}
									className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
								>
									<ChevronRight size={14} />
								</button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Per-user Detail Drawer Panel */}
			{selectedUserId && (
				<div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex justify-end" onClick={() => setSelectedUserId(null)}>
					<div
						className="h-full border-l border-border flex flex-col overflow-hidden w-full max-w-[420px] shadow-2xl animate-in slide-in-from-right duration-200"
						style={{ background: "#0F0D26" }}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header */}
						<div className="p-5 border-b border-border flex items-center justify-between shrink-0">
							<div>
								<p className="text-[12px] text-muted-foreground">Ledger for</p>
								<p className="text-[13px] font-bold text-primary mt-0.5">{selectedUserEmail}</p>
							</div>
							<button
								type="button"
								onClick={() => setSelectedUserId(null)}
								className="size-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
							>
								<X size={14} />
							</button>
						</div>

						{/* Per-user summary */}
						<div className="px-4 pt-4 pb-3 border-b border-border shrink-0 grid grid-cols-3 gap-2">
							<div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3">
								<p className="text-[9px] font-bold text-emerald-400/70 uppercase tracking-wider mb-1">Credits In</p>
								<p className="text-[13px] font-bold text-emerald-400">{ngn(userCreditsIn)}</p>
							</div>
							<div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3">
								<p className="text-[9px] font-bold text-red-400/70 uppercase tracking-wider mb-1">Credits Out</p>
								<p className="text-[13px] font-bold text-red-400">{ngn(userCreditsOut)}</p>
							</div>
							<div className="bg-primary/8 border border-primary/20 rounded-xl p-3">
								<p className="text-[9px] font-bold text-primary/70 uppercase tracking-wider mb-1">Balance</p>
								<p className="text-[13px] font-bold text-primary">{ngn(userBalance)}</p>
							</div>
						</div>

						{/* User ledger entries list */}
						<div className="flex-1 overflow-y-auto p-4 space-y-3">
							{userLedgerLoading ? (
								<div className="flex justify-center py-10">
									<LoadingSpinner />
								</div>
							) : userEntries.length === 0 ? (
								<div className="text-center text-muted-foreground py-10 text-[12px]">
									No ledger records found for this user.
								</div>
							) : (
								userEntries.map((entry) => {
									const normType = (entry.type || "").toUpperCase();
									const isDebit = normType.startsWith("DEBIT");

									return (
										<div key={entry._id} className="bg-card border border-border rounded-xl p-4">
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2">
													{isDebit ? (
														<ArrowUpRight size={14} className="text-red-400" />
													) : (
														<ArrowDownLeft size={14} className="text-emerald-400" />
													)}
													<span className={`text-[12px] font-bold ${isDebit ? "text-red-400" : "text-emerald-400"}`}>
														{isDebit ? "Debit" : "Credit"}
													</span>
												</div>
												<span className={`text-[14px] font-bold ${isDebit ? "text-red-400" : "text-emerald-400"}`}>
													{isDebit ? "−" : "+"}
													{entry.currency === "USDC" ? `${entry.amount} USDC` : ngn(Math.abs(entry.amount))}
												</span>
											</div>
											<p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{entry.type}</p>
											<div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/60 pt-2.5 mt-2">
												<span>Before: {ngn(entry.balanceBefore)}</span>
												<span>After: {ngn(entry.balanceAfter)}</span>
											</div>
											<p className="text-[10px] text-muted-foreground mt-1.5">
												{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}
											</p>
										</div>
									);
								})
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Ledger;

