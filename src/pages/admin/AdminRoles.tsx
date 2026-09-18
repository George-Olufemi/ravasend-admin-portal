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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

import {
  AdminRole,
  ApiAdminMember,
  AdminUser,
  PermMatrix,
  DEFAULT_ROLE_PERMISSIONS,
  PERM_LABELS,
  SAMPLE_ADMINS,
  ROLE_COLORS,
  roleOptions,
  allRoles,
  normalizeRole,
  PurpleBtn,
  TableWrap,
  THead,
  SlidePanel,
} from "@/features/admin-roles";



function AdminRolesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();


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
      toast({ title: "Invitation Sent", description: "Admin invite has been sent successfully." });
    },
    onError: (err: any) => {
      toast({
        title: "Invite Failed",
        description: err?.response?.data?.message || err.message || "Failed to send invitation.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { email: string; fullName: string; role: string } }) =>
      adminAndRolesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      setInviteOpen(false);
      setEditAdmin(null);
      toast({ title: "Admin Updated", description: "Admin details updated successfully." });
    },
    onError: (err: any) => {
      toast({
        title: "Update Failed",
        description: err?.response?.data?.message || err.message || "Failed to update admin member.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminAndRolesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
    },
  });

  // Mapping API members to display format
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
  const [deletingAdmin, setDeletingAdmin] = useState<AdminUser | null>(null);
  const [togglingAdmin, setTogglingAdmin] = useState<AdminUser | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
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
        toast({ title: "Admin Member Updated", description: `${form.name} details have been updated.` });
      } else {
        const id = `ADM-${String(admins.length + 1).padStart(3, "0")}`;
        const initials = form.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        setAdmins((prev) => [...prev, { id, name: form.name, email: form.email, role: form.role, status: "pending", lastSeen: "—", addedDate: "Jul 30, 2026", avatar: initials }]);
        toast({ title: "Admin Member Invited", description: `${form.name} has been added to the team.` });
      }
      setInviteOpen(false);
      setEditAdmin(null);
    }
  };

  const confirmDeleteMember = () => {
    if (!deletingAdmin) return;
    if (apiMembers.some((m) => m._id === deletingAdmin.id)) {
      deleteMutation.mutate(deletingAdmin.id, {
        onSuccess: () => {
          toast({
            title: "Admin Removed",
            description: `${deletingAdmin.name} has been removed successfully.`,
          });
          setDeletingAdmin(null);
        },
        onError: (err: any) => {
          toast({
            title: "Delete Failed",
            description: err?.response?.data?.message || err.message || "Failed to remove admin member.",
            variant: "destructive",
          });
        },
      });
    } else {
      setAdmins((prev) => prev.filter((x) => x.id !== deletingAdmin.id));
      toast({
        title: "Admin Removed",
        description: `${deletingAdmin.name} has been removed successfully.`,
      });
      setDeletingAdmin(null);
    }
  };

  const confirmToggleStatus = () => {
    if (!togglingAdmin) return;
    const newStatus = togglingAdmin.status === "active" ? "inactive" : "active";
    setAdmins((prev) =>
      prev.map((x) => (x.id === togglingAdmin.id ? { ...x, status: newStatus } : x))
    );
    toast({
      title: `Admin ${newStatus === "active" ? "Activated" : "Deactivated"}`,
      description: `${togglingAdmin.name} is now ${newStatus}.`,
    });
    setTogglingAdmin(null);
  };

  const isSubmitting = inviteMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin & Roles</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Manage team access, roles, and permission policies</p>
        </div>
        <PurpleBtn
          onClick={() => {
            setForm({ name: "", email: "", password: "", role: "Support Agent" });
            setEditAdmin(null);
            setInviteOpen(true);
          }}
          className="w-full sm:w-auto justify-center shrink-0"
        >
          <Plus size={13} /> Invite Admin
        </PurpleBtn>
      </div>

      {/* Tab toggle */}
      <div className="flex items-center gap-1 mb-6 bg-white/5 border border-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
        {(["team", "permissions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold capitalize whitespace-nowrap transition-all ${activeTab === t ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {allRoles.map((role) => {
              const count = displayAdmins.filter((a) => a.role === role).length;
              return (
                <button
                  key={role}
                  onClick={() => setViewRole(viewRole === role ? null : role)}
                  className={`p-4 rounded-xl border text-left transition-all ${viewRole === role ? "border-primary/40 bg-primary/5" : "border-border bg-white/[0.025] hover:border-primary/20"
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
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${a.status === "active"
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
                            title="Edit Admin"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => setTogglingAdmin(a)}
                            className="p-1.5 rounded-lg hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400 transition-colors"
                            title={a.status === "active" ? "Deactivate Admin" : "Activate Admin"}
                          >
                            {a.status === "active" ? <Lock size={12} /> : <Unlock size={12} />}
                          </button>
                          <button
                            onClick={() => setDeletingAdmin(a)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                            title="Remove Admin"
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
              onClick={() => setShowResetConfirm(true)}
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
                        className={`size-6 rounded-md flex items-center justify-center transition-all ${isOwner ? "cursor-default" : "cursor-pointer hover:scale-110"
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

      {/* Delete Confirmation Modal Dialog */}
      <Dialog open={!!deletingAdmin} onOpenChange={(open) => { if (!open) setDeletingAdmin(null); }}>
        <DialogContent className="sm:max-w-md bg-card border border-border">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">Remove Admin Member</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-2 text-[13px] text-muted-foreground">
            Are you sure you want to remove <span className="font-semibold text-foreground">{deletingAdmin?.name}</span> ({deletingAdmin?.email}) from the admin team? They will lose access to all admin tools.
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <button
              type="button"
              onClick={() => setDeletingAdmin(null)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-[12px] font-semibold border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteMember}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-[12px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {deleteMutation.isPending ? <Loader2 className="animate-spin" size={13} /> : "Remove Member"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Toggle Confirmation Dialog */}
      <Dialog open={!!togglingAdmin} onOpenChange={(open) => { if (!open) setTogglingAdmin(null); }}>
        <DialogContent className="sm:max-w-md bg-card border border-border">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                {togglingAdmin?.status === "active" ? <Lock size={18} className="text-amber-400" /> : <Unlock size={18} className="text-emerald-400" />}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {togglingAdmin?.status === "active" ? "Deactivate Admin Member" : "Activate Admin Member"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Change access status for {togglingAdmin?.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-2 text-[13px] text-muted-foreground">
            {togglingAdmin?.status === "active"
              ? `Are you sure you want to deactivate ${togglingAdmin?.name}? They will temporarily lose access to the admin dashboard.`
              : `Are you sure you want to activate ${togglingAdmin?.name}? They will regain full access according to their role.`}
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <button
              type="button"
              onClick={() => setTogglingAdmin(null)}
              className="px-4 py-2 text-[12px] font-semibold border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmToggleStatus}
              className="px-4 py-2 text-[12px] font-bold text-white rounded-xl transition-all"
              style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
            >
              Confirm Change
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permission Save Confirmation Dialog */}
      <Dialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <DialogContent className="sm:max-w-md bg-card border border-border">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <ShieldAlert size={18} className="text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">Confirm Permission Changes</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  This will update access controls for all affected admins.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="bg-secondary/60 border border-border rounded-xl p-3 my-2 space-y-1.5 max-h-48 overflow-y-auto">
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
                      className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${val ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-red-500/15 text-red-400 border-red-500/20"
                        }`}
                    >
                      {val ? "Granted" : "Revoked"}
                    </span>
                  </div>
                ))
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <button
              type="button"
              onClick={() => setShowSaveConfirm(false)}
              className="px-4 py-2 text-[12px] font-semibold border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                savePermissions();
                toast({ title: "Permissions Saved", description: "Role permissions have been updated successfully." });
              }}
              className="px-4 py-2 text-[12px] font-bold text-white rounded-xl transition-all"
              style={{ background: "linear-gradient(135deg,#7B3FE4,#5B2AB8)" }}
            >
              Apply Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Permissions Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="sm:max-w-md bg-card border border-border">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <RefreshCw size={18} className="text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">Reset Permission Matrix</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Restore all role permissions to defaults
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-2 text-[13px] text-muted-foreground">
            Are you sure you want to reset all role permissions to their default settings? Any unsaved custom changes will be discarded.
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="px-4 py-2 text-[12px] font-semibold border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingPermissions(null);
                setPermissions(DEFAULT_ROLE_PERMISSIONS);
                setShowResetConfirm(false);
                toast({ title: "Permissions Reset", description: "Role permission matrix has been reset to default values." });
              }}
              className="px-4 py-2 text-[12px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors"
            >
              Reset to Defaults
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                className="w-full bg-white/5 border border-border rounded-lg px-3 py-2.5 text-md text-foreground focus:outline-none focus:border-primary/50 font-mono text-md"
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${form.role === r ? "border-primary/40 bg-primary/5" : "border-border bg-white/[0.025] hover:border-primary/20"
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