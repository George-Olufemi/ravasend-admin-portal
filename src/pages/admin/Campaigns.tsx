import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Plus,
	Trash2,
	PauseCircle,
	Play,
	PlayCircle,
	MoreHorizontal,
	Mail,
	Smartphone,
	MonitorPlay,
	Image,
	X,
	CheckCircle2,
	AlertTriangle,
	Target,
	ChevronLeft,
	ChevronRight,
	Eye,
	Clock,
	Send,
	Edit,
	TrendingUp,
	RotateCcw,
	Archive,
} from "lucide-react";
import {
	campaignAPI,
	segmentAPI,
	SegmentItem,
	usersAPI,
	User,
	CampaignItem,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";

function fmtN(num: number) {
	return new Intl.NumberFormat().format(num || 0);
}

function StatCard({ label, value, isLoading }: { label: string; value: string; isLoading?: boolean }) {
	return (
		<Card className="bg-gradient-card border-border/50 shadow-card">
			<CardContent className="p-5">
				<p className="text-[12px] font-medium text-muted-foreground">{label}</p>
				{isLoading ? (
					<div className="mt-2 flex items-center gap-2">
						<LoadingSpinner size="sm" />
					</div>
				) : (
					<p className="text-2xl font-bold tracking-tight text-foreground mt-1">{value}</p>
				)}
			</CardContent>
		</Card>
	);
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
			{status || "Unknown"}
		</Badge>
	);
}

function ChannelBadge({ ch }: { ch: string }) {
	const normalized = ch.trim().toLowerCase();
	switch (normalized) {
		case "email":
			return (
				<Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] gap-1">
					<Mail size={10} /> Email
				</Badge>
			);
		case "push":
			return (
				<Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px] gap-1">
					<Smartphone size={10} /> Push
				</Badge>
			);
		case "inapp-popup":
		case "popup":
			return (
				<Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] gap-1">
					<MonitorPlay size={10} /> In-App Pop-up
				</Badge>
			);
		case "inapp-banner":
		case "banner":
			return (
				<Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] gap-1">
					<Image size={10} /> In-App Banner
				</Badge>
			);
		default:
			return <Badge variant="outline" className="text-[10px] capitalize">{ch}</Badge>;
	}
}

const GOAL_OPTIONS = [
	{ id: "deposit", label: "Deposit", icon: "💰", desc: "Receive funds into wallet", hasDepositConfig: true },
	{
		id: "send",
		label: "Send Money",
		icon: "↗️",
		desc: "Transfer to any destination",
		hasAmount: true,
		hasCount: true,
		scopeLabel: "Destination",
		scopeItems: [
			"Nigeria", "Ghana", "Kenya", "United Kingdom", "United States", "Canada",
			"South Africa", "Uganda", "Tanzania", "Rwanda", "Germany", "France",
			"Australia", "UAE", "India", "Egypt", "Pakistan"
		],
	},
	{ id: "invite", label: "Invite Friends", icon: "👥", desc: "Refer new users with conditions", hasCount: true, hasInviteeConditions: true },
	{ id: "kyc", label: "KYC Verification", icon: "🪪", desc: "User reaches a KYC tier", hasKycTier: true },
	{
		id: "bill",
		label: "Pay a Bill",
		icon: "🧾",
		desc: "Any bill or VTU payment",
		hasAmount: true,
		hasCount: true,
		scopeLabel: "Bill type",
		scopeItems: ["Airtime", "Data Bundles", "Electricity", "TV Subscriptions", "Internet", "Education", "Water", "Insurance", "Cable TV"],
	},
	{ id: "attribution", label: "Attribution Only", icon: "📊", desc: "Track engagement, no conversion" },
] as const;

const DEPOSIT_TYPES: Record<string, string[]> = {
	Crypto: ["Any Crypto", "BTC", "ETH", "USDT", "USDC", "SOL", "BNB", "TRX", "XRP", "MATIC", "AVAX"],
	Fiat: ["Any Fiat", "NGN", "USD", "GBP", "EUR", "GHS", "KES", "ZAR", "CAD", "AUD"],
	"Cross-border (Send)": ["Any Country", "Nigeria", "Ghana", "Kenya", "United Kingdom", "United States", "Canada", "South Africa", "Uganda", "Tanzania", "Rwanda", "Germany", "France", "Netherlands", "Australia", "UAE", "India"],
};

const GOAL_CURRENCIES = ["NGN", "USD", "GBP", "EUR", "GHS", "USDT", "USDC", "BTC", "ETH", "SOL"];

