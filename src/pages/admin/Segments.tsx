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
	Mail,
	Link2,
	Unlink,
} from "lucide-react";
import {
	segmentAPI,
	SegmentItem,
	CreateSegmentPayload,
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

function LinkedBadge({ isLinked }: { isLinked: boolean }) {
	if (isLinked) {
		return (
			<Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
				<Link2 size={11} /> Linked to Campaign
			</Badge>
		);
	}
	return (
		<Badge variant="outline" className="bg-muted/40 text-muted-foreground border-border gap-1">
			<Unlink size={11} /> Not Linked
		</Badge>
	);
}

function PurpleBtn({
	children,
	onClick,
	disabled,
}: {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
}) {
	return (
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

const COLOR_PALETTE = ["#7B3FE4", "#F59E0B", "#4ADE80", "#F87171", "#A78BFA", "#60A5FA", "#34D399", "#FB923C"];

interface Criterion {
	id: string;
	field: string;
	operator: string;
	value: string;
	valueB?: string;
}

const SEG_FIELDS = [
	{ key: "kycLevel", label: "KYC Level", type: "enum" },
	{ key: "tier", label: "Tier / Level", type: "enum" },
	{ key: "status", label: "Account Status", type: "enum" },
	{ key: "balance", label: "Wallet Balance ($)", type: "currency" },
	{ key: "totalDeposits", label: "Total Deposits ($)", type: "currency" },
	{ key: "createdDays", label: "Days Since Signup", type: "number" },
];

const SEG_ENUM_VALUES: Record<string, string[]> = {
	kycLevel: ["0", "1", "2", "3"],
	tier: ["Tier 1", "Tier 2", "Tier 3", "VIP"],
	status: ["Active", "Inactive", "Suspended", "Pending"],
};

const SEG_OPERATORS = ["=", "!=", ">", "<", ">=", "<=", "between", "is set", "is not set"];

const Segments = () => {
	const navigate = useNavigate();
	const { toast } = useToast();
	const queryClient = useQueryClient();

	const [showBuilder, setShowBuilder] = useState(false);
	const [editSeg, setEditSeg] = useState<SegmentItem | null>(null);
	const [filter, setFilter] = useState<"all" | "active" | "draft" | "linked">("all");
	const [newName, setNewName] = useState("");
	const [newDesc, setNewDesc] = useState("");
	const [logic, setLogic] = useState<"AND" | "OR">("AND");
	const [criteria, setCriteria] = useState<Criterion[]>([
		{ id: "1", field: "kycLevel", operator: "=", value: "1" },
	]);
	const [deletingSegmentId, setDeletingSegmentId] = useState<string | null>(null);

	const primaryCriterion = criteria[0];

	// Fetch users based on selected condition
	const { data: segmentUsersResponse } = useQuery({
		queryKey: ["segment-users", primaryCriterion?.field, primaryCriterion?.value],
		queryFn: () => segmentAPI.getSegmentUsers(primaryCriterion?.field || "kycLevel", primaryCriterion?.value || "1"),
		enabled: showBuilder && Boolean(primaryCriterion?.field),
	});

	const estimatedCount = segmentUsersResponse?.total ?? (segmentUsersResponse?.data ? segmentUsersResponse.data.length : 0);

	const fetchedEmails = useMemo(() => {
		return (segmentUsersResponse?.data || []).map((u) => u.email).filter(Boolean);
	}, [segmentUsersResponse]);

	const addCriterion = () => {
		setCriteria((prev) => [
			...prev,
			{ id: String(Date.now()), field: "kycLevel", operator: "=", value: "0" },
		]);
	};

	const updateCriterion = (id: string, patch: Partial<Criterion>) => {
		setCriteria((prev) =>
			prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
		);
	};

	const removeCriterion = (id: string) => {
		if (criteria.length <= 1) return;
		setCriteria((prev) => prev.filter((c) => c.id !== id));
	};

	// Fetch all segments using segmentAPI
	const { data: segmentsResponse, isLoading: isSegmentsLoading } = useQuery({
		queryKey: ["segments"],
		queryFn: segmentAPI.getAllSegments,
	});

	const segments: SegmentItem[] = useMemo(() => segmentsResponse?.data || [], [segmentsResponse]);

	const filteredSegments = useMemo(() => {
		return segments.filter((s) => {
			if (filter === "all") return true;
			const normStatus = (s.status || "").toLowerCase();
			if (filter === "active") return normStatus === "active" || normStatus === "completed";
			if (filter === "draft") return normStatus === "paused" || normStatus === "draft";
			if (filter === "linked") return Boolean(s.isLinkedToCampaign);
			return true;
		});
	}, [segments, filter]);

	// Top Card Metrics
	const totalSegmentsCount = segments.length;
	const activeSegmentsCount = segments.filter((s) => (s.status || "").toLowerCase() === "active").length;
	const totalUsersTargeted = segments.reduce((acc, s) => acc + (s.totalUserTargeted || 0), 0);
	const linkedCampaignsCount = segments.filter((s) => Boolean(s.isLinkedToCampaign)).length;

	// Mutations
	const createSegmentMutation = useMutation({
		mutationFn: (payload: CreateSegmentPayload) => segmentAPI.createSegment(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["segments"] });
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

	const updateSegmentMutation = useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: CreateSegmentPayload }) => segmentAPI.updateSegment(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["segments"] });
			toast({
				title: "Segment Updated!",
				description: "Segment has been updated successfully.",
			});
			setShowBuilder(false);
		},
		onError: (err: any) => {
			toast({
				variant: "destructive",
				title: "Update Failed",
				description: err?.response?.data?.message || err.message || "Failed to update segment",
			});
		},
	});

	const deleteSegmentMutation = useMutation({
		mutationFn: (id: string) => segmentAPI.deleteSegment(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["segments"] });
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

	const openNew = () => {
		setEditSeg(null);
		setNewName("");
		setNewDesc("");
		setLogic("AND");
		setCriteria([{ id: "1", field: "kycLevel", operator: "=", value: "1" }]);
		setShowBuilder(true);
	};

	const openEdit = (seg: SegmentItem) => {
		setEditSeg(seg);
		setNewName(seg.segmentName || "");
		setNewDesc(seg.description || "");
		setLogic("AND");
		setCriteria([{ id: "1", field: "kycLevel", operator: "=", value: "1" }]);
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

		const emailsToSend = fetchedEmails.length > 0 ? fetchedEmails : (editSeg?.emails || []);

		const payload: CreateSegmentPayload = {
			segmentName: newName.trim(),
			description: newDesc.trim(),
			emails: emailsToSend,
		};

		if (editSeg) {
			updateSegmentMutation.mutate({ id: editSeg._id, payload });
		} else {
			createSegmentMutation.mutate(payload);
		}
	};

	const isSubmitting = createSegmentMutation.isPending || updateSegmentMutation.isPending;

	return (
		<div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Segments</h1>
					<p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
						Targeted user buckets — define criteria with AND/OR logic to dynamically match users for your campaigns
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
					{ label: "Active Segments", value: String(activeSegmentsCount), icon: <Activity size={15} className="text-emerald-400" /> },
					{ label: "Matched Users", value: fmtN(totalUsersTargeted), icon: <Users size={15} className="text-violet-400" /> },
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
			<div className="flex items-center gap-2 flex-wrap">
				{(["all", "active", "draft", "linked"] as const).map((f) => (
					<button
						key={f}
						type="button"
						onClick={() => setFilter(f)}
						className={`text-[12px] font-semibold px-4 py-2 rounded-lg capitalize transition-colors ${
							filter === f ? "text-white" : "text-muted-foreground border border-border hover:text-foreground"
						}`}
						style={filter === f ? { background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" } : {}}
					>
						{f === "all"
							? `All (${segments.length})`
							: f === "linked"
							? `Linked (${linkedCampaignsCount})`
							: `${f.charAt(0).toUpperCase() + f.slice(1)} (${segments.filter((s) => {
									const st = (s.status || "").toLowerCase();
									return f === "active" ? st === "active" || st === "completed" : st === "paused" || st === "draft";
							  }).length})`}
					</button>
				))}
			</div>

			{/* Segments Cards Grid */}
			{isSegmentsLoading ? (
				<div className="flex items-center justify-center py-20">
					<LoadingSpinner size="lg" />
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{filteredSegments.map((seg, i) => {
						const color = COLOR_PALETTE[i % COLOR_PALETTE.length];
						const emails = seg.emails || [];
						return (
							<div
								key={seg._id}
								className="bg-card border border-border/50 rounded-2xl p-5 hover:border-white/20 transition-all group shadow-card flex flex-col justify-between"
								style={{ boxShadow: `0 0 0 1px ${color}08 inset` }}
							>
								<div>
									{/* Card header */}
									<div className="flex items-start justify-between gap-3 mb-4">
										<div className="flex items-start gap-3">
											<div
												className="size-10 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
												style={{ background: `${color}18`, border: `1px solid ${color}30` }}
											>
												<Target size={16} style={{ color: color }} />
											</div>
											<div>
												<p className="text-[14px] font-bold text-foreground leading-tight">{seg.segmentName}</p>
												<p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{seg.description || "No description provided."}</p>
											</div>
										</div>
										<div className="flex flex-col items-end gap-1 shrink-0">
											<StatusBadge status={seg.status} />
											<LinkedBadge isLinked={seg.isLinkedToCampaign} />
										</div>
									</div>

									{/* Targeted Emails Pill Preview */}
									<div className="mb-4 space-y-1.5">
										<div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
											<Mail size={12} className="text-primary" />
											<span>Targeted Emails ({emails.length})</span>
										</div>
										{emails.length > 0 ? (
											<div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
												{emails.slice(0, 4).map((email, idx) => (
													<code
														key={idx}
														className="text-[10px] font-mono bg-secondary border border-border px-2 py-0.5 rounded-md text-muted-foreground"
													>
														{email}
													</code>
												))}
												{emails.length > 4 && (
													<span className="text-[10px] font-mono bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-md font-semibold">
														+{emails.length - 4} more
													</span>
												)}
											</div>
										) : (
											<p className="text-[11px] text-muted-foreground/60 italic">No emails added yet</p>
										)}
									</div>
								</div>

								{/* Stats + actions */}
								<div className="pt-4 border-t border-border/60 mt-2">
									<div className="flex items-center justify-between">
										<div className="flex gap-6">
											<div>
												<p className="text-[20px] font-bold text-foreground leading-none">{fmtN(seg.totalUserTargeted)}</p>
												<p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">matched users</p>
											</div>
											<div>
												<p className="text-[14px] font-semibold text-foreground leading-none mt-1">
													{seg.isLinkedToCampaign ? "Linked" : "Unlinked"}
												</p>
												<p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Campaign Status</p>
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
												onClick={() => setDeletingSegmentId(seg._id)}
												className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/20 transition-colors"
											>
												<Trash2 size={12} />
											</button>
										</div>
									</div>
								</div>
							</div>
						);
					})}
					{filteredSegments.length === 0 && (
						<div className="col-span-2 py-20 text-center text-[13px] text-muted-foreground bg-card border border-border/50 rounded-2xl">
							<Target size={28} className="mx-auto mb-3 text-muted-foreground/30" />
							No segments found. Click "New Segment" to create one.
						</div>
					)}
				</div>
			)}

			{/* Builder / Form Slide Panel */}
			<SlidePanel
				open={showBuilder}
				onClose={() => setShowBuilder(false)}
				title={editSeg ? "Edit Segment" : "New Segment"}
				subtitle="Define criteria with AND/OR logic to dynamically match users"
				footer={
					<div className="flex gap-3">
						<PurpleBtn onClick={saveSegment} disabled={isSubmitting}>
							{isSubmitting ? (
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
									className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border transition-all ${
										logic === l
											? "border-primary/40 bg-primary/10 text-primary"
											: "border-border text-muted-foreground hover:text-foreground"
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
							<label className="text-[11px] text-muted-foreground font-semibold">
								Conditions ({criteria.length})
							</label>
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
													className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${
														logic === "AND"
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
												onChange={(e) =>
													updateCriterion(c.id, { field: e.target.value, operator: "=", value: "" })
												}
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
													<option key={op} value={op}>
														{op}
													</option>
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
															<option key={v} value={v}>
																{v}
															</option>
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
							<p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
								Estimated match
							</p>
							<p className="text-[24px] font-black text-primary leading-none">~{fmtN(estimatedCount)}</p>
							<p className="text-[10px] text-muted-foreground">users match these criteria</p>
						</div>
						<div className="ml-auto text-right">
							<p className="text-[10px] text-muted-foreground">of total users</p>
							<p className="text-[16px] font-bold text-foreground">
								{Math.round((estimatedCount / 15847) * 100)}%
							</p>
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
							disabled={deleteSegmentMutation.isPending}
							className="px-4 py-2 text-[12px] font-semibold border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={() => {
								if (deletingSegmentId) {
									deleteSegmentMutation.mutate(deletingSegmentId);
								}
							}}
							disabled={deleteSegmentMutation.isPending}
							className="px-4 py-2 text-[12px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
						>
							{deleteSegmentMutation.isPending ? <LoadingSpinner size="sm" /> : "Delete Segment"}
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default Segments;