import { AdminRole, AdminUser, PermMatrix } from "./types";

export const DEFAULT_ROLE_PERMISSIONS: PermMatrix = {
  "Owner":                { users: true,  transactions: true,  fees: true,  competitions: true,  disburse: true,  segments: true,  campaigns: true,  withdrawals: true,  roles: true,  billing: true  },
  "Super Admin":          { users: true,  transactions: true,  fees: true,  competitions: true,  disburse: true,  segments: true,  campaigns: true,  withdrawals: true,  roles: true,  billing: false },
  "Competition Manager":  { users: false, transactions: false, fees: false, competitions: true,  disburse: false, segments: true,  campaigns: true,  withdrawals: false, roles: false, billing: false },
  "Finance / Ops":        { users: false, transactions: true,  fees: true,  competitions: false, disburse: true,  segments: false, campaigns: false, withdrawals: true,  roles: false, billing: true  },
  "Support Agent":        { users: true,  transactions: true,  fees: false, competitions: false, disburse: false, segments: false, campaigns: false, withdrawals: false, roles: false, billing: false },
  "Read Only":            { users: true,  transactions: true,  fees: true,  competitions: true,  disburse: false, segments: true,  campaigns: true,  withdrawals: true,  roles: false, billing: false },
};

export const PERM_LABELS: { key: string; label: string; desc: string }[] = [
  { key: "users", label: "Users", desc: "View and manage user accounts" },
  { key: "transactions", label: "Transactions", desc: "View all transaction history" },
  { key: "fees", label: "Fee Structure", desc: "Edit platform fee rules" },
  { key: "competitions", label: "Competitions", desc: "Create and manage competitions" },
  { key: "disburse", label: "Disbursements", desc: "Approve and trigger prize payouts" },
  { key: "segments", label: "Segments", desc: "Create and edit user segments" },
  { key: "campaigns", label: "Campaigns", desc: "Create and send campaigns" },
  { key: "withdrawals", label: "Withdrawals", desc: "Control withdrawal settings" },
  { key: "roles", label: "Manage Roles", desc: "Invite admins and edit permissions" },
  { key: "billing", label: "Billing", desc: "View and manage platform billing" },
];

export const SAMPLE_ADMINS: AdminUser[] = [
  { id: "ADM-000", name: "You (Owner)", email: "owner@ravasend.com", role: "Owner", status: "active", lastSeen: "Just now", addedDate: "Jan 1, 2026", avatar: "OW" },
  { id: "ADM-001", name: "Tobi Oluwaseun", email: "tobi@ravasend.com", role: "Super Admin", status: "active", lastSeen: "Just now", addedDate: "Jan 12, 2026", avatar: "TO" },
  { id: "ADM-002", name: "Chidinma Eze", email: "chidinma@ravasend.com", role: "Finance / Ops", status: "active", lastSeen: "2 hours ago", addedDate: "Feb 3, 2026", avatar: "CE" },
  { id: "ADM-003", name: "Emmanuel Ibe", email: "emman@ravasend.com", role: "Competition Manager", status: "active", lastSeen: "Yesterday", addedDate: "Mar 18, 2026", avatar: "EI" },
  { id: "ADM-004", name: "Fatima Lawal", email: "fatima@ravasend.com", role: "Support Agent", status: "active", lastSeen: "3 days ago", addedDate: "Apr 5, 2026", avatar: "FL" },
  { id: "ADM-005", name: "Kola Adeleke", email: "kola@ravasend.com", role: "Read Only", status: "pending", lastSeen: "—", addedDate: "Jul 28, 2026", avatar: "KA" },
];

export const ROLE_COLORS: Record<AdminRole, string> = {
  "Owner": "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40",
  "Super Admin": "bg-purple-500/15 text-purple-300 border-purple-500/30",
  "Competition Manager": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Finance / Ops": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "Support Agent": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "Read Only": "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export const roleOptions: AdminRole[] = ["Super Admin", "Competition Manager", "Finance / Ops", "Support Agent", "Read Only"];
export const allRoles: AdminRole[] = ["Owner", "Super Admin", "Competition Manager", "Finance / Ops", "Support Agent", "Read Only"];
