import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	Download,
	Search,
	X,
	ShieldCheck,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { auditsAPI, AuditRecord } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtN(num: number) {
	return new Intl.NumberFormat().format(num || 0);
}

function fmtTime(iso: string) {
	if (!iso) return "—";
	const d = new Date(iso);
	return d.toLocaleString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function getInitials(nameOrEmail: string) {
	if (!nameOrEmail) return "AD";
	if (nameOrEmail.includes(" ")) {
		const parts = nameOrEmail.split(" ");
		return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
	}
	return nameOrEmail.slice(0, 2).toUpperCase();
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

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
	return (
		<div className="bg-card border border-border/50 rounded-xl p-4 shadow-card">
			<p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">{label}</p>
			<p className="text-[24px] font-bold text-foreground leading-none">{value}</p>
			<p className="text-[10px] text-muted-foreground/70 mt-1">{sub}</p>
		</div>
	);
}

// ─── Main Audits Component ──────────────────────────────────────────────────

const Audits = () => {
	const [search, setSearch] = useState("");
	const [filterType, setFilterType] = useState("All");
	const [filterSev, setFilterSev] = useState("All");
	const [pg, setPg] = useState(1);
	const perPage = 10;

	const {
		data: auditsData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["audits"],
		queryFn: auditsAPI.getAll,
	});

	const ALL_AUDITS: AuditRecord[] = useMemo(() => auditsData?.data || [], [auditsData]);

	// Extract Categories dynamically
	const CATEGORIES = useMemo(() => {
		const cats = Array.from(
			new Set(ALL_AUDITS.map((a) => a.resourceType || a.featureName).filter(Boolean))
		);
		return ["All", ...cats];
	}, [ALL_AUDITS]);

	const SEVERITIES = ["All", "info", "warning", "critical"];

	const sevConfig: Record<string, { cls: string; label: string }> = {
		info: { cls: "bg-blue-500/15 text-blue-400 border-blue-500/20", label: "Info" },
		warning: { cls: "bg-amber-500/15 text-amber-400 border-amber-500/20", label: "Warning" },
		critical: { cls: "bg-red-500/15 text-red-400 border-red-500/20", label: "Critical" },
	};

	const catConfig: Record<string, string> = {
		Login: "bg-blue-500/10 text-blue-400 border-blue-500/20",
		"User Access Control": "bg-rose-500/10 text-rose-400 border-rose-500/20",
		"Access Control": "bg-rose-500/10 text-rose-400 border-rose-500/20",
		Fee: "bg-orange-500/10 text-orange-400 border-orange-500/20",
		Promo: "bg-pink-500/10 text-pink-400 border-pink-500/20",
		Users: "bg-violet-500/10 text-violet-400 border-violet-500/20",
		Transactions: "bg-blue-500/10 text-blue-400 border-blue-500/20",
		Withdrawals: "bg-red-500/10 text-red-400 border-red-500/20",
		Campaigns: "bg-teal-500/10 text-teal-400 border-teal-500/20",
		Competitions: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
	};

	const statusConfig: Record<string, string> = {
		SUCCESS: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
		FAILED: "bg-red-500/15 text-red-400 border-red-500/20",
	};

	// Filter audits
	const filtered = useMemo(() => {
		return ALL_AUDITS.filter((a) => {
			const adminName = typeof a.userId === "object" ? a.userId?.fullName || a.userId?.email || "" : "";
			const adminEmail = typeof a.userId === "object" ? a.userId?.email || "" : typeof a.userId === "string" ? a.userId : "";

			const matchSearch =
				!search ||
				[a.featureName, a.action, a.email, a.description, a.ipAddress, a.resourceType, adminName, adminEmail]
					.some((s) => (s || "").toLowerCase().includes(search.toLowerCase()));

			const categoryName = a.resourceType || a.featureName;
			const matchCat = filterType === "All" || categoryName === filterType;

			const normWarn = (a.warning || "info").toLowerCase();
			const sevKey = normWarn.includes("crit") ? "critical" : normWarn.includes("warn") ? "warning" : "info";
			const matchSev = filterSev === "All" || sevKey === filterSev;

			return matchSearch && matchCat && matchSev;
		});
	}, [ALL_AUDITS, search, filterType, filterSev]);

	useEffect(() => {
		setPg(1);
	}, [search, filterType, filterSev]);

	const totalPages = Math.ceil(filtered.length / perPage) || 1;
	const paged = useMemo(() => {
		return filtered.slice((pg - 1) * perPage, pg * perPage);
	}, [filtered, pg, perPage]);

	// Metrics
	const criticalCount = useMemo(() => {
		return ALL_AUDITS.filter((a) => (a.warning || "").toLowerCase().includes("crit")).length;
	}, [ALL_AUDITS]);

	const warningCount = useMemo(() => {
		return ALL_AUDITS.filter((a) => (a.warning || "").toLowerCase().includes("warn")).length;
	}, [ALL_AUDITS]);

	const uniqueAdmins = useMemo(() => {
		return new Set(
			ALL_AUDITS.map((a) => (typeof a.userId === "object" ? a.userId?.email || a.userId?._id : a.userId || a.email))
		).size;
	}, [ALL_AUDITS]);

	// CSV Export
	const downloadCSV = () => {
		if (!filtered.length) return;

		const headers = [
			"ID",
			"Feature Name",
			"Action",
			"Target Email",
			"Status",
			"Description",
			"Admin Name / Email",
			"IP Address",
			"Browser",
			"Device",
			"Resource Type",
			"Severity",
			"Created At",
		];

		const rows = filtered.map((a) => {
			const admin = typeof a.userId === "object" ? a.userId?.fullName || a.userId?.email : a.userId || "";
			return [
				a._id,
				`"${a.featureName || ""}"`,
				`"${a.action || ""}"`,
				`"${a.email || ""}"`,
				`"${a.status || ""}"`,
				`"${a.description || ""}"`,
				`"${admin}"`,
				a.ipAddress || "",
				a.browser || "",
				a.device || "",
				`"${a.resourceType || ""}"`,
				`"${a.warning || "info"}"`,
				a.createdAt,
			];
		});

		const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map((e) => e.join(",")).join("\n");
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute("download", search ? "filtered-audits.csv" : "audits.csv");
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (error) {
		return (
			<Card className="bg-gradient-card border-border/50">
				<CardContent className="pt-6">
					<div className="text-center text-destructive">
						Error loading audit logs: {(error as any)?.message || "Unknown error"}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Audit Log</h1>
					<p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
						Complete tamper-evident record of all admin actions on the platform
					</p>
				</div>

				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
					<div className="relative w-full sm:w-72">
						<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search by admin, action, target…"
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
					<PurpleBtn onClick={downloadCSV} disabled={filtered.length === 0}>
						<Download size={13} /> Export CSV
					</PurpleBtn>
				</div>
			</div>

			{/* Stats row */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
				<StatCard label="Total Events" value={fmtN(ALL_AUDITS.length)} sub="All time audit entries" />
				<StatCard label="Admins Active" value={String(uniqueAdmins)} sub="Logged this month" />
				<div className="bg-card border border-amber-500/20 rounded-xl p-4 shadow-card">
					<p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Warnings</p>
					<p className="text-[24px] font-bold text-amber-400 leading-none">{warningCount}</p>
					<p className="text-[10px] text-amber-400/70 mt-1">Actions needing review</p>
				</div>
				<div className="bg-card border border-red-500/20 rounded-xl p-4 shadow-card">
					<p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Critical</p>
					<p className="text-[24px] font-bold text-red-400 leading-none">{criticalCount}</p>
					<p className="text-[10px] text-red-400/70 mt-1">High-impact actions</p>
				</div>
			</div>

			{/* Filters */}
			<div className="flex items-center gap-3 flex-wrap">
				{/* {CATEGORIES.length > 1 && (
					<div className="flex items-center gap-1 bg-white/[0.03] border border-border rounded-xl p-1 overflow-x-auto max-w-full">
						{CATEGORIES.map((c) => (
							<button
								key={c}
								type="button"
								onClick={() => {
									setFilterType(c);
									setPg(1);
								}}
								className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${filterType === c ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
									}`}
								style={filterType === c ? { background: "linear-gradient(135deg,#7B3FE4,#5B2AB8)" } : {}}
							>
								{c}
							</button>
						))}
					</div>
				)} */}

				<div className="flex items-center gap-1 bg-white/[0.03] border border-border rounded-xl p-1 overflow-x-auto">
					{SEVERITIES.map((s) => (
						<button
							key={s}
							type="button"
							onClick={() => {
								setFilterSev(s);
								setPg(1);
							}}
							className={`px-3 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all ${filterSev === s ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
								}`}
							style={
								filterSev === s
									? {
										background:
											s === "critical"
												? "linear-gradient(135deg,#ef4444,#b91c1c)"
												: s === "warning"
													? "linear-gradient(135deg,#f59e0b,#d97706)"
													: "linear-gradient(135deg,#7B3FE4,#5B2AB8)",
									}
									: {}
							}
						>
							{s === "All" ? "All Severity" : s}
						</button>
					))}
				</div>

				{(filterType !== "All" || filterSev !== "All" || search) && (
					<button
						type="button"
						onClick={() => {
							setFilterType("All");
							setFilterSev("All");
							setSearch("");
							setPg(1);
						}}
						className="text-[11px] text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 border border-border rounded-xl"
					>
						Clear filters
					</button>
				)}

				<span className="ml-auto text-[11px] text-muted-foreground">{filtered.length} events</span>
			</div>

			{/* Timeline list */}
			<div className="space-y-2">
				{paged.map((a) => {
					const adminObj = typeof a.userId === "object" ? a.userId : null;
					const adminDisplay = adminObj?.fullName || adminObj?.email || "Admin User";
					const avatarText = getInitials(adminDisplay);
					const normWarn = (a.warning || "info").toLowerCase();
					const sevKey = normWarn.includes("crit") ? "critical" : normWarn.includes("warn") ? "warning" : "info";
					const sev = sevConfig[sevKey] || sevConfig.info;
					const catName = a.resourceType || a.featureName;
					const catCls = catConfig[catName] || "bg-violet-500/10 text-violet-400 border-violet-500/20";
					const statusCls = statusConfig[a.status || ""] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";

					return (
						<div
							key={a._id}
							className="bg-card border border-border rounded-xl px-5 py-4 hover:border-white/10 transition-all group shadow-card"
						>
							<div className="flex items-start gap-4">
								{/* Avatar */}
								<div
									className="size-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
									style={{ background: "linear-gradient(135deg,#7B3FE4,#5B2AB8)" }}
								>
									{avatarText}
								</div>

								{/* Content */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap mb-1">
										<span className="text-[12px] font-bold text-foreground">{a.featureName}</span>

										{a.action && (
											<span className="text-[9px] font-extrabold text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border uppercase tracking-wider">
												{a.action}
											</span>
										)}

										<span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${sev.cls}`}>
											{sev.label}
										</span>

										{/* {catName && (
											<span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${catCls}`}>
												{catName}
											</span>
										)} */}

										{a.status && (
											<span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${statusCls}`}>
												{a.status}
											</span>
										)}
									</div>

									<div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
										<span className="font-semibold text-foreground/80">{adminDisplay}</span>
										{a.email && (
											<>
												<span>·</span>
												<span className="font-mono text-primary/80">{a.email}</span>
											</>
										)}
										{a.description && (
											<>
												<span>·</span>
												<span>{a.description}</span>
											</>
										)}
									</div>
								</div>

								{/* Right side: time + IP */}
								<div className="shrink-0 text-right">
									<p className="text-[11px] text-muted-foreground whitespace-nowrap">{fmtTime(a.createdAt)}</p>
									<p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">{a.ipAddress}</p>
								</div>
							</div>
						</div>
					);
				})}

				{paged.length === 0 && (
					<div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-2xl">
						<div className="size-12 rounded-xl bg-white/[0.03] border border-border flex items-center justify-center mb-3">
							<ShieldCheck size={20} className="text-muted-foreground" />
						</div>
						<p className="text-[13px] font-semibold text-foreground">No audit entries found</p>
						<p className="text-[11px] text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
					</div>
				)}
			</div>

			{/* Pagination Controls */}
			{filtered.length > 0 && (
				<div className="flex items-center justify-between pt-2 border-t border-border/50 shrink-0">
					<span className="text-[12px] text-muted-foreground">
						Showing {Math.min((pg - 1) * perPage + 1, filtered.length)} -{" "}
						{Math.min(pg * perPage, filtered.length)} of {filtered.length} events
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
		</div>
	);
};

export default Audits;
