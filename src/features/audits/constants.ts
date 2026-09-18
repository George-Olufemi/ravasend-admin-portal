export const SEVERITIES = ["All", "info", "warning", "critical"];

export const sevConfig: Record<string, { cls: string; label: string }> = {
	info: { cls: "bg-blue-500/15 text-blue-400 border-blue-500/20", label: "Info" },
	warning: { cls: "bg-amber-500/15 text-amber-400 border-amber-500/20", label: "Warning" },
	critical: { cls: "bg-red-500/15 text-red-400 border-red-500/20", label: "Critical" },
};

export const catConfig: Record<string, string> = {
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

export const statusConfig: Record<string, string> = {
	SUCCESS: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
	FAILED: "bg-red-500/15 text-red-400 border-red-500/20",
};
