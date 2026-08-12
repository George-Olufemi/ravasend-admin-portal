import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit2,
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  X,
  ShieldAlert,
  Send,
  Loader2,
} from "lucide-react";
import { adminAndRolesAPI } from "@/lib/api";

// ─── Types & Constants ────────────────────────────────────────────────────────

type AdminRole = "Owner" | "Super Admin" | "Competition Manager" | "Finance / Ops" | "Support Agent" | "Read Only";

interface ApiAdminMember {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "inactive" | "pending";
  lastSeen: string;
  addedDate: string;
  avatar: string;
}

type PermMatrix = Record<AdminRole, Record<string, boolean>>;

const DEFAULT_ROLE_PERMISSIONS: PermMatrix = {
  "Owner":                { users: true,  transactions: true,  fees: true,  competitions: true,  disburse: true,  segments: true,  campaigns: true,  withdrawals: true,  roles: true,  billing: true  },
  "Super Admin":          { users: true,  transactions: true,  fees: true,  competitions: true,  disburse: true,  segments: true,  campaigns: true,  withdrawals: true,  roles: true,  billing: false },
  "Competition Manager":  { users: false, transactions: false, fees: false, competitions: true,  disburse: false, segments: true,  campaigns: true,  withdrawals: false, roles: false, billing: false },
  "Finance / Ops":        { users: false, transactions: true,  fees: true,  competitions: false, disburse: true,  segments: false, campaigns: false, withdrawals: true,  roles: false, billing: true  },
  "Support Agent":        { users: true,  transactions: true,  fees: false, competitions: false, disburse: false, segments: false, campaigns: false, withdrawals: false, roles: false, billing: false },
  "Read Only":            { users: true,  transactions: true,  fees: true,  competitions: true,  disburse: false, segments: true,  campaigns: true,  withdrawals: true,  roles: false, billing: false },
};

