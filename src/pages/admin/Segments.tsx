import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
	Plus,
	Trash2,
	Edit2,
	Target,
	Users,
	Megaphone,
	Activity,
	X,
	CheckCircle2,
} from "lucide-react";
import {
	campaignAPI,
	segmentAPI,
	CampaignItem,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Toast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function fmtN(num: number) {
	return new Intl.NumberFormat().format(num || 0);
}

function StatusBadge({ status }: { status: string }) {
	const normalized = (status || "").toLowerCase();
	if (normalized === "active" || normalized === "completed") {
		return (
			<Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 capitalize">
				{normalized}
			</Badge>
		);
	}
	if (normalized === "paused") {
		return (
			<Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 capitalize">
				Paused
			</Badge>
		);
	}
	return (
		<Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border capitalize">
			{status || "draft"}
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
		// <button
		// 	type="button"
		// 	onClick={onClick}
		// 	disabled={disabled}
		// 	className={`text-[12px] font-bold text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-glow ${className}`}
		// 	style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
		// >
		// 	{children}
		// </button>
		<Button onClick={onClick} disabled={disabled}>
			{children}
		</Button>
	);
}

function SlidePanel({
	open,
	onClose,
	title,
	subtitle,
	children,
	footer,
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	subtitle: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
}) {
	return (
		<Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
			<SheetContent side="right" className="w-full sm:max-w-[540px] overflow-y-auto bg-background p-6 flex flex-col justify-between">
				<div>
					<SheetHeader className="mb-4">
						<SheetTitle className="text-xl font-bold text-foreground">{title}</SheetTitle>
						<p className="text-[12px] text-muted-foreground">{subtitle}</p>
					</SheetHeader>
					{children}
				</div>
				{footer && <div className="pt-6 border-t border-border mt-6">{footer}</div>}
			</SheetContent>
		</Sheet>
	);
}

interface SegCriterion {
	id: string;
	field: string;
	operator: string;
	value: string;
	valueB?: string;
}

const SEG_FIELDS = [
	{ key: "deposit_count", label: "Deposit Count", type: "number" },
	{ key: "naira_balance", label: "Naira Wallet Balance", type: "currency" },
	{ key: "dollar_balance", label: "Dollar Wallet Balance", type: "currency" },
	{ key: "kyc_tier", label: "KYC Tier", type: "enum" },
	{ key: "referral_count", label: "Referral Count", type: "number" },
	{ key: "days_since_reg", label: "Days Since Registration", type: "number" },
	{ key: "days_since_login", label: "Days Since Last Login", type: "number" },
	{ key: "is_first_deposit", label: "Has Made First Deposit", type: "enum" },
];

const SEG_OPERATORS = ["=", "!=", ">", "<", ">=", "<=", "between", "is set", "is not set"];

const SEG_ENUM_VALUES: Record<string, string[]> = {
	kyc_tier: ["0", "1", "2", "3"],
	is_first_deposit: ["true", "false"],
};

const COLOR_PALETTE = ["#7B3FE4", "#F59E0B", "#4ADE80", "#F87171", "#A78BFA", "#60A5FA", "#34D399", "#FB923C"];

const Segments = () => {
	const navigate = useNavigate();
	const { toast } = useToast();
	const queryClient = useQueryClient();

	const [showBuilder, setShowBuilder] = useState(false);
	const [editSeg, setEditSeg] = useState<CampaignItem | null>(null);
	const [filter, setFilter] = useState<"all" | "active" | "draft">("all");
	const [newName, setNewName] = useState("");
	const [newDesc, setNewDesc] = useState("");
	const [logic, setLogic] = useState<"AND" | "OR">("AND");
	const [deletingSegmentId, setDeletingSegmentId] = useState<string | null>(null);
	const [criteria, setCriteria] = useState<SegCriterion[]>([
		{ id: "1", field: "deposit_count", operator: "=", value: "0" },
	]);

	const { data: campaignsResponse, isLoading: isCampaignsLoading } = useQuery({
		queryKey: ["campaigns"],
		queryFn: campaignAPI.getAllCampaigns,
	});

	const { data: totalActiveCampaignsData } = useQuery({
		queryKey: ["totalActiveCampaigns"],
		queryFn: campaignAPI.getTotalActiveCampaigns,
	});

	const rawCampaigns: CampaignItem[] = useMemo(() => campaignsResponse?.data || [], [campaignsResponse]);

	// Convert campaigns into segment items
	const segments = useMemo(() => {
		return rawCampaigns.map((c, i) => {
			const recipientsCount = c.recipients?.length || c.totalRecipients || 0;
			const color = COLOR_PALETTE[i % COLOR_PALETTE.length];
			const criteriaList = [
				`deposit_type = ${c.depositType || "first Deposit"}`,
				`delivery_strategy = ${c.deliveryStrategy || "drip-timebase"}`,
				// `channel = ${c.campaignType || "email"}`,
			];

			return {
				id: c._id,
				name: c.campaignName,
				description: "Targeted user bucket",
				criteria: criteriaList,
				logic: "AND",
				userCount: recipientsCount,
				status: c.status || "active",
				campaigns: 1,
				color: color,
				raw: c,
			};
		});
	}, [rawCampaigns]);

	const filtered = useMemo(() => {
		return segments.filter((s) => {
			if (filter === "all") return true;
			const normStatus = (s.status || "").toLowerCase();
			if (filter === "active") return normStatus === "active" || normStatus === "completed";
			if (filter === "draft") return normStatus === "paused" || normStatus === "draft";
			return true;
		});
	}, [segments, filter]);

	// Total metrics calculations
	const totalSegmentsCount = segments.length;
	const activeSegmentsCount = typeof totalActiveCampaignsData?.data === "number" ? totalActiveCampaignsData.data : segments.filter((s) => (s.status || "").toLowerCase() === "active").length;
	const totalUsersTargeted = segments.reduce((acc, s) => acc + s.userCount, 0);
	const linkedCampaignsCount = segments.filter((s) => s.userCount > 0).length;

	const createSegmentMutation = useMutation({
		mutationFn: segmentAPI.createSegment,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["campaigns"] });
			queryClient.invalidateQueries({ queryKey: ["totalCampaigns"] });
			toast({
				title: "Segment Created!",
				description: "New segment has been created successfully.",
			});
			setShowBuilder(false);
		},
		onError: (err: any) => {
			toast({
				variant: "destructive",
				title: "Creation Failed",
				description: err?.response?.data?.message || err.message || "Failed to create segment",
			});
		},
	});

	const deleteCampaignMutation = useMutation({
		mutationFn: campaignAPI.deleteCampaign,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["campaigns"] });
			queryClient.invalidateQueries({ queryKey: ["totalCampaigns"] });
			toast({
				title: "Segment Deleted",
				description: "Segment removed successfully.",
			});
			setDeletingSegmentId(null);
		},
		onError: (err: any) => {
			toast({
				variant: "destructive",
				title: "Delete Failed",
				description: err?.response?.data?.message || err.message || "Failed to delete segment",
			});
		},
	});

	const addCriterion = () =>
		setCriteria((p) => [...p, { id: String(Date.now()), field: "deposit_count", operator: ">", value: "" }]);

	const removeCriterion = (id: string) =>
		setCriteria((p) => p.filter((c) => c.id !== id));

	const updateCriterion = (id: string, patch: Partial<SegCriterion>) =>
		setCriteria((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c)));

	const criteriaToStrings = (cs: SegCriterion[]) =>
		cs.map((c) => (c.operator === "between" ? `${c.field} between ${c.value} – ${c.valueB ?? "?"}` : `${c.field} ${c.operator} ${c.value}`));

	const estimatedCount = Math.max(50, Math.floor(1800 - criteria.length * 180 + (logic === "OR" ? 400 : 0)));

	const openNew = () => {
		setEditSeg(null);
		setNewName("");
		setNewDesc("");
		setLogic("AND");
		setCriteria([{ id: "1", field: "deposit_count", operator: "=", value: "0" }]);
		setShowBuilder(true);
	};

	const openEdit = (segItem: (typeof segments)[0]) => {
		setEditSeg(segItem.raw);
		setNewName(segItem.name);
		setNewDesc(segItem.description);
		setLogic(segItem.logic as "AND" | "OR");
		setCriteria(
			segItem.criteria.map((c, i) => ({
				id: String(i),
				field: c.split(" ")[0] || "deposit_count",
				operator: c.split(" ")[1] || "=",
				value: c.split(" ").slice(2).join(" ") || "",
			}))
		);
		setShowBuilder(true);
	};

	const saveSegment = () => {
		if (!newName.trim()) {
			toast({
				variant: "destructive",
				title: "Missing Name",
				description: "Please provide a segment name.",
			});
			return;
		}

		const payload = {
			name: newName,
			description: newDesc,
			logic: logic,
			criteria: criteriaToStrings(criteria),
			userCount: estimatedCount,
		};

		createSegmentMutation.mutate(payload);
	};

	const handleDelete = (id: string) => {
		setDeletingSegmentId(id);
	};

	return (
		<div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Segments</h1>
					<p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
						Dynamic user buckets — define complex criteria to target exactly the right users
					</p>
				</div>
				<PurpleBtn onClick={openNew}>
					<Plus size={14} /> New Segment
				</PurpleBtn>
			</div>

			{/* Metric Cards Row */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
				{[
					{ label: "Total Segments", value: String(totalSegmentsCount), icon: <Target size={15} className="text-primary" /> },
					{ label: "Active", value: String(activeSegmentsCount), icon: <Activity size={15} className="text-emerald-400" /> },
					{ label: "Users Targeted", value: fmtN(totalUsersTargeted), icon: <Users size={15} className="text-violet-400" /> },
					{ label: "Linked to Campaigns", value: String(linkedCampaignsCount), icon: <Megaphone size={15} className="text-amber-400" /> },
				].map((k) => (
					<div key={k.label} className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-3 shadow-card">
						<div className="size-9 rounded-xl bg-white/5 border border-border flex items-center justify-center shrink-0">
							{k.icon}
						</div>
						<div>
							<p className="text-[10px] text-muted-foreground font-medium">{k.label}</p>
							<p className="text-[20px] font-bold text-foreground leading-none mt-0.5">{k.value}</p>
						</div>
					</div>
				))}
			</div>

			{/* Filter Pills */}
			<div className="flex items-center gap-2">
				{(["all", "active", "draft"] as const).map((f) => (
					<button
						key={f}
						type="button"
						onClick={() => setFilter(f)}
						className={`text-[12px] font-semibold px-4 py-2 rounded-lg capitalize transition-colors ${filter === f ? "text-white" : "text-muted-foreground border border-border hover:text-foreground"
							}`}
						style={filter === f ? { background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" } : {}}
					>
						{f === "all"
							? `All (${segments.length})`
							: `${f.charAt(0).toUpperCase() + f.slice(1)} (${segments.filter((s) => {
								const st = (s.status || "").toLowerCase();
								return f === "active" ? st === "active" || st === "completed" : st === "paused" || st === "draft";
							}).length})`}
					</button>
				))}
			</div>

			{/* Segments Cards Grid */}
			{isCampaignsLoading ? (
				<div className="flex items-center justify-center py-20">
					<LoadingSpinner size="lg" />
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{filtered.map((seg) => (
						<div
							key={seg.id}
							className="bg-card border border-border/50 rounded-2xl p-5 hover:border-white/20 transition-all group shadow-card"
							style={{ boxShadow: `0 0 0 1px ${seg.color}08 inset` }}
						>
							{/* Card header */}
							<div className="flex items-start justify-between gap-3 mb-4">
								<div className="flex items-start gap-3">
									<div
										className="size-10 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
										style={{ background: `${seg.color}18`, border: `1px solid ${seg.color}30` }}
									>
										<Target size={16} style={{ color: seg.color }} />
									</div>
									<div>
										<p className="text-[13px] font-bold text-foreground leading-tight">{seg.name}</p>
										<p className="text-[11px] text-muted-foreground mt-0.5">{seg.description}</p>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<StatusBadge status={seg.status} />
								</div>
							</div>

							{/* Criteria pills */}
							<div className="mb-4 space-y-1.5">
								{seg.criteria.map((c, i) => (
									<div key={i} className="flex items-center gap-2">
										{i > 0 && (
											<span
												className={`text-[8px] font-black px-2 py-0.5 rounded border w-8 text-center shrink-0 ${seg.logic === "AND"
													? "bg-primary/10 text-primary border-primary/25"
													: "bg-amber-500/10 text-amber-400 border-amber-500/25"
													}`}
											>
												{seg.logic}
											</span>
										)}
										{i === 0 && <span className="w-8 shrink-0" />}
										<code className="text-[10px] font-mono bg-secondary border border-border px-2.5 py-1 rounded-lg text-muted-foreground">
											{c}
										</code>
									</div>
								))}
							</div>

							{/* Stats + actions */}
							<div className="pt-4 border-t border-border/60">
								<div className="flex items-center justify-between">
									<div className="flex gap-5">
										<div>
											<p className="text-[20px] font-bold text-foreground leading-none">{fmtN(seg.userCount)}</p>
											<p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">matched users</p>
										</div>
										<div>
											<p className="text-[20px] font-bold text-foreground leading-none">{seg.campaigns}</p>
											<p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">campaigns</p>
										</div>
									</div>
									<div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
										<button
											type="button"
											onClick={() => openEdit(seg)}
											className="flex items-center gap-1.5 text-[11px] text-primary border border-primary/25 px-3 py-1.5 rounded-lg hover:bg-primary/10 font-semibold transition-colors"
										>
											<Edit2 size={10} /> Edit
										</button>
										<button
											type="button"
											onClick={() => navigate("/admin/campaign")}
											className="flex items-center gap-1.5 text-[11px] text-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-white/5 font-semibold transition-colors"
										>
											<Megaphone size={10} /> Campaign
										</button>
										<button
											type="button"
											onClick={() => handleDelete(seg.id)}
											className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/20 transition-colors"
										>
											<Trash2 size={12} />
										</button>
									</div>
								</div>
							</div>
						</div>
					))}
					{filtered.length === 0 && (
						<div className="col-span-2 py-20 text-center text-[13px] text-muted-foreground bg-card border border-border/50 rounded-2xl">
							<Target size={28} className="mx-auto mb-3 text-muted-foreground/30" />
							No segments found. Click "New Segment" to create one.
						</div>
					)}
				</div>
			)}

			{/* Builder Slide Panel */}
			<SlidePanel
				open={showBuilder}
				onClose={() => setShowBuilder(false)}
				title={editSeg ? "Edit Segment" : "New Segment"}
				subtitle="Define criteria with AND/OR logic to dynamically match users"
				footer={
					<div className="flex gap-3">
						<PurpleBtn onClick={saveSegment} disabled={createSegmentMutation.isPending}>
							{createSegmentMutation.isPending ? (
								<LoadingSpinner size="sm" />
							) : editSeg ? (
								"Save Changes"
							) : (
								"Create Segment"
							)}
						</PurpleBtn>
						<button
							type="button"
							onClick={() => setShowBuilder(false)}
							className="flex-1 border border-border text-muted-foreground text-[13px] rounded-xl hover:text-foreground hover:bg-white/5 transition-colors"
						>
							Cancel
						</button>
					</div>
				}
			>
				<div className="space-y-5">
					<div>
						<label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">
							Segment Name <span className="text-red-400">*</span>
						</label>
						<input
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
							placeholder="e.g. New Users — No First Deposit"
						/>
					</div>
					<div>
						<label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Description</label>
						<textarea
							value={newDesc}
							onChange={(e) => setNewDesc(e.target.value)}
							className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none h-16"
							placeholder="What does this segment represent?"
						/>
					</div>

					{/* Logic toggle */}
					<div>
						<label className="text-[11px] text-muted-foreground font-semibold block mb-2">Condition Logic</label>
						<div className="flex gap-2">
							{(["AND", "OR"] as const).map((l) => (
								<button
									key={l}
									type="button"
									onClick={() => setLogic(l)}
									className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border transition-all ${logic === l ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
										}`}
								>
									{l === "AND" ? "AND — All must match" : "OR — Any must match"}
								</button>
							))}
						</div>
					</div>

					{/* Criteria rows */}
					<div>
						<div className="flex items-center justify-between mb-2.5">
							<label className="text-[11px] text-muted-foreground font-semibold">Conditions ({criteria.length})</label>
							<button
								type="button"
								onClick={addCriterion}
								className="flex items-center gap-1 text-[11px] text-primary font-semibold hover:text-primary/80 transition-colors"
							>
								<Plus size={11} /> Add condition
							</button>
						</div>
						<div className="space-y-2">
							{criteria.map((c, i) => {
								const fieldDef = SEG_FIELDS.find((f) => f.key === c.field);
								const isEnum = fieldDef?.type === "enum";
								const enumVals = isEnum ? SEG_ENUM_VALUES[c.field] || [] : [];
								const isBetween = c.operator === "between";
								const noValue = c.operator === "is set" || c.operator === "is not set";
								return (
									<div key={c.id}>
										{i > 0 && (
											<div className="flex items-center gap-2 my-1.5">
												<div className="flex-1 h-px bg-border/50" />
												<span
													className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${logic === "AND"
														? "bg-primary/10 text-primary border-primary/25"
														: "bg-amber-500/10 text-amber-400 border-amber-500/25"
														}`}
												>
													{logic}
												</span>
												<div className="flex-1 h-px bg-border/50" />
											</div>
										)}
										<div className="bg-secondary/60 border border-border rounded-xl p-3 flex items-center gap-2 flex-wrap">
											{/* Field selector */}
											<select
												value={c.field}
												onChange={(e) => updateCriterion(c.id, { field: e.target.value, operator: "=", value: "" })}
												className="flex-1 min-w-[140px] bg-background border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
											>
												{SEG_FIELDS.map((f) => (
													<option key={f.key} value={f.key}>
														{f.label}
													</option>
												))}
											</select>
											{/* Operator */}
											<select
												value={c.operator}
												onChange={(e) => updateCriterion(c.id, { operator: e.target.value })}
												className="w-28 bg-background border border-border rounded-lg px-2.5 py-2 text-[12px] text-primary font-bold focus:outline-none focus:border-primary/50"
											>
												{SEG_OPERATORS.map((op) => (
													<option key={op}>{op}</option>
												))}
											</select>
											{/* Value */}
											{!noValue &&
												(isEnum ? (
													<select
														value={c.value}
														onChange={(e) => updateCriterion(c.id, { value: e.target.value })}
														className="flex-1 min-w-[100px] bg-background border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
													>
														{enumVals.map((v) => (
															<option key={v}>{v}</option>
														))}
													</select>
												) : (
													<input
														value={c.value}
														onChange={(e) => updateCriterion(c.id, { value: e.target.value })}
														placeholder={fieldDef?.type === "currency" ? "e.g. 5000" : "Value"}
														className="flex-1 min-w-[80px] bg-background border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground font-mono focus:outline-none focus:border-primary/50"
													/>
												))}
											{isBetween && !noValue && (
												<>
													<span className="text-[11px] text-muted-foreground shrink-0">and</span>
													<input
														value={c.valueB ?? ""}
														onChange={(e) => updateCriterion(c.id, { valueB: e.target.value })}
														placeholder="Max"
														className="w-20 bg-background border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground font-mono focus:outline-none focus:border-primary/50"
													/>
												</>
											)}
											<button
												type="button"
												onClick={() => removeCriterion(c.id)}
												disabled={criteria.length === 1}
												className="size-7 rounded-lg border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/20 flex items-center justify-center transition-colors disabled:opacity-30 shrink-0"
											>
												<Trash2 size={11} />
											</button>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Live estimate */}
					<div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/15 rounded-xl">
						<div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
							<Users size={16} className="text-primary" />
						</div>
						<div>
							<p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Estimated match</p>
							<p className="text-[24px] font-black text-primary leading-none">~{fmtN(estimatedCount)}</p>
							<p className="text-[10px] text-muted-foreground">users match these criteria</p>
						</div>
						<div className="ml-auto text-right">
							<p className="text-[10px] text-muted-foreground">of total users</p>
							<p className="text-[16px] font-bold text-foreground">{Math.round((estimatedCount / 15847) * 100)}%</p>
						</div>
					</div>
				</div>
			</SlidePanel>

			{/* Delete Confirmation Modal Dialog */}
			<Dialog open={!!deletingSegmentId} onOpenChange={(open) => { if (!open) setDeletingSegmentId(null); }}>
				<DialogContent className="sm:max-w-md bg-card border border-border">
					<DialogHeader>
						<DialogTitle className="text-lg font-bold text-foreground">Delete Segment</DialogTitle>
					</DialogHeader>
					<div className="py-2 text-[13px] text-muted-foreground">
						Are you sure you want to delete this segment? This action cannot be undone.
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						<button
							type="button"
							onClick={() => setDeletingSegmentId(null)}
							disabled={deleteCampaignMutation.isPending}
							className="px-4 py-2 text-[12px] font-semibold border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={() => {
								if (deletingSegmentId) {
									deleteCampaignMutation.mutate(deletingSegmentId);
								}
							}}
							disabled={deleteCampaignMutation.isPending}
							className="px-4 py-2 text-[12px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
						>
							{deleteCampaignMutation.isPending ? <LoadingSpinner size="sm" /> : "Delete Segment"}
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default Segments;