import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Ban,
  Unlock,
  Copy,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { usersAPI, User } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { fmtN, ngn } from "@/lib/formatters";
import {
  PageHeader,
  PurpleBtn,
  StatCard,
  TableWrap,
  THead,
  Pagination,
  StatusBadge,
  Avatar,
  DropdownMenu,
  SlidePanel,
  TableSkeleton,
} from "@/components/admin/shared";
import { filterUsers, downloadUsersCSV, checkIsFrozen } from "@/features/users";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[14px] font-bold text-foreground mb-0.5">{children}</h2>;
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground mb-4">{children}</p>;
}

const Users = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [frozenIds, setFrozenIds] = useState<Set<string>>(new Set());
  const [userMenu, setUserMenu] = useState<string | null>(null);
  const [freezeTarget, setFreezeTarget] = useState<User | null>(null);
  const [freezeReason, setFreezeReason] = useState("");
  const [confirmPanel, setConfirmPanel] = useState(false);
  const perPage = 5;

  const {
    data: usersData,
    isLoading,
  } = useQuery({
    queryKey: ["users"],
    queryFn: usersAPI.getAll,
  });

  const users: User[] = useMemo(() => usersData?.users || [], [usersData]);

  const filtered = useMemo(() => {
    return filterUsers(users, search);
  }, [users, search]);

  const paged = useMemo(() => {
    return filtered.slice((page - 1) * perPage, page * perPage);
  }, [filtered, page, perPage]);

  const isFrozen = (id: string) => {
    const u = users.find((x) => x._id === id);
    return checkIsFrozen(u, frozenIds);
  };

  const openFreeze = (u: User) => {
    setFreezeTarget(u);
    setFreezeReason("");
    setConfirmPanel(true);
    setUserMenu(null);
  };

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const freezeMutation = useMutation({
    mutationFn: (userId: string) => usersAPI.freezeUserAccount(userId),
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      const targetUser = users.find((u) => u._id === userId);
      const isCurrentlyBlocked = targetUser?.isBlocked || frozenIds.has(userId);
      toast({
        title: isCurrentlyBlocked ? "Account Unfrozen" : "Account Frozen",
        description:
          data?.message ||
          `User account has been successfully ${isCurrentlyBlocked ? "unfrozen" : "frozen"}.`,
      });
      setFrozenIds((s) => {
        const n = new Set(s);
        if (n.has(userId)) {
          n.delete(userId);
        } else {
          n.add(userId);
        }
        return n;
      });
      setConfirmPanel(false);
      setFreezeTarget(null);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: err?.response?.data?.message || err.message || "Failed to update user status",
      });
    },
  });

  const doFreeze = () => {
    if (!freezeTarget) return;
    freezeMutation.mutate(freezeTarget._id);
  };

  const downloadCSV = () => {
    downloadUsersCSV(filtered, search);
  };

  const activeCount = useMemo(() => users.filter((u) => !u.isBlocked).length, [users]);
  const kycCount = useMemo(() => users.filter((u) => u.hasKyc || u.kycLevel > 0).length, [users]);
  const quidaxCount = useMemo(() => users.filter((u) => u.hasQuidaxId).length, [users]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-7" onClick={() => setUserMenu(null)}>
      <PageHeader
        title="Users"
        subtitle={`${fmtN(filtered.length)} users found`}
        search="Search by name, email, phone, ID…"
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        action={
          <PurpleBtn onClick={downloadCSV}>
            <Download size={13} /> Download CSV
          </PurpleBtn>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Users" value={fmtN(users.length)} />
        <StatCard label="Active (30d)" value={fmtN(activeCount)} sub="+12.4%" />
        <StatCard label="KYC Verified" value={fmtN(kycCount)} />
        <StatCard label="Crypto Wallets (Quidax)" value={fmtN(quidaxCount)} sub="Generated via Quidax" />
      </div>

      <SectionLabel>All Users</SectionLabel>
      <SubLabel>Showing {filtered.length} of {fmtN(users.length)} registered accounts</SubLabel>

      <TableWrap>
        <THead cols={["User", "Email", "Phone", "Status / Wallet", "NGN Balance", "USD Balance", "KYC", "Joined", ""]} />
        <tbody className="divide-y divide-border">
          {isLoading ? (
            <TableSkeleton rows={6} cols={9} />
          ) : paged.length > 0 ? (
            paged.map((u) => {
              const frozen = isFrozen(u._id);
              return (
                <tr
                  key={u._id}
                  className={`hover:bg-white/[0.02] transition-colors cursor-pointer group ${
                    frozen ? "bg-red-500/[0.03]" : ""
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar name={u.fullName} />
                        {frozen && (
                          <span className="absolute -top-0.5 -right-0.5 size-3 bg-red-500 rounded-full border border-background flex items-center justify-center">
                            <Ban size={7} className="text-white" />
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                          {u.fullName}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">ID: {u._id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3.5 text-[12px] font-mono text-foreground">{u.phoneNumber || "-"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-1 items-start">
                      <StatusBadge status={frozen ? "inactive" : "ACTIVE"} />
                      {frozen && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                          <Ban size={8} /> FROZEN
                        </span>
                      )}
                      {u.isVerified && !frozen && <StatusBadge status="VERIFIED" />}
                      {u.hasQuidaxId && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
                          <span className="size-1.5 rounded-full bg-violet-400 inline-block" /> Crypto Wallet
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] font-mono text-foreground">{ngn(u.nairaWallet || 0)}</td>
                  <td className="px-5 py-3.5 text-[12px] font-mono text-foreground">${u.dollarWallet || 0}</td>
                  <td className="px-5 py-3.5 text-[12px] text-foreground">L{u.kycLevel || 0}</td>
                  <td className="px-5 py-3.5 text-[12px] text-muted-foreground whitespace-nowrap">
                    {u.createdAt ? formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }) : "-"}
                  </td>
                  <td className="px-5 py-3.5 relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserMenu(userMenu === u._id ? null : u._id);
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                    {userMenu === u._id && (
                      <DropdownMenu
                        onClose={() => setUserMenu(null)}
                        items={[
                          {
                            label: frozen ? "Unfreeze Account" : "Freeze Account",
                            icon: frozen ? <Unlock size={13} /> : <Ban size={13} />,
                            onClick: () => openFreeze(u),
                            danger: !frozen,
                          },
                          {
                            label: "Copy User ID",
                            icon: <Copy size={13} />,
                            onClick: () => navigator.clipboard.writeText(u._id),
                          },
                        ]}
                      />
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={9} className="px-5 py-12 text-center text-[12px] text-muted-foreground">
                No users match your search.
              </td>
            </tr>
          )}
        </tbody>
      </TableWrap>

      <Pagination page={page} total={filtered.length} perPage={perPage} onChange={setPage} />

      {/* Freeze / Unfreeze confirmation panel */}
      <SlidePanel
        open={confirmPanel}
        onClose={() => {
          setConfirmPanel(false);
          setFreezeTarget(null);
        }}
        title={freezeTarget && isFrozen(freezeTarget._id) ? "Unfreeze Account" : "Freeze Account"}
        subtitle={freezeTarget?.fullName}
        footer={
          <div className="flex gap-3">
            <button
              onClick={doFreeze}
              disabled={freezeMutation.isPending}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all flex items-center justify-center gap-2 ${
                freezeTarget && isFrozen(freezeTarget._id)
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-red-600 hover:bg-red-500"
              } disabled:opacity-50`}
            >
              {freezeMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Processing...
                </>
              ) : freezeTarget && isFrozen(freezeTarget._id) ? (
                "Confirm Unfreeze"
              ) : (
                "Confirm Freeze"
              )}
            </button>
            <button
              onClick={() => {
                setConfirmPanel(false);
                setFreezeTarget(null);
              }}
              className="px-5 py-2.5 rounded-xl border border-border text-muted-foreground text-[13px] hover:text-foreground hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        }
      >
        {freezeTarget && (
          <div className="space-y-5">
            <div
              className={`p-4 rounded-xl border ${
                isFrozen(freezeTarget._id)
                  ? "bg-emerald-500/8 border-emerald-500/20"
                  : "bg-red-500/8 border-red-500/20"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={freezeTarget.fullName} size="md" />
                <div>
                  <p className="text-[14px] font-bold text-foreground">{freezeTarget.fullName}</p>
                  <p className="text-[11px] text-muted-foreground">{freezeTarget.email}</p>
                  <p className="text-[11px] font-mono text-muted-foreground">{freezeTarget.phoneNumber || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">NGN Balance</p>
                  <p className="text-[13px] font-bold text-foreground">{ngn(freezeTarget.nairaWallet || 0)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Status</p>
                  <StatusBadge status={isFrozen(freezeTarget._id) ? "inactive" : "ACTIVE"} />
                </div>
              </div>
            </div>
            {isFrozen(freezeTarget._id) ? (
              <div>
                <p className="text-[13px] text-foreground font-medium mb-1">This account is currently frozen.</p>
                <p className="text-[12px] text-muted-foreground">
                  Unfreezing will restore full access — the user can log in, transact, send, and withdraw normally.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-[13px] text-foreground font-medium mb-1">What does freezing do?</p>
                  <ul className="text-[12px] text-muted-foreground space-y-1 list-none">
                    {[
                      "Blocks all outbound transactions (withdrawals, transfers, bill payments)",
                      "Blocks inbound deposits",
                      "User cannot log in or access the app",
                      "All pending withdrawals are held",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">
                    Reason for freezing <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={freezeReason}
                    onChange={(e) => setFreezeReason(e.target.value)}
                    rows={3}
                    className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
                    placeholder="e.g. Suspicious activity detected, compliance review required…"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </SlidePanel>
    </div>
  );
};

export default Users;
