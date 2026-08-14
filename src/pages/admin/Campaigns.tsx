import React, { useState, useMemo, useRef } from "react";
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
	Download,
	Calendar,
} from "lucide-react";
import { usersAPI, campaignAPI, User } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";

// ─── Helpers & Formatting ───────────────────────────────────────────────────

function fmtN(num: number) {
	return new Intl.NumberFormat().format(num);
}

function StatCard({ label, value }: { label: string; value: string }) {
	return (
		<Card className="bg-gradient-card border-border/50 shadow-card">
			<CardContent className="p-5">
				<p className="text-[12px] font-medium text-muted-foreground">{label}</p>
				<p className="text-2xl font-bold tracking-tight text-foreground mt-1">{value}</p>
			</CardContent>
		</Card>
	);
}

function StatusBadge({ status }: { status: string }) {
	if (status === "active") {
		return (
			<Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
				Active
			</Badge>
		);
	}
	if (status === "paused") {
		return (
			<Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
				Paused
			</Badge>
		);
	}
	return (
		<Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">
			{status}
		</Badge>
	);
}

function ChannelBadge({ ch }: { ch: string }) {
	switch (ch) {
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
			return (
				<Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] gap-1">
					<MonitorPlay size={10} /> In-App Pop-up
				</Badge>
			);
		case "inapp-banner":
			return (
				<Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] gap-1">
					<Image size={10} /> In-App Banner
				</Badge>
			);
		default:
			return <Badge variant="outline" className="text-[10px]">{ch}</Badge>;
	}
}

// ─── Goal & Segment Constants ───────────────────────────────────────────────

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

const INITIAL_CAMPAIGNS = [
	{
		id: "c1",
		name: "First Deposit 7-Day Push",
		segment: "New Users — No First Deposit",
		channels: ["push", "email"],
		status: "active",
		sent: 1420,
		opened: 852,
		converted: 312,
		steps: 4,
		date: "Aug 01",
		goal: "Deposit",
		reward: "NGN 5,000",
	},
	{
		id: "c2",
		name: "Dormant User Re-Engagement",
		segment: "Lapsed Users — No Deposit",
		channels: ["email"],
		status: "active",
		sent: 3890,
		opened: 1120,
		converted: 145,
		steps: 3,
		date: "Aug 05",
		goal: "Send Money",
		reward: "Promo: WELCOME20",
	},
	{
		id: "c3",
		name: "KYC Tier 2 Nudge",
		segment: "Deposited, Never Transacted",
		channels: ["push", "inapp-popup"],
		status: "paused",
		sent: 940,
		opened: 420,
		converted: 88,
		steps: 2,
		date: "Jul 20",
		goal: "KYC Verification",
		reward: "None",
	},
];

// ─── Banner Upload Widget ───────────────────────────────────────────────────