const PERM_LABELS: { key: string; label: string; desc: string }[] = [
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

const SAMPLE_ADMINS: AdminUser[] = [
  { id: "ADM-000", name: "You (Owner)", email: "owner@ravasend.com", role: "Owner", status: "active", lastSeen: "Just now", addedDate: "Jan 1, 2026", avatar: "OW" },
  { id: "ADM-001", name: "Tobi Oluwaseun", email: "tobi@ravasend.com", role: "Super Admin", status: "active", lastSeen: "Just now", addedDate: "Jan 12, 2026", avatar: "TO" },
  { id: "ADM-002", name: "Chidinma Eze", email: "chidinma@ravasend.com", role: "Finance / Ops", status: "active", lastSeen: "2 hours ago", addedDate: "Feb 3, 2026", avatar: "CE" },
  { id: "ADM-003", name: "Emmanuel Ibe", email: "emman@ravasend.com", role: "Competition Manager", status: "active", lastSeen: "Yesterday", addedDate: "Mar 18, 2026", avatar: "EI" },
  { id: "ADM-004", name: "Fatima Lawal", email: "fatima@ravasend.com", role: "Support Agent", status: "active", lastSeen: "3 days ago", addedDate: "Apr 5, 2026", avatar: "FL" },
  { id: "ADM-005", name: "Kola Adeleke", email: "kola@ravasend.com", role: "Read Only", status: "pending", lastSeen: "—", addedDate: "Jul 28, 2026", avatar: "KA" },
];

const ROLE_COLORS: Record<AdminRole, string> = {
  "Owner": "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40",
  "Super Admin": "bg-purple-500/15 text-purple-300 border-purple-500/30",
  "Competition Manager": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Finance / Ops": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "Support Agent": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "Read Only": "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

function normalizeRole(roleStr: string): AdminRole {
  const r = roleStr?.toLowerCase() || "";
  if (r.includes("owner")) return "Owner";
  if (r.includes("super") || r === "admin") return "Super Admin";
  if (r.includes("competition")) return "Competition Manager";
  if (r.includes("finance") || r.includes("ops")) return "Finance / Ops";
  if (r.includes("support")) return "Support Agent";
  return "Read Only";
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function PurpleBtn({
  children,
  onClick,
  className = "",
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95 ${
        size === "sm" ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-[12px]"
      } ${className}`}
      style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
    >
      {children}
    </button>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.025] border border-border rounded-xl overflow-hidden mb-4">
      <table className="w-full text-left border-collapse">{children}</table>
    </div>
  );
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-border bg-white/[0.02]">
        {cols.map((c, i) => (
          <th key={i} className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function SlidePanel({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
      <div className="w-[440px] h-full bg-[#0F0D26] border-l border-border p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <h2 className="text-[16px] font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

function AdminRolesPage() {
  const queryClient = useQueryClient();

  // ── Queries & Mutations ──
  const {
    data: membersResponse,
    isLoading,
  } = useQuery({
    queryKey: ["admin-members"],
    queryFn: adminAndRolesAPI.getAll,
  });

  const apiMembers: ApiAdminMember[] = membersResponse?.data ?? [];

  const inviteMutation = useMutation({
    mutationFn: (payload: { email: string; fullName: string; password: string; role: string }) =>
      adminAndRolesAPI.invite(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      setInviteOpen(false);
      setEditAdmin(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { email: string; fullName: string; role: string } }) =>
      adminAndRolesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      setInviteOpen(false);
      setEditAdmin(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminAndRolesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
    },
  });

  // Map API members to display format
  const mappedAdmins: AdminUser[] = apiMembers.length > 0
    ? apiMembers.map((m) => {
        const initials = m.fullName ? m.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "AD";
        const role = normalizeRole(m.role);
        const status = m.isBlocked ? "inactive" : m.isVerified ? "active" : "pending";
        const date = m.createdAt ? new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";
        return {
          id: m._id,
          name: m.fullName || "Admin Member",
          email: m.email || "-",
          role,
          status,
          lastSeen: m.updatedAt ? new Date(m.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Just now",
          addedDate: date,
          avatar: initials,
        };
      })
    : SAMPLE_ADMINS;

  const [admins, setAdmins] = useState<AdminUser[]>(SAMPLE_ADMINS);
  const displayAdmins = apiMembers.length > 0 ? mappedAdmins : admins;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [viewRole, setViewRole] = useState<AdminRole | null>(null);
  const [editAdmin, setEditAdmin] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Support Agent" as AdminRole });
  const [activeTab, setActiveTab] = useState<"team" | "permissions">("team");
  const [permissions, setPermissions] = useState<PermMatrix>(DEFAULT_ROLE_PERMISSIONS);
  const [pendingPermissions, setPendingPermissions] = useState<PermMatrix | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const roleOptions: AdminRole[] = ["Super Admin", "Competition Manager", "Finance / Ops", "Support Agent", "Read Only"];
  const allRoles: AdminRole[] = ["Owner", "Super Admin", "Competition Manager", "Finance / Ops", "Support Agent", "Read Only"];

  const draftPerms = pendingPermissions ?? permissions;
  const hasUnsaved = pendingPermissions !== null;

  const togglePerm = (role: AdminRole, key: string) => {
    if (role === "Owner") return;
    const base = pendingPermissions ?? permissions;
    setPendingPermissions({ ...base, [role]: { ...base[role], [key]: !base[role][key] } });
  };

  const discardChanges = () => setPendingPermissions(null);

  const savePermissions = () => {
    if (pendingPermissions) setPermissions(pendingPermissions);
    setPendingPermissions(null);
    setShowSaveConfirm(false);
  };

  const handleSaveMember = () => {
    if (!form.name || !form.email) return;

    if (editAdmin && apiMembers.some((m) => m._id === editAdmin.id)) {
      updateMutation.mutate({
        id: editAdmin.id,
        data: { fullName: form.name, email: form.email, role: form.role.toLowerCase().replace(/ \/ /g, "-").replace(/ /g, "-") },
      });
    } else if (!editAdmin) {
      inviteMutation.mutate({
        fullName: form.name,
        email: form.email,
        password: form.password || "Acces0091",
        role: form.role.toLowerCase().replace(/ \/ /g, "-").replace(/ /g, "-"),
      });
    } else {
      // Local fallback
      if (editAdmin) {
        setAdmins((prev) => prev.map((a) => (a.id === editAdmin.id ? { ...a, name: form.name, email: form.email, role: form.role } : a)));
      } else {
        const id = `ADM-${String(admins.length + 1).padStart(3, "0")}`;
        const initials = form.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        setAdmins((prev) => [...prev, { id, name: form.name, email: form.email, role: form.role, status: "pending", lastSeen: "—", addedDate: "Jul 30, 2026", avatar: initials }]);
      }
      setInviteOpen(false);
      setEditAdmin(null);
    }
  };

  const handleDeleteMember = (id: string) => {
    if (apiMembers.some((m) => m._id === id)) {
      if (confirm("Remove this admin member?")) {
        deleteMutation.mutate(id);
      }
    } else {
      setAdmins((prev) => prev.filter((x) => x.id !== id));
    }
  };

  const isSubmitting = inviteMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex-1 overflow-y-auto p-7">
      <PageHeader
        title="Admin & Roles"
        subtitle="Manage team access, roles, and permission policies"
        action={
          <PurpleBtn
            onClick={() => {
              setForm({ name: "", email: "", password: "", role: "Support Agent" });
              setEditAdmin(null);
              setInviteOpen(true);
            }}
          >
            <Plus size={13} /> Invite Admin
          </PurpleBtn>
        }
      />

      {/* Tab toggle */}
      <div className="flex items-center gap-1 mb-6 bg-white/5 border border-border rounded-xl p-1 w-fit">
        {(["team", "permissions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all ${
              activeTab === t ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
            style={activeTab === t ? { background: "linear-gradient(135deg,#7B3FE4,#5B2AB8)" } : {}}
          >
            {t === "team" ? "Team Members" : "Permission Matrix"}
          </button>
        ))}
      </div>

      {activeTab === "team" && (
        <>
          {/* Role summary cards */}
          <div className="grid grid-cols-6 gap-3 mb-6">
            {allRoles.map((role) => {
              const count = displayAdmins.filter((a) => a.role === role).length;
              return (
                <button
                  key={role}
                  onClick={() => setViewRole(viewRole === role ? null : role)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    viewRole === role ? "border-primary/40 bg-primary/5" : "border-border bg-white/[0.025] hover:border-primary/20"
                  }`}
                >
                  <p className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit mb-2 ${ROLE_COLORS[role]}`}>{role}</p>
                  <p className="text-[22px] font-bold text-foreground">{count}</p>
                  <p className="text-[10px] text-muted-foreground">{count === 1 ? "member" : "members"}</p>
                </button>
              );
            })}
          </div>

          <TableWrap>
            <THead cols={["Admin", "Role", "Status", "Last Active", "Added", "Actions"]} />
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[12px] text-muted-foreground">
                    <Loader2 className="animate-spin inline mr-2" size={14} /> Loading admin team members...
                  </td>
                </tr>
              ) : (
                displayAdmins
                  .filter((a) => !viewRole || a.role === viewRole)
                  .map((a) => (
                    <tr key={a.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ background: "linear-gradient(135deg,#7B3FE4,#5B2AB8)" }}
                          >
                            {a.avatar}
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold text-foreground">{a.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[a.role]}`}>{a.role}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            a.status === "active"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                              : a.status === "pending"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                              : "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[11px] text-muted-foreground">{a.lastSeen}</td>
                      <td className="px-5 py-4 text-[11px] text-muted-foreground font-mono">{a.addedDate}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditAdmin(a);
                              setForm({ name: a.name, email: a.email, password: "", role: a.role });
                              setInviteOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() =>
                              setAdmins((prev) =>
                                prev.map((x) => (x.id === a.id ? { ...x, status: x.status === "active" ? "inactive" : "active" } : x))
                              )
                            }
                            className="p-1.5 rounded-lg hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400 transition-colors"
                          >
                            {a.status === "active" ? <Lock size={12} /> : <Unlock size={12} />}
                          </button>
                          <button
                            onClick={() => handleDeleteMember(a.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </TableWrap>
        </>
      )}

      {activeTab === "permissions" && (
        <div className="overflow-x-auto">
          {hasUnsaved && (
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-4">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                <p className="text-[12px] font-semibold text-amber-300">You have unsaved permission changes. Review before applying.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={discardChanges}
                  className="text-[11px] text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:text-foreground transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={() => setShowSaveConfirm(true)}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-white transition-all"
                  style={{ background: "linear-gradient(135deg,#7B3FE4,#5B2AB8)" }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[13px] font-bold text-foreground">Role Permission Matrix</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Click any cell to toggle. Owner permissions are immutable.</p>
            </div>
            <button
              onClick={() => {
                setPendingPermissions(null);
                setPermissions(DEFAULT_ROLE_PERMISSIONS);
              }}
              className="text-[11px] text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={11} /> Reset to defaults
            </button>
          </div>

          <div className="rounded-xl border border-border overflow-hidden" style={{ minWidth: 820 }}>
            {/* Header row */}
            <div className="grid bg-white/[0.03] border-b border-border" style={{ gridTemplateColumns: `220px repeat(${allRoles.length}, 1fr)` }}>
              <div className="px-5 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Permission</div>
              {allRoles.map((r) => (
                <div key={r} className="px-2 py-4 text-center">
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[r]}`}>{r}</span>
                  {r !== "Owner" && (
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {Object.values(permissions[r]).filter(Boolean).length}/{PERM_LABELS.length} granted
                    </p>
                  )}
                </div>
              ))}
            </div>

            {PERM_LABELS.map((p, i) => (
              <div
                key={p.key}
                className={`grid border-b border-border last:border-0 ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.012]"}`}
                style={{ gridTemplateColumns: `220px repeat(${allRoles.length}, 1fr)` }}
              >
                <div className="px-5 py-4">
                  <p className="text-[12px] font-semibold text-foreground">{p.label}</p>
                  <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                </div>
                {allRoles.map((r) => {
                  const granted = draftPerms[r]?.[p.key] ?? false;
                  const isOwner = r === "Owner";
                  return (
                    <div key={r} className="px-3 py-4 flex justify-center items-center">
                      <button
                        onClick={() => togglePerm(r, p.key)}
                        disabled={isOwner}
                        className={`size-6 rounded-md flex items-center justify-center transition-all ${
                          isOwner ? "cursor-default" : "cursor-pointer hover:scale-110"
                        } ${granted ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-zinc-800/60 border border-zinc-700"}`}
                        title={isOwner ? "Owner has all permissions" : granted ? "Click to revoke" : "Click to grant"}
                      >
                        {granted ? (
                          <CheckCircle2 size={13} className={isOwner ? "text-amber-400" : "text-emerald-400"} />
                        ) : (
                          <span className="w-2.5 h-0.5 bg-zinc-600 rounded" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            {hasUnsaved ? 'You have unsaved changes — click "Save Changes" to apply.' : "All changes are saved. Push to backend to enforce server-side."}
          </p>
        </div>
      )}

      {/* Permission save confirmation modal */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <ShieldAlert size={18} className="text-amber-400" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-foreground">Confirm Permission Changes</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">This will update access controls for all affected admins.</p>
              </div>
            </div>
            <div className="bg-secondary/60 border border-border rounded-xl p-3 mb-5 space-y-1.5 max-h-48 overflow-y-auto">
              {Object.entries(pendingPermissions ?? {}).flatMap(([role, perms]) =>
                Object.entries(perms)
                  .filter(([key, val]) => val !== (permissions[role as AdminRole]?.[key] ?? false))
                  .map(([key, val]) => (
                    <div key={`${role}-${key}`} className="flex items-center gap-2 text-[11px]">
                      <span className={`font-bold ${val ? "text-emerald-400" : "text-red-400"}`}>{val ? "+" : "−"}</span>
                      <span className="text-foreground font-semibold">{role}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{PERM_LABELS.find((p) => p.key === key)?.label ?? key}</span>
                      <span
                        className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                          val ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-red-500/15 text-red-400 border-red-500/20"
                        }`}
                      >
                        {val ? "Granted" : "Revoked"}
                      </span>
                    </div>
                  ))
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveConfirm(false)}
                className="flex-1 border border-border text-muted-foreground text-[13px] rounded-xl py-2.5 hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePermissions}
                className="flex-1 text-[13px] font-bold text-white rounded-xl py-2.5 transition-all"
                style={{ background: "linear-gradient(135deg,#7B3FE4,#5B2AB8)" }}
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite / Edit Panel */}
      <SlidePanel
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setEditAdmin(null);
        }}
        title={editAdmin ? `Edit — ${editAdmin.name}` : "Invite Admin"}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-white/5 border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-primary/50"
              placeholder="e.g. Amara Obi"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Work Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              type="email"
              className="w-full bg-white/5 border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-primary/50"
              placeholder="name@ravasend.com"
            />
          </div>
          {!editAdmin && (
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Temporary Password</label>
              <input
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                type="text"
                className="w-full bg-white/5 border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-primary/50 font-mono text-[12px]"
                placeholder="e.g. Acces0091"
              />
            </div>
          )}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Role</label>
            <div className="space-y-2">
              {roleOptions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: r }))}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${
                    form.role === r ? "border-primary/40 bg-primary/5" : "border-border bg-white/[0.025] hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[r]}`}>{r}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {r === "Super Admin"
                        ? "Full access, all actions"
                        : r === "Competition Manager"
                        ? "Competitions, segments, campaigns"
                        : r === "Finance / Ops"
                        ? "Transactions, fees, disbursements"
                        : r === "Support Agent"
                        ? "View users & transactions"
                        : "View-only across all modules"}
                    </span>
                  </div>
                  {form.role === r && <CheckCircle2 size={14} className="text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Selected role permission preview */}
          <div className="bg-white/[0.025] border border-border rounded-xl p-4">
            <p className="text-[11px] font-semibold text-muted-foreground mb-3">
              Permissions for <span className="text-foreground">{form.role}</span>
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {PERM_LABELS.map((p) => (
                <div key={p.key} className={`flex items-center gap-1.5 text-[10px] ${permissions[form.role]?.[p.key] ? "text-emerald-400" : "text-zinc-600"}`}>
                  {permissions[form.role]?.[p.key] ? <CheckCircle2 size={10} /> : <X size={10} />}
                  {p.label}
                </div>
              ))}
            </div>
          </div>

          {(inviteMutation.isError || updateMutation.isError) && (
            <p className="text-[11px] text-red-400">Something went wrong submitting. Please try again.</p>
          )}

          <PurpleBtn className="w-full justify-center" onClick={handleSaveMember}>
            {isSubmitting ? <Loader2 className="animate-spin" size={13} /> : <Send size={13} />}
            {editAdmin ? "Save Changes" : "Send Invite"}
          </PurpleBtn>
        </div>
      </SlidePanel>
    </div>
  );
}

export default AdminRolesPage;