function BannerUploadWidget({ onBannerChange }: { onBannerChange?: (url: string) => void }) {
	const [preview, setPreview] = React.useState<string | null>(null);
	const [bannerPos, setBannerPos] = React.useState<"Top" | "Bottom">("Top");
	const [deepLink, setDeepLink] = React.useState("");
	const [dragging, setDragging] = React.useState(false);
	const fileRef = React.useRef<HTMLInputElement>(null);

	const handleFile = (file: File) => {
		if (!file.type.startsWith("image/")) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			const res = e.target?.result as string;
			setPreview(res);
			if (onBannerChange) onBannerChange(res);
		};
		reader.readAsDataURL(file);
	};

	return (
		<div className="bg-card border border-border rounded-xl p-5 space-y-4">
			<div className="flex items-center gap-2">
				<Image size={13} className="text-emerald-400" />
				<span className="text-[12px] font-bold text-foreground">In-App Banner</span>
			</div>
			<div
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragging(false);
					const f = e.dataTransfer.files[0];
					if (f) handleFile(f);
				}}
				onClick={() => fileRef.current?.click()}
				className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all overflow-hidden ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-white/[0.015]"
					}`}
				style={{ minHeight: preview ? "auto" : 96 }}
			>
				<input
					ref={fileRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={(e) => {
						const f = e.target.files?.[0];
						if (f) handleFile(f);
					}}
				/>
				{preview ? (
					<div className="relative">
						<img src={preview} alt="Banner preview" className="w-full object-cover rounded-xl max-h-32" />
						<div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
							<span className="text-[11px] font-bold text-white bg-black/50 px-3 py-1.5 rounded-lg">Click to replace</span>
						</div>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setPreview(null);
								if (onBannerChange) onBannerChange("");
							}}
							className="absolute top-2 right-2 size-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
						>
							<X size={11} className="text-white" />
						</button>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center gap-2 h-24">
						<div className="size-10 rounded-full bg-white/[0.04] border border-border flex items-center justify-center">
							<Image size={16} className="text-muted-foreground" />
						</div>
						<p className="text-[11px] text-muted-foreground">
							Drop banner image here or <span className="text-primary font-semibold">click to upload</span>
						</p>
						<p className="text-[10px] text-muted-foreground/60">PNG, JPG, WebP · Recommended 1200 × 300 px</p>
					</div>
				)}
			</div>
			<div>
				<label className="text-[10px] text-muted-foreground font-semibold block mb-1.5">Banner Position</label>
				<div className="flex gap-2">
					{(["Top", "Bottom"] as const).map((pos) => (
						<button
							key={pos}
							type="button"
							onClick={() => setBannerPos(pos)}
							className={`flex-1 py-2 rounded-lg text-[11px] font-bold border transition-all ${bannerPos === pos ? "bg-primary/15 text-primary border-primary/40" : "border-border text-muted-foreground hover:text-foreground"
								}`}
						>
							{pos}
						</button>
					))}
				</div>
			</div>
			<div>
				<label className="text-[10px] text-muted-foreground font-semibold block mb-1">Tap Destination</label>
				<input
					type="text"
					value={deepLink}
					onChange={(e) => setDeepLink(e.target.value)}
					placeholder="ravasend://deposit or https://…"
					className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
				/>
			</div>
		</div>
	);
}

function CampaignDetailSheet({
	campaignId,
	onClose,
	onUpdateStatus,
}: {
	campaignId: string | null;
	onClose: () => void;
	onUpdateStatus: (id: string, currentStatus: string) => void;
}) {
	const [tab, setTab] = useState<"overview" | "content" | "log">("overview");

	const { data: detailResponse, isLoading } = useQuery({
		queryKey: ["campaign-detail", campaignId],
		queryFn: () => campaignAPI.getCampaignById(campaignId!),
		enabled: !!campaignId,
	});

	const campaign = detailResponse?.data;

	if (!campaignId) return null;

	return (
		<Sheet open={!!campaignId} onOpenChange={(open) => { if (!open) onClose(); }}>
			<SheetContent side="right" className="w-full sm:max-w-[560px] overflow-y-auto bg-background p-6">
				<SheetHeader className="mb-4">
					<SheetTitle className="text-xl font-bold text-foreground">
						{isLoading ? "Loading details..." : campaign?.campaignName || "Campaign Details"}
					</SheetTitle>
				</SheetHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<LoadingSpinner size="lg" />
					</div>
				) : !campaign ? (
					<div className="text-center py-10 text-muted-foreground text-sm">
						Campaign record not found.
					</div>
				) : (
					<div className="space-y-5">
						{/* Meta row */}
						<div className="flex items-center gap-2 mb-4 flex-wrap">
							<StatusBadge status={campaign.status} />
							<span className="text-[10px] text-muted-foreground bg-white/[0.04] border border-border px-2 py-0.5 rounded-md">
								{campaign.depositType || campaign.deliveryStrategy || "General"}
							</span>
							<span className="text-[10px] text-muted-foreground ml-auto">
								Created {new Date(campaign.createdAt).toLocaleDateString()}
							</span>
						</div>

						{/* Action buttons */}
						<div className="flex gap-2 mb-5">
							<button
								type="button"
								onClick={() => onUpdateStatus(campaign._id, campaign.status)}
								className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-border text-muted-foreground hover:text-foreground transition-colors bg-secondary/50"
							>
								{campaign.status === "active" ? (
									<><PauseCircle size={12} className="text-amber-400" /> Pause Campaign</>
								) : (
									<><PlayCircle size={12} className="text-emerald-400" /> Resume Campaign</>
								)}
							</button>
						</div>

						{/* Navigation Tabs */}
						<div className="flex gap-1 mb-5 bg-secondary/50 rounded-xl p-1 border border-border">
							{(
								[
									["overview", "Overview"],
									["content", "Content"],
									["log", "Delivery Log"],
								] as const
							).map(([id, label]) => (
								<button
									key={id}
									type="button"
									onClick={() => setTab(id)}
									className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all ${tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
										}`}
								>
									{label}
								</button>
							))}
						</div>

						{/* ── Overview Tab ── */}
						{tab === "overview" && (
							<div className="space-y-5">
								{/* Performance KPIs */}
								<div className="grid grid-cols-2 gap-3">
									{[
										{
											label: "Recipients",
											value: fmtN(campaign.recipients?.length || campaign.totalRecipients || 0),
											sub: "target recipients",
											icon: <Send size={13} className="text-primary" />,
										},
										{
											label: "Total Sent",
											value: fmtN(campaign.totalSent || 0),
											sub: "dispatched messages",
											icon: <Send size={13} className="text-sky-400" />,
										},
										{
											label: "Opened",
											value: fmtN(campaign.totalOpened || 0),
											sub: `${campaign.totalSent ? Math.round(((campaign.totalOpened || 0) / campaign.totalSent) * 100) : 0}% open rate`,
											icon: <Eye size={13} className="text-emerald-400" />,
										},
										{
											label: "Delivered",
											value: fmtN(campaign.totalDelivered || 0),
											sub: "successfully delivered",
											icon: <CheckCircle2 size={13} className="text-amber-400" />,
										},
									].map((k) => (
										<div key={k.label} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
											<div className="size-8 rounded-lg bg-white/[0.04] border border-border flex items-center justify-center shrink-0">
												{k.icon}
											</div>
											<div>
												<p className="text-[18px] font-bold text-foreground leading-none mb-0.5">{k.value}</p>
												<p className="text-[10px] text-muted-foreground font-semibold">{k.label}</p>
												<p className="text-[9px] text-muted-foreground/60">{k.sub}</p>
											</div>
										</div>
									))}
								</div>

								{/* Engagement Funnel bar */}
								<div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
									<p className="text-[11px] font-bold text-foreground mb-3">Engagement Breakdown</p>
									{[
										{
											label: "Total Sent",
											val: campaign.totalSent || 0,
											pct: 100,
											color: "bg-primary/60",
										},
										{
											label: "Delivered",
											val: campaign.totalDelivered || 0,
											pct: campaign.totalSent ? Math.round(((campaign.totalDelivered || 0) / campaign.totalSent) * 100) : 0,
											color: "bg-sky-500/70",
										},
										{
											label: "Opened",
											val: campaign.totalOpened || 0,
											pct: campaign.totalSent ? Math.round(((campaign.totalOpened || 0) / campaign.totalSent) * 100) : 0,
											color: "bg-emerald-500/70",
										},
										{
											label: "Clicked",
											val: campaign.totalClicked || 0,
											pct: campaign.totalSent ? Math.round(((campaign.totalClicked || 0) / campaign.totalSent) * 100) : 0,
											color: "bg-amber-500/70",
										},
									].map((row) => (
										<div key={row.label}>
											<div className="flex justify-between mb-1">
												<span className="text-[10px] font-semibold text-muted-foreground">{row.label}</span>
												<span className="text-[10px] font-bold text-foreground">
													{fmtN(row.val)} <span className="text-muted-foreground font-normal">({row.pct}%)</span>
												</span>
											</div>
											<div className="h-1.5 bg-secondary rounded-full overflow-hidden">
												<div className={`h-full rounded-full ${row.color} transition-all`} style={{ width: `${row.pct}%` }} />
											</div>
										</div>
									))}
								</div>

								{/* Campaign settings */}
								<div className="bg-card border border-border rounded-xl divide-y divide-border">
									<p className="px-4 py-3 text-[11px] font-bold text-foreground">Campaign Settings</p>
									{[
										{ label: "Campaign Name", value: campaign.campaignName },
										{ label: "Deposit Type", value: campaign.depositType || "—" },
										{
											label: "Channel Type",
											value: (
												<div className="flex gap-1 flex-wrap justify-end">
													{(campaign.campaignType || "email").split(",").map((ch) => (
														<ChannelBadge key={ch} ch={ch} />
													))}
												</div>
											),
										},
										{ label: "Reward", value: <span className="text-emerald-400 font-semibold">{campaign.conversionReward || "None"}</span> },
										{ label: "Delivery Strategy", value: campaign.deliveryStrategy || "—" },
										{ label: "Delivery Time", value: campaign.deliveryTime || "—" },
										{ label: "Delivery Date", value: campaign.deliveryDate ? new Date(campaign.deliveryDate).toLocaleDateString() : "—" },
										{ label: "Timezone", value: campaign.deliveryTimezone || "—" },
										{
											label: "Frequency",
											value: campaign.deliveryFrequency
												? `${campaign.deliveryFrequencyValue ?? 1} ${campaign.deliveryFrequencyUnit ?? "hours"} (${campaign.deliveryFrequency})`
												: "—",
										},
										{ label: "Next Delivery", value: campaign.nextDeliveryAt ? new Date(campaign.nextDeliveryAt).toLocaleString() : "—" },
										{ label: "Recipients Count", value: fmtN(campaign.recipients?.length || campaign.totalRecipients || 0) },
									].map((row) => (
										<div key={row.label} className="flex items-start justify-between px-4 py-2.5 gap-4">
											<span className="text-[11px] text-muted-foreground shrink-0">{row.label}</span>
											<span className="text-[11px] text-foreground text-right">{row.value}</span>
										</div>
									))}
								</div>
							</div>
						)}

						{/* ── Content Tab ── */}
						{tab === "content" && (
							<div className="space-y-4">
								<div className="bg-card border border-border rounded-xl overflow-hidden p-4 space-y-3">
									<div className="flex items-center gap-2">
										<span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border capitalize">
											{campaign.campaignType || "email"}
										</span>
									</div>

									<div>
										<label className="text-[10px] text-muted-foreground font-semibold block mb-1">Subject</label>
										<p className="text-[12px] font-semibold text-foreground bg-secondary/40 rounded-lg px-3 py-2 border border-border/50">
											{campaign.subject || "No subject provided"}
										</p>
									</div>

									<div>
										<label className="text-[10px] text-muted-foreground font-semibold block mb-1">Message Body</label>
										<p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line bg-secondary/40 rounded-lg px-3 py-2.5 border border-border/50">
											{campaign.message || "No message body provided"}
										</p>
									</div>

									{campaign.image && (
										<div>
											<label className="text-[10px] text-muted-foreground font-semibold block mb-1">Image Banner</label>
											<img src={campaign.image} alt="Campaign Banner" className="w-full object-cover rounded-lg border border-border max-h-48" />
										</div>
									)}
								</div>

								{/* Recipients list */}
								<div className="bg-card border border-border rounded-xl p-4 space-y-2">
									<p className="text-[11px] font-bold text-foreground">Recipients ({campaign.recipients?.length || 0})</p>
									<div className="max-h-44 overflow-y-auto space-y-1">
										{campaign.recipients && campaign.recipients.length > 0 ? (
											campaign.recipients.map((email, idx) => (
												<div key={idx} className="text-[11px] font-mono text-muted-foreground bg-secondary/20 px-2.5 py-1 rounded border border-border/30">
													{email}
												</div>
											))
										) : (
											<p className="text-[11px] text-muted-foreground">No specific recipient emails listed.</p>
										)}
									</div>
								</div>
							</div>
						)}

						{/* ── Delivery Log Tab ── */}
						{tab === "log" && (
							<div className="space-y-3">
								<div className="bg-card border border-border rounded-xl p-4 space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-[12px] font-bold text-foreground">Primary Delivery Schedule</span>
										<StatusBadge status={campaign.status} />
									</div>
									<div className="text-[11px] text-muted-foreground space-y-1">
										<p>• Delivery Strategy: <span className="text-foreground font-semibold">{campaign.deliveryStrategy || "standard"}</span></p>
										<p>• Scheduled Date: <span className="text-foreground font-semibold">{campaign.deliveryDate ? new Date(campaign.deliveryDate).toLocaleDateString() : "Immediate"}</span></p>
										<p>• Scheduled Time: <span className="text-foreground font-semibold">{campaign.deliveryTime || "00:00"} {campaign.deliveryTimezone || ""}</span></p>
										<p>• Frequency: <span className="text-foreground font-semibold">{campaign.deliveryFrequency || "one-time"}</span></p>
										{campaign.nextDeliveryAt && (
											<p>• Next Delivery At: <span className="text-primary font-semibold">{new Date(campaign.nextDeliveryAt).toLocaleString()}</span></p>
										)}
									</div>
								</div>

								<div className="bg-card border border-border rounded-xl p-4 space-y-3">
									<p className="text-[11px] font-bold text-foreground">Delivery Execution Log</p>
									<div className="grid grid-cols-2 gap-3 text-center">
										<div className="bg-secondary/40 p-3 rounded-lg border border-border/50">
											<p className="text-[10px] text-muted-foreground font-semibold">Total Dispatched</p>
											<p className="text-[16px] font-bold text-foreground">{fmtN(campaign.totalSent || 0)}</p>
										</div>
										<div className="bg-secondary/40 p-3 rounded-lg border border-border/50">
											<p className="text-[10px] text-muted-foreground font-semibold">Delivered</p>
											<p className="text-[16px] font-bold text-emerald-400">{fmtN(campaign.totalDelivered || 0)}</p>
										</div>
										<div className="bg-secondary/40 p-3 rounded-lg border border-border/50">
											<p className="text-[10px] text-muted-foreground font-semibold">Opened</p>
											<p className="text-[16px] font-bold text-sky-400">{fmtN(campaign.totalOpened || 0)}</p>
										</div>
										<div className="bg-secondary/40 p-3 rounded-lg border border-border/50">
											<p className="text-[10px] text-muted-foreground font-semibold">Failed</p>
											<p className="text-[16px] font-bold text-red-400">{fmtN(campaign.totalFailed || 0)}</p>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}

function EditCampaignDialog({
	campaign,
	onClose,
	onSave,
	isSaving,
}: {
	campaign: CampaignItem | null;
	onClose: () => void;
	onSave: (data: Partial<CampaignItem>) => void;
	isSaving: boolean;
}) {
	const [name, setName] = useState(campaign?.campaignName || "");
	const [subject, setSubject] = useState(campaign?.subject || "");
	const [message, setMessage] = useState(campaign?.message || "");
	const [depositType, setDepositType] = useState(campaign?.depositType || "first Deposit");
	const [reward, setReward] = useState(campaign?.conversionReward || "0");
	const [status, setStatus] = useState(campaign?.status || "active");

	React.useEffect(() => {
		if (campaign) {
			setName(campaign.campaignName || "");
			setSubject(campaign.subject || "");
			setMessage(campaign.message || "");
			setDepositType(campaign.depositType || "first Deposit");
			setReward(campaign.conversionReward || "0");
			setStatus(campaign.status || "active");
		}
	}, [campaign]);

	if (!campaign) return null;

	return (
		<Dialog open={!!campaign} onOpenChange={(open) => { if (!open) onClose(); }}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Edit Campaign</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div>
						<label className="text-[11px] font-semibold text-muted-foreground block mb-1">Campaign Name</label>
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
						/>
					</div>

					<div>
						<label className="text-[11px] font-semibold text-muted-foreground block mb-1">Subject</label>
						<input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
						/>
					</div>

					<div>
						<label className="text-[11px] font-semibold text-muted-foreground block mb-1">Message Body</label>
						<textarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground h-20 resize-none focus:outline-none focus:border-primary/50"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-semibold text-muted-foreground block mb-1">Deposit Type</label>
							<input
								value={depositType}
								onChange={(e) => setDepositType(e.target.value)}
								className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
							/>
						</div>
						<div>
							<label className="text-[11px] font-semibold text-muted-foreground block mb-1">Conversion Reward</label>
							<input
								value={reward}
								onChange={(e) => setReward(e.target.value)}
								className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
							/>
						</div>
					</div>

					<div>
						<label className="text-[11px] font-semibold text-muted-foreground block mb-1">Status</label>
						<select
							value={status}
							onChange={(e) => setStatus(e.target.value)}
							className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
						>
							<option value="active">Active</option>
							<option value="paused">Paused</option>
							<option value="completed">Completed</option>
						</select>
					</div>
				</div>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => onSave({ campaignName: name, subject, message, depositType, conversionReward: reward, status })}
						disabled={isSaving}
					>
						{isSaving ? <LoadingSpinner size="sm" /> : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

const Campaigns = () => {
	const [listTab, setListTab] = useState<"active" | "deleted">("active");
	const [view, setView] = useState<"list" | "new">("list");
	const [step, setStep] = useState(1);
	const [campaignName, setCampaignName] = useState("");
	const [selectedSeg, setSelectedSeg] = useState("");
	const [channels, setChannels] = useState(["email", "push"]);
	const [openMenu, setOpenMenu] = useState<string | null>(null);
	const [campaignPg, setCampaignPg] = useState(1);
	const campaignPerPage = 5;

	// View Details & Edit state
	const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
	const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null);
	const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null);

	// Custom Message Contents
	const [emailSubject, setEmailSubject] = useState("Make your first deposit and get up to ₦5,000 instantly");
	const [emailBody, setEmailBody] = useState("Hi, welcome to Ravasend! Deposit within 7 days to unlock your ₦5,000 reward.");
	const [pushTitle, setPushTitle] = useState("💸 Your ₦5,000 reward is waiting!");
	const [pushBody, setPushBody] = useState("Make your first deposit within 7 days to claim it");
	const [popupHeadline, setPopupHeadline] = useState("Your ₦5,000 reward is waiting!");
	const [popupBody, setPopupBody] = useState("Deposit within 7 days to unlock your instant cash reward. No minimum amount required.");
	const [popupCta, setPopupCta] = useState("Deposit Now");
	const [bannerImage, setBannerImage] = useState("");

	// Conversion Goal
	const [conversionGoal, setConversionGoal] = useState("deposit");
	// Deposit Config
	const [depositType, setDepositType] = useState("Crypto");
	const [depositSubtype, setDepositSubtype] = useState("Any Crypto");
	const [depositMinAmount, setDepositMinAmount] = useState("");
	const [depositCurrency, setDepositCurrency] = useState("USDT");
	// Send / Bill Config
	const [goalScopeItems, setGoalScopeItems] = useState<string[]>([]);
	const [goalScopeLogic, setGoalScopeLogic] = useState<"AND" | "OR">("OR");
	const [goalMinAmount, setGoalMinAmount] = useState("");
	const [goalMinCurrency, setGoalMinCurrency] = useState("NGN");
	const [goalCount, setGoalCount] = useState("1");
	const [goalKycTier, setGoalKycTier] = useState<"1" | "2" | "3">("1");
	// Invite Config
	const [inviteCount, setInviteCount] = useState("1");
	const [inviteeConditions, setInviteeConditions] = useState<{ type: string; value: string }[]>([]);
	const [inviteeLogic, setInviteeLogic] = useState<"AND" | "OR">("AND");
	// Timing / Strategy
	const [campaignType, setCampaignType] = useState<"drip-timebase" | "event-trigger" | "one-time broadcast">("drip-timebase");
	// Drip Steps
	const [dripSteps, setDripSteps] = useState([
		{ delay: "Day 1", message: "Welcome — claim your reward", enabled: true },
		{ delay: "Day 3", message: "Reminder — reward still available", enabled: true },
		{ delay: "Day 5", message: "⚠️ 2 days left to claim", enabled: true },
		{ delay: "Day 7", message: "🔴 LAST CHANCE — expires today", enabled: true },
	]);
	// Event Trigger
	const [eventTrigger, setEventTrigger] = useState("user_registers");
	const [eventKycTier, setEventKycTier] = useState<"1" | "2" | "3">("1");
	const [eventDelay, setEventDelay] = useState("24h");
	// Broadcast
	const [broadcastDate, setBroadcastDate] = useState("");
	const [broadcastTime, setBroadcastTime] = useState("09:00");
	// Reward
	const [rewardType, setRewardType] = useState<"cash" | "promo_code" | "none">("cash");
	const [rewardAmount, setRewardAmount] = useState("5000");
	const [rewardCurrency, setRewardCurrency] = useState("NGN");
	const [rewardPromoCode, setRewardPromoCode] = useState("");

	const { toast } = useToast();
	const queryClient = useQueryClient();

	const { data: usersData } = useQuery({
		queryKey: ["users"],
		queryFn: usersAPI.getAll,
	});

	const { data: campaignsData, isLoading: isCampaignsLoading } = useQuery({
		queryKey: ["campaigns"],
		queryFn: campaignAPI.getAllCampaigns,
	});

	const { data: totalCampaignsData, isLoading: isTotalCampaignsLoading } = useQuery({
		queryKey: ["totalCampaigns"],
		queryFn: campaignAPI.getTotalCampaigns,
	});

	const { data: totalActiveCampaignsData, isLoading: isTotalActiveCampaignsLoading } = useQuery({
		queryKey: ["totalActiveCampaigns"],
		queryFn: campaignAPI.getTotalActiveCampaigns,
	});

	const { data: totalCampaignSentData, isLoading: isTotalCampaignSentLoading } = useQuery({
		queryKey: ["totalCampaignSent"],
		queryFn: campaignAPI.getTotalCampaignSent,
	});

	const users: User[] = useMemo(() => usersData?.users || [], [usersData]);

	const allRawCampaigns: CampaignItem[] = useMemo(() => campaignsData?.data || [], [campaignsData]);

	const liveCampaigns = useMemo(() => {
		return allRawCampaigns.filter((c) => !c.isDeleted && (c.status || "").toLowerCase() !== "deleted");
	}, [allRawCampaigns]);

	const deletedCampaigns = useMemo(() => {
		return allRawCampaigns.filter((c) => Boolean(c.isDeleted) || (c.status || "").toLowerCase() === "deleted");
	}, [allRawCampaigns]);

	const displayedCampaigns = listTab === "active" ? liveCampaigns : deletedCampaigns;

	const createCampaignMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) => campaignAPI.createCampaign(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["campaigns"] });
			queryClient.invalidateQueries({ queryKey: ["totalCampaigns"] });
			queryClient.invalidateQueries({ queryKey: ["totalActiveCampaigns"] });
			queryClient.invalidateQueries({ queryKey: ["totalCampaignSent"] });
			toast({
				title: "Campaign Created!",
				description: "Campaign was created successfully.",
			});
			setView("list");
			setStep(1);
		},
		onError: (err: any) => {
			toast({
				variant: "destructive",
				title: "Creation Failed",
				description: err?.response?.data?.message || err.message || "Failed to create campaign",
			});
		},
	});

	const updateCampaignMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) => campaignAPI.updateCampaign(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["campaigns"] });
			queryClient.invalidateQueries({ queryKey: ["campaign-detail"] });
			queryClient.invalidateQueries({ queryKey: ["totalCampaigns"] });
			queryClient.invalidateQueries({ queryKey: ["totalActiveCampaigns"] });
			toast({
				title: "Campaign Updated",
				description: "Changes were saved successfully.",
			});
			setEditingCampaign(null);
		},
		onError: (err: any) => {
			toast({
				variant: "destructive",
				title: "Update Failed",
				description: err?.response?.data?.message || err.message || "Failed to update campaign",
			});
		},
	});

	const deleteCampaignMutation = useMutation({
		mutationFn: campaignAPI.deleteCampaign,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["campaigns"] });
			queryClient.invalidateQueries({ queryKey: ["totalCampaigns"] });
			queryClient.invalidateQueries({ queryKey: ["totalActiveCampaigns"] });
			queryClient.invalidateQueries({ queryKey: ["totalCampaignSent"] });
			toast({
				title: "Campaign Deleted",
				description: "The campaign was removed.",
			});
			setDeletingCampaignId(null);
		},
		onError: (err: any) => {
			toast({
				variant: "destructive",
				title: "Delete Failed",
				description: err?.response?.data?.message || err.message || "Failed to delete campaign",
			});
		},
	});

	const restoreCampaignMutation = useMutation({
		mutationFn: (id: string) => campaignAPI.restoreCampaign(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["campaigns"] });
			queryClient.invalidateQueries({ queryKey: ["totalCampaigns"] });
			queryClient.invalidateQueries({ queryKey: ["totalActiveCampaigns"] });
			queryClient.invalidateQueries({ queryKey: ["totalCampaignSent"] });
			toast({
				title: "Campaign Restored!",
				description: "The campaign has been restored successfully.",
			});
		},
		onError: (err: any) => {
			toast({
				variant: "destructive",
				title: "Restore Failed",
				description: err?.response?.data?.message || err.message || "Failed to restore campaign",
			});
		},
	});

	// Fetch all segments from segmentAPI
	const { data: segmentsResponse, isLoading: isSegmentsLoading } = useQuery({
		queryKey: ["segments"],
		queryFn: segmentAPI.getAllSegments,
	});

	const segments: SegmentItem[] = useMemo(() => segmentsResponse?.data || [], [segmentsResponse]);

	// Selected target segment
	const currentSegment = useMemo(() => {
		if (segments.length === 0) return null;
		return segments.find((s) => s._id === selectedSeg) || segments[0];
	}, [segments, selectedSeg]);

	const toggleScopeItem = (item: string) =>
		setGoalScopeItems((s) => (s.includes(item) ? s.filter((x) => x !== item) : [...s, item]));
	const toggleCh = (ch: string) =>
		setChannels((p) => (p.includes(ch) ? p.filter((c) => c !== ch) : [...p, ch]));
	const stepsList = ["Segment", "Message & Goal", "Timing", "Review"];

	const handleActivateCampaign = async () => {
		const segmentId = currentSegment?._id || selectedSeg;
		if (!segmentId) {
			toast({
				variant: "destructive",
				title: "Segment Required",
				description: "Please select a target segment to continue.",
			});
			return;
		}

		const segmentEmails = currentSegment?.emails || [];
		const segmentNameText = currentSegment?.segmentName || "Selected Segment";
		const finalName = campaignName.trim() || `Campaign for ${segmentNameText}`;

		const recipients = segmentEmails.filter(Boolean);
		const bulkRecipients = recipients.length > 0 ? recipients : ["user@ravasend.com"];

		const rewardVal =
			rewardType === "cash"
				? rewardAmount
				: rewardType === "promo_code"
					? rewardPromoCode
					: "0";

		const payload = {
			segmentId,
			segment: segmentId,
			campaignName: finalName,
			subject: channels.includes("email") ? emailSubject : pushTitle || finalName,
			message: channels.includes("email") ? emailBody : pushBody || "Campaign message",
			recipients: bulkRecipients,
			campaignType: channels.join(", ") || "email",
			image: bannerImage || "",
			depositType: depositSubtype || depositType || "first Deposit",
			conversionReward: rewardVal || "200",
			deliveryStrategy: campaignType,
			deliveryTime: broadcastTime || "01:00",
			deliveryDate: broadcastDate ? new Date(broadcastDate).toISOString() : new Date().toISOString(),
			deliveryTimezone: "Africa/Lagos",
			deliveryFrequency: campaignType === "event-trigger" ? eventDelay : "weekly",
			deliveryFrequencyValue: 2,
			deliveryFrequencyUnit: "hours",
			deliveryFrequencyTimezone: "Africa/Lagos",
			status: "active",
		};

		// 1. Create campaign record
		createCampaignMutation.mutate({ id: segmentId, data: payload });

		// 2. Call sendBulkEmail if email channel selected
		if (channels.includes("email")) {
			try {
				await campaignAPI.sendBulkEmail({
					subject: emailSubject || finalName,
					message: emailBody || "Campaign message",
					recipients: bulkRecipients,
				});
			} catch (err: any) {
				console.error("sendBulkEmail error:", err);
			}
		}

		// 3. Call sendBulkPushNotification if push channel selected
		if (channels.includes("push")) {
			try {
				await campaignAPI.sendBulkPushNotification({
					subject: pushTitle || emailSubject || finalName,
					message: pushBody || emailBody || "Campaign message",
					recipients: bulkRecipients,
				});
			} catch (err: any) {
				console.error("sendBulkPushNotification error:", err);
			}
		}
	};

	const handleToggleStatus = (id: string, currentStatus: string) => {
		const newStatus = currentStatus === "active" ? "paused" : "active";
		updateCampaignMutation.mutate({ id, data: { status: newStatus } });
	};

	const handleDeleteCampaign = (id: string) => {
		setDeletingCampaignId(id);
	};

	if (view === "new") {
		return (
			<div className="p-7 flex flex-col space-y-6 min-h-full flex-1">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight text-foreground">New Campaign</h1>
						<p className="text-[12px] text-muted-foreground mt-0.5">
							Step {step} of 4 — {stepsList[step - 1]}
						</p>
					</div>
					<button
						type="button"
						onClick={() => {
							setView("list");
							setStep(1);
						}}
						className="text-[12px] text-muted-foreground border border-border px-3.5 py-2 rounded-xl hover:text-foreground transition-colors font-semibold bg-secondary/50"
					>
						← Back to Campaigns
					</button>
				</div>

				{/* Wizard Stepper */}
				<div className="flex items-center gap-2 mb-4 max-w-[580px]">
					{stepsList.map((s, i) => (
						<React.Fragment key={s}>
							<div className="flex items-center gap-2">
								<div
									className={`size-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${i + 1 <= step ? "text-white" : "border border-border text-muted-foreground bg-secondary/30"
										}`}
									style={i + 1 <= step ? { background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" } : {}}
								>
									{i + 1 < step ? <CheckCircle2 size={13} /> : i + 1}
								</div>
								<span className={`text-[12px] font-semibold whitespace-nowrap ${i + 1 === step ? "text-foreground" : "text-muted-foreground"}`}>
									{s}
								</span>
							</div>
							{i < stepsList.length - 1 && <div className={`h-px flex-1 min-w-[24px] ${i + 1 < step ? "bg-primary" : "bg-border"}`} />}
						</React.Fragment>
					))}
				</div>

				<div className="max-w-[580px] space-y-6">
					{/* STEP 1: Segment & Name */}
					{step === 1 && (
						<>
							<div>
								<label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Campaign Name</label>
								<input
									className="w-full bg-card border border-border rounded-xl px-3.5 py-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
									placeholder="e.g. First Deposit 7-Day Push"
									value={campaignName}
									onChange={(e) => setCampaignName(e.target.value)}
								/>
							</div>

							<div>
								<label className="text-[11px] text-muted-foreground font-semibold block mb-3">Target Segment</label>
								{isSegmentsLoading ? (
									<div className="flex items-center justify-center p-8 bg-card border border-border rounded-xl">
										<LoadingSpinner size="md" />
									</div>
								) : segments.length === 0 ? (
									<div className="p-4 rounded-xl border border-border bg-card text-center text-[12px] text-muted-foreground">
										No segments found. Please create a segment first in the Segments tab.
									</div>
								) : (
									<div className="space-y-2">
										{segments.map((s) => {
											const isChecked = selectedSeg ? selectedSeg === s._id : segments[0]?._id === s._id;
											return (
												<label
													key={s._id}
													className={`flex items-start gap-3.5 p-4 bg-card border rounded-xl cursor-pointer transition-colors ${isChecked ? "border-primary/40 bg-primary/5" : "border-border hover:border-white/15"
														}`}
												>
													<input
														type="radio"
														name="seg"
														checked={isChecked}
														onChange={() => setSelectedSeg(s._id)}
														className="accent-violet-500 mt-0.5"
													/>
													<div>
														<p className="text-[13px] font-semibold text-foreground">{s.segmentName}</p>
														<p className="text-[11px] text-muted-foreground mt-0.5">
															{fmtN(s.totalUserTargeted)} targeted users · {s.description}
														</p>
													</div>
												</label>
											);
										})}
									</div>
								)}
							</div>

							<button
								type="button"
								onClick={() => setStep(2)}
								className="w-full py-3 rounded-xl text-[13px] font-bold text-white hover:opacity-90 transition-opacity"
								style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
							>
								Continue →
							</button>
						</>
					)}

					{/* STEP 2: Channels, Message & Goal */}
					{step === 2 && (
						<>
							<div>
								<label className="text-[11px] text-muted-foreground font-semibold block mb-3">Delivery Channels</label>
								<div className="grid grid-cols-2 gap-2 mb-5">
									{[
										{ id: "email", label: "Email", desc: "HTML email to user inbox", icon: <Mail size={14} className="text-blue-400" /> },
										{ id: "push", label: "Push Notification", desc: "Mobile app push alert", icon: <Smartphone size={14} className="text-violet-400" /> },
										{ id: "inapp-popup", label: "In-App Pop-up", desc: "Modal overlay on app open", icon: <MonitorPlay size={14} className="text-amber-400" /> },
										{ id: "inapp-banner", label: "In-App Banner", desc: "Persistent top/bottom banner image", icon: <Image size={14} className="text-emerald-400" /> },
									].map((ch) => (
										<button
											key={ch.id}
											type="button"
											onClick={() => toggleCh(ch.id)}
											className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[12px] font-semibold border transition-all ${channels.includes(ch.id) ? "border-primary/40 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-white/15"
												}`}
										>
											{ch.icon}
											<div className="flex-1 min-w-0">
												<p className="text-[12px] font-semibold">{ch.label}</p>
												<p className="text-[10px] text-muted-foreground">{ch.desc}</p>
											</div>
											<div
												className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${channels.includes(ch.id) ? "border-primary bg-primary" : "border-border"
													}`}
											>
												{channels.includes(ch.id) && <CheckCircle2 size={10} className="text-white" />}
											</div>
										</button>
									))}
								</div>
							</div>

							{channels.includes("email") && (
								<div className="bg-card border border-border rounded-xl p-5">
									<div className="flex items-center gap-2 mb-3">
										<Mail size={13} className="text-blue-400" />
										<span className="text-[12px] font-bold text-foreground">Email Content</span>
									</div>
									<label className="text-[10px] text-muted-foreground block mb-1">Subject</label>
									<input
										value={emailSubject}
										onChange={(e) => setEmailSubject(e.target.value)}
										className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground mb-3 focus:outline-none focus:border-primary/50"
									/>
									<label className="text-[10px] text-muted-foreground block mb-1">Message Body</label>
									<textarea
										value={emailBody}
										onChange={(e) => setEmailBody(e.target.value)}
										className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground h-24 resize-none focus:outline-none focus:border-primary/50"
									/>
								</div>
							)}

							{channels.includes("in-app") && (
								<div className="bg-card border border-border rounded-xl p-5">
									<div className="flex items-center gap-2 mb-3">
										<Smartphone size={13} className="text-violet-400" />
										<span className="text-[12px] font-bold text-foreground">Push Notification Content</span>
									</div>
									<label className="text-[10px] text-muted-foreground block mb-1">Title</label>
									<input
										value={pushTitle}
										onChange={(e) => setPushTitle(e.target.value)}
										className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground mb-3 focus:outline-none focus:border-primary/50"
									/>
									<label className="text-[10px] text-muted-foreground block mb-1">Body</label>
									<input
										value={pushBody}
										onChange={(e) => setPushBody(e.target.value)}
										className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
									/>
								</div>
							)}

							{channels.includes("inapp-popup") && (
								<div className="bg-card border border-border rounded-xl p-5">
									<div className="flex items-center gap-2 mb-3">
										<MonitorPlay size={13} className="text-amber-400" />
										<span className="text-[12px] font-bold text-foreground">In-App Pop-up</span>
									</div>
									<label className="text-[10px] text-muted-foreground block mb-1">Headline</label>
									<input
										value={popupHeadline}
										onChange={(e) => setPopupHeadline(e.target.value)}
										className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground mb-2 focus:outline-none focus:border-primary/50"
									/>
									<label className="text-[10px] text-muted-foreground block mb-1">Body Text</label>
									<textarea
										value={popupBody}
										onChange={(e) => setPopupBody(e.target.value)}
										className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground h-16 resize-none mb-2 focus:outline-none focus:border-primary/50"
									/>
									<label className="text-[10px] text-muted-foreground block mb-1">CTA Button Text</label>
									<input
										value={popupCta}
										onChange={(e) => setPopupCta(e.target.value)}
										className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
									/>
								</div>
							)}

							{channels.includes("inapp-banner") && <BannerUploadWidget onBannerChange={setBannerImage} />}

							{/* Conversion Goal Selector */}
							<div className="bg-card border border-border rounded-xl p-5 space-y-4">
								<div className="flex items-center gap-2">
									<Target size={13} className="text-primary" />
									<p className="text-[12px] font-bold text-foreground">Conversion Goal</p>
									<span className="text-[10px] text-muted-foreground ml-auto">What action counts as a conversion?</span>
								</div>

								<div className="grid grid-cols-2 gap-2">
									{GOAL_OPTIONS.map((g) => (
										<button
											key={g.id}
											type="button"
											onClick={() => {
												setConversionGoal(g.id);
												setGoalScopeItems([]);
												setGoalMinAmount("");
												setGoalCount("1");
												setInviteCount("1");
												setInviteeConditions([]);
											}}
											className={`flex items-start gap-2.5 p-3 rounded-xl text-left transition-all border ${conversionGoal === g.id ? "border-primary/40 bg-primary/5" : "border-border hover:border-white/15"
												}`}
										>
											<span className="text-[14px] leading-none mt-0.5 shrink-0">{g.icon}</span>
											<div>
												<p className="text-[11px] font-semibold text-foreground">{g.label}</p>
												<p className="text-[10px] text-muted-foreground">{g.desc}</p>
											</div>
										</button>
									))}
								</div>

								{/* Deposit Config */}
								{conversionGoal === "deposit" && (
									<div className="bg-secondary/50 border border-border rounded-xl p-4 space-y-3">
										<p className="text-[11px] font-bold text-foreground">Deposit Conditions</p>
										<div>
											<label className="text-[10px] text-muted-foreground font-semibold block mb-1.5">Type</label>
											<div className="grid grid-cols-3 gap-2 mb-2">
												{Object.keys(DEPOSIT_TYPES).map((t) => (
													<button
														key={t}
														type="button"
														onClick={() => {
															setDepositType(t);
															setDepositSubtype(DEPOSIT_TYPES[t][0]);
															setDepositCurrency(t === "Crypto" ? "USDT" : "NGN");
														}}
														className={`py-2 rounded-lg text-[11px] font-bold border transition-all ${depositType === t ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
															}`}
													>
														{t}
													</button>
												))}
											</div>
											<select
												value={depositSubtype}
												onChange={(e) => setDepositSubtype(e.target.value)}
												className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
											>
												{(DEPOSIT_TYPES[depositType] || []).map((s) => (
													<option key={s}>{s}</option>
												))}
											</select>
										</div>
										<div>
											<label className="text-[10px] text-muted-foreground font-semibold block mb-1.5">
												Minimum Amount <span className="font-normal">(blank = any)</span>
											</label>
											<div className="flex gap-2">
												<select
													value={depositCurrency}
													onChange={(e) => setDepositCurrency(e.target.value)}
													className="w-24 bg-background border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground font-bold focus:outline-none focus:border-primary/50"
												>
													{(depositType === "Crypto"
														? ["USDT", "USDC", "BTC", "ETH", "SOL", "BNB", "TRX", "XRP", "MATIC", "AVAX"]
														: depositType === "Fiat"
															? ["NGN", "USD", "GBP", "EUR", "GHS", "KES", "ZAR", "CAD", "AUD"]
															: ["USD", "GBP", "EUR", "NGN", "GHS"]
													).map((c) => (
														<option key={c}>{c}</option>
													))}
												</select>
												<input
													value={depositMinAmount}
													onChange={(e) => setDepositMinAmount(e.target.value)}
													type="number"
													placeholder="e.g. 5000"
													className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-foreground font-mono focus:outline-none focus:border-primary/50"
												/>
											</div>
											{depositMinAmount && (
												<p className="text-[10px] text-primary mt-1.5 font-semibold">
													✓ Deposit ≥ {depositCurrency} {depositMinAmount} in {depositSubtype}
												</p>
											)}
										</div>
									</div>
								)}

								{/* Send / Bill Shared Config */}
								{(conversionGoal === "send" || conversionGoal === "bill") && (() => {
									const g = GOAL_OPTIONS.find((x) => x.id === conversionGoal)!;
									const items = (g as any).scopeItems as string[];
									return (
										<div className="bg-secondary/50 border border-border rounded-xl p-4 space-y-3">
											<p className="text-[11px] font-bold text-foreground">{(g as any).scopeLabel} Conditions</p>
											<div>
												<div className="flex items-center justify-between mb-2">
													<label className="text-[10px] text-muted-foreground font-semibold">
														{goalScopeItems.length === 0 ? `All ${(g as any).scopeLabel}s` : `${goalScopeItems.length} selected`}
													</label>
													{goalScopeItems.length > 1 && (
														<div className="flex items-center gap-1">
															<span className="text-[10px] text-muted-foreground">Logic:</span>
															{(["OR", "AND"] as const).map((l) => (
																<button
																	key={l}
																	type="button"
																	onClick={() => setGoalScopeLogic(l)}
																	className={`px-2 py-0.5 rounded text-[9px] font-black border transition-all ${goalScopeLogic === l ? "bg-primary/20 text-primary border-primary/40" : "border-border text-muted-foreground hover:text-foreground"
																		}`}
																>
																	{l}
																</button>
															))}
														</div>
													)}
												</div>
												<div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
													{items.map((item) => {
														const sel = goalScopeItems.includes(item);
														return (
															<button
																key={item}
																type="button"
																onClick={() => toggleScopeItem(item)}
																className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${sel ? "bg-primary/15 text-primary border-primary/40" : "border-border text-muted-foreground hover:text-foreground hover:border-white/20"
																	}`}
															>
																{item}
															</button>
														);
													})}
												</div>
												{goalScopeItems.length > 0 && (
													<p className="text-[10px] text-primary/80 mt-1.5 font-semibold">
														Match: {goalScopeItems.join(` ${goalScopeLogic} `)}
													</p>
												)}
											</div>

											<div>
												<label className="text-[10px] text-muted-foreground font-semibold block mb-1.5">
													Min Amount per Transaction <span className="font-normal">(blank = any)</span>
												</label>
												<div className="flex gap-2">
													<select
														value={goalMinCurrency}
														onChange={(e) => setGoalMinCurrency(e.target.value)}
														className="w-20 bg-background border border-border rounded-lg px-2 py-2 text-[12px] text-foreground font-bold focus:outline-none focus:border-primary/50"
													>
														{["NGN", "USD", "GBP", "EUR", "GHS"].map((c) => (
															<option key={c}>{c}</option>
														))}
													</select>
													<input
														value={goalMinAmount}
														onChange={(e) => setGoalMinAmount(e.target.value)}
														type="number"
														placeholder="e.g. 500"
														className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-foreground font-mono focus:outline-none focus:border-primary/50"
													/>
												</div>
											</div>

											<div>
												<label className="text-[10px] text-muted-foreground font-semibold block mb-1.5">
													{conversionGoal === "send" ? "Number of Sends Required" : "Number of Bill Payments Required"}
												</label>
												<div className="flex items-center gap-2">
													<button
														type="button"
														onClick={() => setGoalCount((c) => String(Math.max(1, parseInt(c) - 1)))}
														className="size-7 rounded-lg border border-border text-muted-foreground hover:text-foreground flex items-center justify-center text-[13px] font-bold"
													>
														−
													</button>
													<input
														value={goalCount}
														onChange={(e) => setGoalCount(e.target.value)}
														type="number"
														min="1"
														className="w-16 bg-background border border-border rounded-lg px-2 py-2 text-[12px] text-foreground font-mono text-center focus:outline-none focus:border-primary/50"
													/>
													<button
														type="button"
														onClick={() => setGoalCount((c) => String(parseInt(c) + 1))}
														className="size-7 rounded-lg border border-border text-muted-foreground hover:text-foreground flex items-center justify-center text-[13px] font-bold"
													>
														+
													</button>
													<span className="text-[11px] text-muted-foreground">
														time{parseInt(goalCount) !== 1 ? "s" : ""}
													</span>
												</div>
											</div>

											<div className="p-2.5 bg-primary/5 border border-primary/15 rounded-lg">
												<p className="text-[10px] text-primary font-semibold">
													✓ {conversionGoal === "send" ? "Send" : "Pay"}
													{goalMinAmount ? ` ≥ ${goalMinCurrency} ${goalMinAmount}` : ""}
													{goalScopeItems.length > 0 ? ` to ${goalScopeItems.join(` ${goalScopeLogic} `)}` : ""} — {goalCount}× required
												</p>
											</div>
										</div>
									);
								})()}

								{/* Invite Friends Config */}
								{conversionGoal === "invite" && (
									<div className="bg-secondary/50 border border-border rounded-xl p-4 space-y-3">
										<p className="text-[11px] font-bold text-foreground">Invite Conditions</p>
										<div>
											<label className="text-[10px] text-muted-foreground font-semibold block mb-1.5">Number of Friends to Invite</label>
											<div className="flex items-center gap-2">
												<button
													type="button"
													onClick={() => setInviteCount((c) => String(Math.max(1, parseInt(c) - 1)))}
													className="size-7 rounded-lg border border-border text-muted-foreground hover:text-foreground flex items-center justify-center text-[13px] font-bold"
												>
													−
												</button>
												<input
													value={inviteCount}
													onChange={(e) => setInviteCount(e.target.value)}
													type="number"
													min="1"
													className="w-16 bg-background border border-border rounded-lg px-2 py-2 text-[12px] text-foreground font-mono text-center focus:outline-none focus:border-primary/50"
												/>
												<button
													type="button"
													onClick={() => setInviteCount((c) => String(parseInt(c) + 1))}
													className="size-7 rounded-lg border border-border text-muted-foreground hover:text-foreground flex items-center justify-center text-[13px] font-bold"
												>
													+
												</button>
												<span className="text-[11px] text-muted-foreground">friend{parseInt(inviteCount) !== 1 ? "s" : ""}</span>
											</div>
										</div>

										<div>
											<div className="flex items-center justify-between mb-2">
												<label className="text-[10px] text-muted-foreground font-semibold">
													Each Invitee Must Also… <span className="font-normal">(optional)</span>
												</label>
												{inviteeConditions.length > 1 && (
													<div className="flex items-center gap-1">
														<span className="text-[10px] text-muted-foreground">Logic:</span>
														{(["AND", "OR"] as const).map((l) => (
															<button
																key={l}
																type="button"
																onClick={() => setInviteeLogic(l)}
																className={`px-2 py-0.5 rounded text-[9px] font-black border transition-all ${inviteeLogic === l ? "bg-primary/20 text-primary border-primary/40" : "border-border text-muted-foreground"
																	}`}
															>
																{l}
															</button>
														))}
													</div>
												)}
											</div>
											<div className="space-y-2">
												{inviteeConditions.map((cond, i) => (
													<div key={i} className="flex items-center gap-2">
														{i > 0 && <span className="text-[9px] font-black text-primary/60 w-6 text-center shrink-0">{inviteeLogic}</span>}
														{i === 0 && <span className="w-6 shrink-0" />}
														<select
															value={cond.type}
															onChange={(e) =>
																setInviteeConditions((s) => s.map((x, j) => (j === i ? { ...x, type: e.target.value, value: "" } : x)))
															}
															className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-primary/50"
														>
															<option value="register">Register (sign up)</option>
															<option value="kyc">Complete KYC tier…</option>
															<option value="deposit_any">Make any deposit</option>
															<option value="deposit_min">Deposit ≥ amount…</option>
															<option value="send_any">Send any amount</option>
															<option value="bill_any">Pay any bill</option>
														</select>
														{cond.type === "kyc" && (
															<select
																value={cond.value || "1"}
																onChange={(e) =>
																	setInviteeConditions((s) => s.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
																}
																className="w-20 bg-background border border-border rounded-lg px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-primary/50"
															>
																<option value="1">Tier 1</option>
																<option value="2">Tier 2</option>
																<option value="3">Tier 3</option>
															</select>
														)}
														{cond.type === "deposit_min" && (
															<input
																value={cond.value}
																onChange={(e) =>
																	setInviteeConditions((s) => s.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
																}
																type="number"
																placeholder="min $"
																className="w-20 bg-background border border-border rounded-lg px-2 py-1.5 text-[11px] font-mono text-foreground focus:outline-none focus:border-primary/50"
															/>
														)}
														<button
															type="button"
															onClick={() => setInviteeConditions((s) => s.filter((_, j) => j !== i))}
															className="text-muted-foreground hover:text-red-400 transition-colors p-1 shrink-0"
														>
															<Trash2 size={11} />
														</button>
													</div>
												))}
												<button
													type="button"
													onClick={() => setInviteeConditions((s) => [...s, { type: "register", value: "" }])}
													className="flex items-center gap-1.5 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors mt-1"
												>
													<Plus size={10} /> Add condition
												</button>
											</div>
										</div>
									</div>
								)}

								{/* KYC Config */}
								{conversionGoal === "kyc" && (
									<div className="p-3.5 bg-secondary/50 border border-border rounded-xl space-y-3">
										<p className="text-[11px] font-bold text-foreground">KYC Tier Required</p>
										<div className="grid grid-cols-3 gap-2">
											{([
												["1", "Tier 1", "BVN / NIN identity check. Wallet activation."],
												["2", "Tier 2", "Address verification + selfie + proof of address."],
												["3", "Tier 3", "Full PoA + enhanced due diligence (high-value)."],
											] as const).map(([tier, label, desc]) => (
												<button
													key={tier}
													type="button"
													onClick={() => setGoalKycTier(tier)}
													className={`p-2.5 rounded-xl border text-left transition-all ${goalKycTier === tier ? "border-primary/40 bg-primary/10" : "border-border hover:border-white/15"
														}`}
												>
													<p className={`text-[11px] font-bold mb-0.5 ${goalKycTier === tier ? "text-primary" : "text-foreground"}`}>{label}</p>
													<p className="text-[9px] text-muted-foreground leading-snug">{desc}</p>
												</button>
											))}
										</div>
									</div>
								)}

								{/* Reward Configuration */}
								<div>
									<p className="text-[11px] text-muted-foreground font-semibold mb-3 uppercase tracking-wider">Reward on Conversion</p>
									<div className="flex gap-2 mb-3">
										{[
											{ id: "cash", label: "Cash Reward" },
											{ id: "promo_code", label: "Promo Code" },
											{ id: "none", label: "No Reward" },
										].map((r) => (
											<button
												key={r.id}
												type="button"
												onClick={() => setRewardType(r.id as "cash" | "promo_code" | "none")}
												className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all ${rewardType === r.id ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
													}`}
											>
												{r.label}
											</button>
										))}
									</div>

									{rewardType === "cash" && (
										<div className="flex gap-2">
											<select
												value={rewardCurrency}
												onChange={(e) => setRewardCurrency(e.target.value)}
												className="w-24 bg-secondary border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground font-bold focus:outline-none focus:border-primary/50"
											>
												{GOAL_CURRENCIES.map((c) => (
													<option key={c}>{c}</option>
												))}
											</select>
											<input
												value={rewardAmount}
												onChange={(e) => setRewardAmount(e.target.value)}
												type="number"
												placeholder="e.g. 5000"
												className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground font-mono focus:outline-none focus:border-primary/50"
											/>
										</div>
									)}

									{rewardType === "promo_code" && (
										<input
											value={rewardPromoCode}
											onChange={(e) => setRewardPromoCode(e.target.value)}
											placeholder="e.g. WELCOME50"
											className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground font-mono focus:outline-none focus:border-primary/50"
										/>
									)}

									{rewardType !== "none" && (
										<div className="mt-2 p-3 bg-primary/5 border border-primary/15 rounded-xl">
											<p className="text-[10px] text-primary font-semibold">
												{rewardType === "cash" && rewardAmount
													? `${rewardCurrency} ${rewardAmount} credited to wallet when goal is met`
													: rewardType === "promo_code" && rewardPromoCode
														? `Promo code "${rewardPromoCode}" issued on goal completion`
														: "Enter reward details above"}
											</p>
										</div>
									)}
								</div>
							</div>

							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => setStep(1)}
									className="px-5 border border-border text-muted-foreground text-[13px] rounded-xl py-3 hover:text-foreground transition-colors bg-secondary/50"
								>
									← Back
								</button>
								<button
									type="button"
									onClick={() => setStep(3)}
									className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white hover:opacity-90 transition-opacity"
									style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
								>
									Continue →
								</button>
							</div>
						</>
					)}

					{/* STEP 3: Timing & Delivery Strategy */}
					{step === 3 && (
						<>
							<div>
								<label className="text-[11px] text-muted-foreground font-semibold block mb-3">Delivery Strategy</label>
								<div className="space-y-2">
									{[
										{
											id: "drip-timebase",
											icon: "⏱",
											l: "Drip — Time-based sequence",
											d: "Send a series of messages at fixed intervals after the user enters. Best for onboarding, first-deposit nudges, long-tail activation.",
										},
										{
											id: "event-trigger",
											icon: "⚡",
											l: "Event-triggered",
											d: "Fire a single message when a user does (or fails to do) something. Best for abandon-flow nudges and real-time contextual pushes.",
										},
										{
											id: "one-time broadcast",
											icon: "📣",
											l: "One-time broadcast",
											d: "Send once to everyone in the segment at a specific date and time. Best for promotions, new features, and flash campaigns.",
										},
									].map((t) => (
										<button
											key={t.id}
											type="button"
											onClick={() => setCampaignType(t.id as "drip-timebase" | "event-trigger" | "one-time broadcast")}
											className={`flex items-start gap-3.5 p-4 w-full bg-card border rounded-xl text-left cursor-pointer transition-colors ${campaignType === t.id ? "border-primary/40 bg-primary/5" : "border-border hover:border-white/15"
												}`}
										>
											<span className="text-[18px] leading-none mt-0.5 shrink-0">{t.icon}</span>
											<div>
												<p className="text-[13px] font-semibold text-foreground">{t.l}</p>
												<p className="text-[11px] text-muted-foreground mt-0.5">{t.d}</p>
											</div>
											<div
												className={`size-4 rounded-full border flex items-center justify-center mt-1 shrink-0 ml-auto ${campaignType === t.id ? "border-primary bg-primary" : "border-border"
													}`}
											>
												{campaignType === t.id && <span className="size-1.5 rounded-full bg-white block" />}
											</div>
										</button>
									))}
								</div>
							</div>

							{/* Drip Schedule */}
							{campaignType === "drip-timebase" && (
								<div className="bg-card border border-border rounded-xl p-5">
									<div className="flex items-center justify-between mb-4">
										<div>
											<p className="text-[12px] font-bold text-foreground">Drip Schedule</p>
											<p className="text-[10px] text-muted-foreground mt-0.5">Each step fires at its delay after the user enters the campaign</p>
										</div>
										<button
											type="button"
											onClick={() => setDripSteps((s) => [...s, { delay: `Day ${(s.length + 1) * 2}`, message: "", enabled: true }])}
											className="flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
										>
											<Plus size={12} /> Add Step
										</button>
									</div>
									<div className="space-y-2.5">
										{dripSteps.map((d, i) => (
											<div key={i} className="flex items-center gap-2">
												<input
													value={d.delay}
													onChange={(e) => setDripSteps((s) => s.map((x, j) => (j === i ? { ...x, delay: e.target.value } : x)))}
													placeholder="Day 1"
													className="w-16 bg-secondary border border-border rounded-lg px-2 py-2 text-[11px] font-mono font-bold text-primary text-center focus:outline-none focus:border-primary/50"
												/>
												<input
													value={d.message}
													onChange={(e) => setDripSteps((s) => s.map((x, j) => (j === i ? { ...x, message: e.target.value } : x)))}
													placeholder="Message for this step…"
													className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
												/>
												<button
													type="button"
													onClick={() => setDripSteps((s) => s.map((x, j) => (j === i ? { ...x, enabled: !x.enabled } : x)))}
													className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all shrink-0 ${d.enabled ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border-zinc-700"
														}`}
												>
													{d.enabled ? "ON" : "OFF"}
												</button>
												{dripSteps.length > 1 && (
													<button
														type="button"
														onClick={() => setDripSteps((s) => s.filter((_, j) => j !== i))}
														className="text-muted-foreground hover:text-red-400 transition-colors p-1 shrink-0"
													>
														<Trash2 size={12} />
													</button>
												)}
											</div>
										))}
									</div>
								</div>
							)}

							{/* Event Triggered Config */}
							{campaignType === "event-trigger" && (
								<div className="bg-card border border-border rounded-xl p-5 space-y-4">
									<p className="text-[12px] font-bold text-foreground">Trigger Configuration</p>
									<div>
										<label className="text-[10px] text-muted-foreground font-semibold block mb-1.5">Trigger Event</label>
										<select
											value={eventTrigger}
											onChange={(e) => setEventTrigger(e.target.value)}
											className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-primary/50"
										>
											<optgroup label="Account">
												<option value="user_registers">User registers</option>
												<option value="user_kyc">User completes KYC (tier…)</option>
											</optgroup>
											<optgroup label="Deposits">
												<option value="first_deposit">User makes first deposit</option>
												<option value="deposit_below_threshold">User deposits below threshold</option>
											</optgroup>
											<optgroup label="Inactivity">
												<option value="no_activity_7d">No activity for 7 days</option>
												<option value="no_activity_14d">No activity for 14 days</option>
												<option value="no_activity_30d">No activity for 30 days</option>
											</optgroup>
										</select>
									</div>
									<div>
										<label className="text-[10px] text-muted-foreground font-semibold block mb-1.5">Send Message…</label>
										<div className="grid grid-cols-2 gap-2">
											{[
												{ id: "immediately", l: "Immediately" },
												{ id: "1h", l: "1 hour after" },
												{ id: "6h", l: "6 hours after" },
												{ id: "24h", l: "24 hours after" },
												{ id: "48h", l: "48 hours after" },
											].map((d) => (
												<button
													key={d.id}
													type="button"
													onClick={() => setEventDelay(d.id)}
													className={`py-2 rounded-lg text-[11px] font-bold border transition-all ${eventDelay === d.id ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
														}`}
												>
													{d.l}
												</button>
											))}
										</div>
									</div>
								</div>
							)}

							{/* Broadcast Config */}
							{campaignType === "one-time broadcast" && (
								<div className="bg-card border border-border rounded-xl p-5 space-y-4">
									<p className="text-[12px] font-bold text-foreground">Broadcast Schedule</p>
									<div className="grid grid-cols-2 gap-3">
										<div>
											<label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Send Date</label>
											<input
												type="date"
												value={broadcastDate}
												onChange={(e) => setBroadcastDate(e.target.value)}
												min={new Date().toISOString().split("T")[0]}
												className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-primary/50 [color-scheme:dark]"
											/>
										</div>
										<div>
											<label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Send Time</label>
											<input
												type="time"
												value={broadcastTime}
												onChange={(e) => setBroadcastTime(e.target.value)}
												className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-primary/50 [color-scheme:dark]"
											/>
										</div>
									</div>
								</div>
							)}

							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => setStep(2)}
									className="px-5 border border-border text-muted-foreground text-[13px] rounded-xl py-3 hover:text-foreground transition-colors bg-secondary/50"
								>
									← Back
								</button>
								<button
									type="button"
									onClick={() => setStep(4)}
									className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white hover:opacity-90 transition-opacity"
									style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
								>
									Review →
								</button>
							</div>
						</>
					)}

					{/* STEP 4: Review & Activate */}
					{step === 4 && (
						<>
							<div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden mb-2">
								{[
									{
										l: "Target Segment",
										v: currentSegment
											? `${currentSegment.segmentName} (${fmtN(currentSegment.totalUserTargeted)} users targeted)`
											: "None selected",
									},
									{ l: "Delivery Channels", v: channels.join(", ") },
									{
										l: "Delivery Strategy",
										v:
											campaignType === "drip-timebase"
												? `Drip — ${dripSteps.filter((d) => d.enabled).length} steps`
												: campaignType === "event-trigger"
													? `Event: ${eventTrigger.replace(/_/g, " ")} → ${eventDelay}`
													: `Broadcast: ${broadcastDate || "Now"} ${broadcastTime}`,
									},
									{ l: "Conversion Goal", v: GOAL_OPTIONS.find((g) => g.id === conversionGoal)?.label ?? conversionGoal },
									{
										l: "Reward on Goal Hit",
										v: rewardType === "cash" ? `${rewardCurrency} ${rewardAmount || "—"}` : rewardType === "promo_code" ? `Promo: ${rewardPromoCode}` : "None",
									},
								].map((r) => (
									<div key={r.l} className="flex items-center justify-between px-5 py-3.5">
										<span className="text-[12px] text-muted-foreground">{r.l}</span>
										<span className={`text-[12px] font-semibold ${r.l === "Conversion Goal" ? "text-primary" : r.l === "Reward on Goal Hit" ? "text-emerald-400" : "text-foreground"}`}>
											{r.v}
										</span>
									</div>
								))}
							</div>

							<div className="p-4 bg-primary/5 border border-primary/15 rounded-xl mb-4">
								<p className="text-[11px] text-muted-foreground font-semibold mb-1">Target Recipient Emails:</p>
								<p className="text-[13px] font-bold text-primary">
									{fmtN(currentSegment?.totalUserTargeted || currentSegment?.emails?.length || 0)} user email recipient(s) will receive this campaign.
								</p>
							</div>

							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => setStep(3)}
									disabled={createCampaignMutation.isPending}
									className="px-5 border border-border text-muted-foreground text-[13px] rounded-xl py-3 hover:text-foreground transition-colors bg-secondary/50"
								>
									← Back
								</button>
								<button
									type="button"
									onClick={handleActivateCampaign}
									disabled={createCampaignMutation.isPending}
									className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
									style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
								>
									{createCampaignMutation.isPending ? (
										<>
											<LoadingSpinner size="sm" /> Creating Campaign...
										</>
									) : (
										<>
											<Play size={14} /> Create & Activate Campaign
										</>
									)}
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		);
	}

	// ─── Campaigns Table / List View ─────────────────────────────────────────

	const paginatedCampaigns = displayedCampaigns.slice((campaignPg - 1) * campaignPerPage, campaignPg * campaignPerPage);

	return (
		<div className="flex flex-col space-y-6 min-h-full flex-1" onClick={() => setOpenMenu(null)}>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Campaigns</h1>
					<p className="text-xs sm:text-sm text-muted-foreground">Multi-channel messaging campaigns targeting your user segments</p>
				</div>
				<Button
					type="button"
					onClick={() => {
						setView("new");
						setStep(1);
					}}
					className="text-white font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-glow text-[13px] w-full sm:w-auto shrink-0"
				>
					<Plus size={14} /> New Campaign
				</Button>
			</div>

			{/* Metrics Row: Total Campaigns, Active Campaigns, Total Sent */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<StatCard
					label="Total Campaigns"
					value={fmtN(typeof totalCampaignsData?.data === "number" ? totalCampaignsData.data : liveCampaigns.length)}
					isLoading={isTotalCampaignsLoading}
				/>
				<StatCard
					label="Active Campaigns"
					value={fmtN(typeof totalActiveCampaignsData?.data === "number" ? totalActiveCampaignsData.data : liveCampaigns.filter((c) => c.status === "active").length)}
					isLoading={isTotalActiveCampaignsLoading}
				/>
				<StatCard
					label="Total Campaign Sent"
					value={fmtN(typeof totalCampaignSentData?.data === "number" ? totalCampaignSentData.data : 0)}
					isLoading={isTotalCampaignSentLoading}
				/>
			</div>

			{/* Campaigns Table Card */}
			<Card className="bg-gradient-card border-border/50 shadow-card flex-1 flex flex-col min-h-0">
				<CardContent className="flex-1 flex flex-col min-h-0 p-4 md:p-6 space-y-4 overflow-hidden">
					{/* Tab Switcher for Active vs Trash/Deleted */}
					<div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3 flex-wrap">
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => { setListTab("active"); setCampaignPg(1); }}
								className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
									listTab === "active"
										? "bg-primary text-white shadow-sm"
										: "bg-secondary/60 text-muted-foreground hover:text-foreground border border-border"
								}`}
							>
								Active Campaigns ({liveCampaigns.length})
							</button>
							<button
								type="button"
								onClick={() => { setListTab("deleted"); setCampaignPg(1); }}
								className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 ${
									listTab === "deleted"
										? "bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm"
										: "bg-secondary/60 text-muted-foreground hover:text-foreground border border-border"
								}`}
							>
								<Archive size={13} /> Trash / Deleted ({deletedCampaigns.length})
							</button>
						</div>
					</div>

					<div className="flex-1 overflow-x-auto w-full rounded-lg border border-border/50">
						<table className="w-full text-left text-[13px]">
							<thead className="bg-muted/30 text-muted-foreground text-[11px] font-semibold border-b border-border/50 uppercase tracking-wider">
								<tr>
									<th className="px-5 py-3">Campaign</th>
									<th className="px-5 py-3">Deposit Type</th>
									<th className="px-5 py-3">Reward</th>
									<th className="px-5 py-3">Channels</th>
									<th className="px-5 py-3">Sent</th>
									<th className="px-5 py-3">Open Rate</th>
									<th className="px-5 py-3">Status</th>
									<th className="px-5 py-3 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/50">
								{isCampaignsLoading ? (
									<tr>
										<td colSpan={8} className="text-center py-12">
											<div className="flex items-center justify-center gap-2 text-muted-foreground">
												<LoadingSpinner size="sm" />
											</div>
										</td>
									</tr>
								) : paginatedCampaigns.length === 0 ? (
									<tr>
										<td colSpan={8} className="text-center py-8 text-muted-foreground">
											{listTab === "deleted"
												? "No deleted campaigns found in trash."
												: 'No campaigns found. Click "New Campaign" to create one.'}
										</td>
									</tr>
								) : (
									paginatedCampaigns.map((c) => (
										<tr
											key={c._id}
											className="hover:bg-white/[0.02] transition-colors cursor-pointer"
											onClick={() => setSelectedCampaignId(c._id)}
										>
											<td className="px-5 py-3.5">
												<p className="text-[13px] font-semibold text-foreground">{c.campaignName}</p>
												<p className="text-[10px] text-muted-foreground">
													{c.recipients?.length || c.totalRecipients || 0} recipients · {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
												</p>
											</td>
											<td className="px-5 py-3.5 max-w-[160px]">
												<div className="flex items-start gap-1.5">
													<Target size={11} className="text-primary mt-0.5 shrink-0" />
													<span className="text-[11px] font-semibold text-foreground leading-snug">
														{c.depositType || c.deliveryStrategy || "—"}
													</span>
												</div>
											</td>
											<td className="px-5 py-3.5">
												<span className="text-[11px] font-semibold text-emerald-400">
													{c.conversionReward || "—"}
												</span>
											</td>
											<td className="px-5 py-3.5">
												<div className="flex gap-1 flex-wrap">
													{(c.campaignType || "email").split(",").map((ch) => (
														<ChannelBadge key={ch} ch={ch} />
													))}
												</div>
											</td>
											<td className="px-5 py-3.5 text-[12px] font-mono text-foreground">
												{fmtN(c.totalSent ?? c.recipients?.length ?? 0)}
											</td>
											<td className="px-5 py-3.5 text-[12px] font-mono text-foreground">
												{c.totalSent ? Math.round(((c.totalOpened || 0) / c.totalSent) * 100) : 0}%
											</td>
											<td className="px-5 py-3.5">
												<StatusBadge status={c.isDeleted ? "deleted" : c.status} />
											</td>
											<td className="px-5 py-3.5 text-right relative" onClick={(e) => e.stopPropagation()}>
												{listTab === "deleted" ? (
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={(e) => {
															e.stopPropagation();
															restoreCampaignMutation.mutate(c._id);
														}}
														disabled={restoreCampaignMutation.isPending}
														className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 text-[11px] font-bold gap-1.5"
													>
														{restoreCampaignMutation.isPending ? (
															<LoadingSpinner size="sm" />
														) : (
															<>
																<RotateCcw size={12} /> Restore
															</>
														)}
													</Button>
												) : (
													<>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																setOpenMenu(openMenu === c._id ? null : c._id);
															}}
															className="text-muted-foreground hover:text-foreground transition-colors p-1"
														>
															<MoreHorizontal size={14} />
														</button>
														{openMenu === c._id && (
															<div
																onClick={(e) => e.stopPropagation()}
																className="absolute right-5 top-10 w-40 bg-card border border-border rounded-xl shadow-xl p-1 z-50 text-left"
															>
																<button
																	type="button"
																	onClick={() => {
																		setSelectedCampaignId(c._id);
																		setOpenMenu(null);
																	}}
																	className="w-full flex items-center gap-2 px-3 py-2 text-[12px] rounded-lg hover:bg-white/5 text-foreground"
																>
																	<Eye size={13} /> View Details
																</button>
																<button
																	type="button"
																	onClick={() => {
																		setEditingCampaign(c);
																		setOpenMenu(null);
																	}}
																	className="w-full flex items-center gap-2 px-3 py-2 text-[12px] rounded-lg hover:bg-white/5 text-foreground"
																>
																	<Edit size={13} /> Edit
																</button>
																<button
																	type="button"
																	onClick={() => {
																		handleToggleStatus(c._id, c.status);
																		setOpenMenu(null);
																	}}
																	className="w-full flex items-center gap-2 px-3 py-2 text-[12px] rounded-lg hover:bg-white/5 text-foreground"
																>
																	{c.status === "active" ? (
																		<>
																			<PauseCircle size={13} className="text-amber-400" /> Pause
																		</>
																	) : (
																		<>
																			<PlayCircle size={13} className="text-emerald-400" /> Resume
																		</>
																	)}
																</button>
																<button
																	type="button"
																	onClick={() => {
																		handleDeleteCampaign(c._id);
																		setOpenMenu(null);
																	}}
																	className="w-full flex items-center gap-2 px-3 py-2 text-[12px] rounded-lg hover:bg-red-500/10 text-red-400"
																>
																	<Trash2 size={13} /> Delete
																</button>
															</div>
														)}
													</>
												)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					{/* Table Pagination */}
					{liveCampaigns.length > 0 && (
						<div className="flex items-center justify-between pt-2 border-t border-border/50 shrink-0">
							<span className="text-[12px] text-muted-foreground">
								Showing {Math.min((campaignPg - 1) * campaignPerPage + 1, liveCampaigns.length)} -{" "}
								{Math.min(campaignPg * campaignPerPage, liveCampaigns.length)} of {liveCampaigns.length} campaigns
							</span>
							<div className="flex items-center gap-2">
								<button
									type="button"
									disabled={campaignPg === 1}
									onClick={() => setCampaignPg((p) => Math.max(1, p - 1))}
									className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
								>
									<ChevronLeft size={14} />
								</button>
								<span className="text-[12px] font-medium text-foreground">
									Page {campaignPg} of {Math.ceil(liveCampaigns.length / campaignPerPage) || 1}
								</span>
								<button
									type="button"
									disabled={campaignPg >= Math.ceil(liveCampaigns.length / campaignPerPage)}
									onClick={() => setCampaignPg((p) => Math.min(Math.ceil(liveCampaigns.length / campaignPerPage), p + 1))}
									className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
								>
									<ChevronRight size={14} />
								</button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Slide Sheet for View Details */}
			<CampaignDetailSheet
				campaignId={selectedCampaignId}
				onClose={() => setSelectedCampaignId(null)}
				onUpdateStatus={(id, currentStatus) => handleToggleStatus(id, currentStatus)}
			/>

			{/* Modal Dialog for Edit Campaign */}
			<EditCampaignDialog
				campaign={editingCampaign}
				onClose={() => setEditingCampaign(null)}
				onSave={(data) => {
					if (editingCampaign) {
						updateCampaignMutation.mutate({ id: editingCampaign._id, data });
					}
				}}
				isSaving={updateCampaignMutation.isPending}
			/>

			{/* Delete Confirmation Modal Dialog */}
			<Dialog open={!!deletingCampaignId} onOpenChange={(open) => { if (!open) setDeletingCampaignId(null); }}>
				<DialogContent className="sm:max-w-md bg-card border border-border">
					<DialogHeader>
						<DialogTitle className="text-lg font-bold text-foreground">Delete Campaign</DialogTitle>
					</DialogHeader>
					<div className="py-2 text-[13px] text-muted-foreground">
						Are you sure you want to delete this campaign? This action cannot be undone.
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						<button
							type="button"
							onClick={() => setDeletingCampaignId(null)}
							disabled={deleteCampaignMutation.isPending}
							className="px-4 py-2 text-[12px] font-semibold border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={() => {
								if (deletingCampaignId) {
									deleteCampaignMutation.mutate(deletingCampaignId);
								}
							}}
							disabled={deleteCampaignMutation.isPending}
							className="px-4 py-2 text-[12px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
						>
							{deleteCampaignMutation.isPending ? <LoadingSpinner size="sm" /> : "Delete Campaign"}
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default Campaigns;