function BannerUploadWidget() {
	const [preview, setPreview] = React.useState<string | null>(null);
	const [bannerPos, setBannerPos] = React.useState<"Top" | "Bottom">("Top");
	const [deepLink, setDeepLink] = React.useState("");
	const [dragging, setDragging] = React.useState(false);
	const fileRef = React.useRef<HTMLInputElement>(null);

	const handleFile = (file: File) => {
		if (!file.type.startsWith("image/")) return;
		const reader = new FileReader();
		reader.onload = (e) => setPreview(e.target?.result as string);
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

// ─── Main Campaigns Component ───────────────────────────────────────────────

const Campaigns = () => {
	const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS);
	const [view, setView] = useState<"list" | "new">("list");
	const [step, setStep] = useState(1);
	const [campaignName, setCampaignName] = useState("");
	const [selectedSeg, setSelectedSeg] = useState("s1");
	const [channels, setChannels] = useState(["email", "push"]);
	const [openMenu, setOpenMenu] = useState<string | null>(null);
	const [campaignPg, setCampaignPg] = useState(1);
	const campaignPerPage = 5;

	// Custom Message Contents
	const [emailSubject, setEmailSubject] = useState("Make your first deposit and get up to ₦5,000 instantly");
	const [emailBody, setEmailBody] = useState("Hi {{first_name}}, welcome to Ravasend! Deposit within 7 days to unlock your ₦5,000 reward.");
	const [pushTitle, setPushTitle] = useState("💸 Your ₦5,000 reward is waiting!");
	const [pushBody, setPushBody] = useState("Make your first deposit within 7 days to claim it");
	const [popupHeadline, setPopupHeadline] = useState("Your ₦5,000 reward is waiting!");
	const [popupBody, setPopupBody] = useState("Deposit within 7 days to unlock your instant cash reward. No minimum amount required.");
	const [popupCta, setPopupCta] = useState("Deposit Now");

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
	const [campaignType, setCampaignType] = useState<"drip" | "event" | "broadcast">("drip");
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

	// ─── Real Users Query & Segment Filtering ─────────────────────────────────

	const { data: usersData, isLoading: isUsersLoading } = useQuery({
		queryKey: ["users"],
		queryFn: usersAPI.getAll,
	});

	const users: User[] = useMemo(() => usersData?.users || [], [usersData]);

	// Compute segments based on user data
	const segments = useMemo(() => {
		const isNoFirstDeposit = (u: User) => String(u.isFirstDeposit) === "false" || !u.isFirstDeposit;
		const isFirstDepositDone = (u: User) => String(u.isFirstDeposit) === "true";
		const isFirstConversionDone = (u: User) => String(u.isFirstConversion) === "true";
		const isNoFirstConversion = (u: User) => String(u.isFirstConversion) === "false" || !u.isFirstConversion;

		const s1Users = users.filter(isNoFirstDeposit);
		const s2Users = users.filter((u) => isFirstDepositDone(u) && isNoFirstConversion(u));
		const s3Users = users.filter((u) => isFirstConversionDone(u) && (!u.referredBy || u.referredBy === null || u.referredBy === ""));
		const s4Users = users.filter((u) => {
			const regDays = (Date.now() - new Date(u.createdAt).getTime()) / (1000 * 3600 * 24);
			return isNoFirstDeposit(u) && regDays > 7;
		});
		const s5Users = users.filter((u) => {
			const hasBalance = (u.nairaWallet ?? 0) > 0 || (u.dollarWallet ?? 0) > 0;
			const lastLoginTime = u.lastLogin ? new Date(u.lastLogin).getTime() : 0;
			const inactiveDays = lastLoginTime > 0 ? (Date.now() - lastLoginTime) / (1000 * 3600 * 24) : 999;
			return hasBalance && inactiveDays > 14;
		});

		return [
			{
				id: "s1",
				name: "New Users — No First Deposit",
				description: "Registered users who have not made their first deposit",
				users: s1Users,
				userCount: s1Users.length,
			},
			{
				id: "s2",
				name: "Deposited, Never Transacted",
				description: "Users who deposited but have not executed any conversion transaction",
				users: s2Users,
				userCount: s2Users.length,
			},
			{
				id: "s3",
				name: "Transactors — Zero Referrals",
				description: "Active transacting users who have not referred anyone",
				users: s3Users,
				userCount: s3Users.length,
			},
			{
				id: "s4",
				name: "Lapsed Users — No Deposit (>7 days)",
				description: "Registered over 7 days ago with zero deposit activity",
				users: s4Users,
				userCount: s4Users.length,
			},
			{
				id: "s5",
				name: "Churned Active Users (Wallet > 0, Inactive >14 days)",
				description: "Hold positive balance but inactive for over 14 days",
				users: s5Users,
				userCount: s5Users.length,
			},
			{
				id: "s6",
				name: "All Registered Users",
				description: "Target all verified and registered users on Ravasend",
				users: users,
				userCount: users.length,
			},
		];
	}, [users]);

	// Selected target users
	const currentSegment = segments.find((s) => s.id === selectedSeg) || segments[0];

	// ─── Mutations for Bulk Email & Push Notifications ────────────────────────

	const sendBulkEmailMutation = useMutation({
		mutationFn: campaignAPI.sendBulkEmail,
	});

	const sendBulkPushMutation = useMutation({
		mutationFn: campaignAPI.sendBulkPushNotification,
	});

	const [isSubmitting, setIsSubmitting] = useState(false);

	const toggleScopeItem = (item: string) =>
		setGoalScopeItems((s) => (s.includes(item) ? s.filter((x) => x !== item) : [...s, item]));
	const toggleCh = (ch: string) =>
		setChannels((p) => (p.includes(ch) ? p.filter((c) => c !== ch) : [...p, ch]));
	const stepsList = ["Segment", "Message & Goal", "Timing", "Review"];

	const toggleStatus = (id: string) =>
		setCampaigns((c) =>
			c.map((x) => (x.id === id ? { ...x, status: x.status === "active" ? "paused" : "active" } : x))
		);
	const deleteCampaign = (id: string) => setCampaigns((c) => c.filter((x) => x.id !== id));

	// ─── Activate Campaign Handler ────────────────────────────────────────────

	const handleActivateCampaign = async () => {
		setIsSubmitting(true);
		const targetUsers = currentSegment.users;
		const finalName = campaignName.trim() || `Campaign for ${currentSegment.name}`;

		let emailSuccessCount = 0;
		let pushSuccessCount = 0;
		const errors: string[] = [];

		// 1. Bulk Email Execution
		if (channels.includes("email")) {
			const emailRecipients = targetUsers.map((u) => u.email).filter(Boolean);
			if (emailRecipients.length > 0) {
				try {
					await sendBulkEmailMutation.mutateAsync({
						subject: emailSubject || finalName,
						message: emailBody,
						recipients: emailRecipients,
					});
					emailSuccessCount = emailRecipients.length;
				} catch (err: any) {
					errors.push(`Email error: ${err?.response?.data?.message || err.message || "Failed to send emails"}`);
				}
			} else {
				errors.push("No valid email addresses found in the selected segment");
			}
		}

		// 2. Bulk Push Notification Execution
		if (channels.includes("push")) {
			const fcmTokens = targetUsers.map((u) => (u as any).fcmToken).filter((t): t is string => Boolean(t));
			if (fcmTokens.length > 0) {
				try {
					await sendBulkPushMutation.mutateAsync({
						subject: pushTitle || finalName,
						message: pushBody,
						recipients: fcmTokens,
					});
					pushSuccessCount = fcmTokens.length;
				} catch (err: any) {
					errors.push(`Push error: ${err?.response?.data?.message || err.message || "Failed to send push notifications"}`);
				}
			} else {
				errors.push("No valid FCM push tokens found for users in the selected segment");
			}
		}

		setIsSubmitting(false);

		if (errors.length > 0 && emailSuccessCount === 0 && pushSuccessCount === 0) {
			toast({
				variant: "destructive",
				title: "Campaign Dispatch Failed",
				description: errors.join(" • "),
			});
			return;
		}

		const goalLabel = GOAL_OPTIONS.find((g) => g.id === conversionGoal)?.label ?? conversionGoal;
		const rewardLabel =
			rewardType === "cash"
				? `${rewardCurrency} ${rewardAmount}`
				: rewardType === "promo_code"
					? `Promo: ${rewardPromoCode}`
					: "None";

		const newCamp = {
			id: `c_${Date.now()}`,
			name: finalName,
			segment: currentSegment.name,
			channels: [...channels],
			status: "active",
			sent: emailSuccessCount + pushSuccessCount || targetUsers.length,
			opened: 0,
			converted: 0,
			steps: campaignType === "drip" ? dripSteps.filter((d) => d.enabled).length : 1,
			date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
			goal: goalLabel,
			reward: rewardLabel,
		};

		setCampaigns((c) => [newCamp, ...c]);
		setView("list");
		setStep(1);

		toast({
			title: "Campaign Activated!",
			description: `Successfully sent bulk notifications to ${currentSegment.name} (${emailSuccessCount} emails, ${pushSuccessCount} push tokens).`,
		});
	};

	// ─── Create New Campaign View ─────────────────────────────────────────────

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
								<div className="space-y-2">
									{segments.map((s) => (
										<label
											key={s.id}
											className={`flex items-start gap-3.5 p-4 bg-card border rounded-xl cursor-pointer transition-colors ${selectedSeg === s.id ? "border-primary/40 bg-primary/5" : "border-border hover:border-white/15"
												}`}
										>
											<input
												type="radio"
												name="seg"
												checked={selectedSeg === s.id}
												onChange={() => setSelectedSeg(s.id)}
												className="accent-violet-500 mt-0.5"
											/>
											<div>
												<p className="text-[13px] font-semibold text-foreground">{s.name}</p>
												<p className="text-[11px] text-muted-foreground mt-0.5">
													{fmtN(s.userCount)} users · {s.description}
												</p>
											</div>
										</label>
									))}
								</div>
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

							{channels.includes("push") && (
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

							{channels.includes("inapp-banner") && <BannerUploadWidget />}

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
											id: "drip",
											icon: "⏱",
											l: "Drip — Time-based sequence",
											d: "Send a series of messages at fixed intervals after the user enters. Best for onboarding, first-deposit nudges, long-tail activation.",
										},
										{
											id: "event",
											icon: "⚡",
											l: "Event-triggered",
											d: "Fire a single message when a user does (or fails to do) something. Best for abandon-flow nudges and real-time contextual pushes.",
										},
										{
											id: "broadcast",
											icon: "📣",
											l: "One-time broadcast",
											d: "Send once to everyone in the segment at a specific date and time. Best for promotions, new features, and flash campaigns.",
										},
									].map((t) => (
										<button
											key={t.id}
											type="button"
											onClick={() => setCampaignType(t.id as "drip" | "event" | "broadcast")}
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
							{campaignType === "drip" && (
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
							{campaignType === "event" && (
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
							{campaignType === "broadcast" && (
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
									{ l: "Target Segment", v: `${currentSegment.name} (${fmtN(currentSegment.userCount)} users)` },
									{ l: "Delivery Channels", v: channels.join(", ") },
									{
										l: "Delivery Strategy",
										v:
											campaignType === "drip"
												? `Drip — ${dripSteps.filter((d) => d.enabled).length} steps`
												: campaignType === "event"
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
								<p className="text-[11px] text-muted-foreground font-semibold mb-1">Target Dispatch Count:</p>
								<p className="text-[13px] font-bold text-primary">
									{channels.includes("email") && `${currentSegment.userCount} emails to send. `}
									{channels.includes("push") &&
										`${currentSegment.users.filter((u) => Boolean((u as any).fcmToken)).length} push tokens to send.`}
								</p>
							</div>

							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => setStep(3)}
									disabled={isSubmitting}
									className="px-5 border border-border text-muted-foreground text-[13px] rounded-xl py-3 hover:text-foreground transition-colors bg-secondary/50"
								>
									← Back
								</button>
								<button
									type="button"
									onClick={handleActivateCampaign}
									disabled={isSubmitting}
									className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
									style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
								>
									{isSubmitting ? (
										<>
											<LoadingSpinner size="sm" /> Dispatching Campaign...
										</>
									) : (
										<>
											<Play size={14} /> Activate & Send Campaign
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

	const totalSent = campaigns.reduce((a, c) => a + c.sent, 0);
	const totalConverted = campaigns.reduce((a, c) => a + c.converted, 0);
	const totalActive = campaigns.filter((c) => c.status === "active").length;

	const paginatedCampaigns = campaigns.slice((campaignPg - 1) * campaignPerPage, campaignPg * campaignPerPage);

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

			{/* Metrics Row */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard label="Total Campaigns" value={String(campaigns.length)} />
				<StatCard label="Active Campaigns" value={String(totalActive)} />
				<StatCard label="Total Sent" value={fmtN(totalSent)} />
				<StatCard label="Total Conversions" value={fmtN(totalConverted)} />
			</div>

			{/* Campaigns Table Card */}
			<Card className="bg-gradient-card border-border/50 shadow-card flex-1 flex flex-col min-h-0">
				<CardContent className="flex-1 flex flex-col min-h-0 p-4 md:p-6 space-y-4 overflow-hidden">
					<div className="flex-1 overflow-x-auto w-full rounded-lg border border-border/50">
						<table className="w-full text-left text-[13px]">
							<thead className="bg-muted/30 text-muted-foreground text-[11px] font-semibold border-b border-border/50 uppercase tracking-wider">
								<tr>
									<th className="px-5 py-3">Campaign</th>
									<th className="px-5 py-3">Conversion Goal</th>
									<th className="px-5 py-3">Reward</th>
									<th className="px-5 py-3">Channels</th>
									<th className="px-5 py-3">Sent</th>
									<th className="px-5 py-3">Open Rate</th>
									<th className="px-5 py-3">Converted</th>
									<th className="px-5 py-3">Status</th>
									<th className="px-5 py-3 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/50">
								{paginatedCampaigns.length === 0 ? (
									<tr>
										<td colSpan={9} className="text-center py-8 text-muted-foreground">
											No campaigns found. Click "New Campaign" to create one.
										</td>
									</tr>
								) : (
									paginatedCampaigns.map((c) => (
										<tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
											<td className="px-5 py-3.5">
												<p className="text-[13px] font-semibold text-foreground">{c.name}</p>
												<p className="text-[10px] text-muted-foreground">
													{c.segment} · {c.steps} steps · {c.date}
												</p>
											</td>
											<td className="px-5 py-3.5 max-w-[160px]">
												<div className="flex items-start gap-1.5">
													<Target size={11} className="text-primary mt-0.5 shrink-0" />
													<span className="text-[11px] font-semibold text-foreground leading-snug">{c.goal ?? "—"}</span>
												</div>
											</td>
											<td className="px-5 py-3.5">
												<span className="text-[11px] font-semibold text-emerald-400">{c.reward ?? "—"}</span>
											</td>
											<td className="px-5 py-3.5">
												<div className="flex gap-1 flex-wrap">
													{c.channels.map((ch) => (
														<ChannelBadge key={ch} ch={ch} />
													))}
												</div>
											</td>
											<td className="px-5 py-3.5 text-[12px] font-mono text-foreground">{fmtN(c.sent)}</td>
											<td className="px-5 py-3.5 text-[12px] font-mono text-foreground">
												{c.sent > 0 ? Math.round((c.opened / c.sent) * 100) : 0}%
											</td>
											<td className="px-5 py-3.5">
												<p className="text-[13px] font-mono font-bold text-primary">{fmtN(c.converted)}</p>
												{c.sent > 0 && <p className="text-[9px] text-muted-foreground">{Math.round((c.converted / c.sent) * 100)}% cvr</p>}
											</td>
											<td className="px-5 py-3.5">
												<StatusBadge status={c.status} />
											</td>
											<td className="px-5 py-3.5 text-right relative">
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														setOpenMenu(openMenu === c.id ? null : c.id);
													}}
													className="text-muted-foreground hover:text-foreground transition-colors p-1"
												>
													<MoreHorizontal size={14} />
												</button>
												{openMenu === c.id && (
													<div
														onClick={(e) => e.stopPropagation()}
														className="absolute right-5 top-10 w-36 bg-card border border-border rounded-xl shadow-xl p-1 z-50 text-left"
													>
														<button
															type="button"
															onClick={() => {
																toggleStatus(c.id);
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
																deleteCampaign(c.id);
																setOpenMenu(null);
															}}
															className="w-full flex items-center gap-2 px-3 py-2 text-[12px] rounded-lg hover:bg-red-500/10 text-red-400"
														>
															<Trash2 size={13} /> Delete
														</button>
													</div>
												)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					{/* Table Pagination */}
					{campaigns.length > 0 && (
						<div className="flex items-center justify-between pt-2 border-t border-border/50 shrink-0">
							<span className="text-[12px] text-muted-foreground">
								Showing {Math.min((campaignPg - 1) * campaignPerPage + 1, campaigns.length)} -{" "}
								{Math.min(campaignPg * campaignPerPage, campaigns.length)} of {campaigns.length} campaigns
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
									Page {campaignPg} of {Math.ceil(campaigns.length / campaignPerPage) || 1}
								</span>
								<button
									type="button"
									disabled={campaignPg >= Math.ceil(campaigns.length / campaignPerPage)}
									onClick={() => setCampaignPg((p) => Math.min(Math.ceil(campaigns.length / campaignPerPage), p + 1))}
									className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
								>
									<ChevronRight size={14} />
								</button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default Campaigns;