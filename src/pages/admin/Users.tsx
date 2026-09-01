import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Search,
  Ban,
  Unlock,
  Copy,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { usersAPI, User } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function fmtN(num: number) {
  return new Intl.NumberFormat().format(num || 0);
}

function ngn(num: number) {
  return "₦" + fmtN(num);
}

function PageHeader({
  title,
  subtitle,
  search,
  onSearch,
  action,
}: {
  title: string;
  subtitle?: string;
  search?: string;
  onSearch?: (v: string) => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        {search !== undefined && onSearch && (
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
        )}
        {action}
      </div>
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
      className={`flex items-center justify-center gap-2 rounded-xl font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95 ${
        size === "sm" ? "px-3 py-1.5 text-[11px]" : "px-4 py-2.5 text-[12px]"
      } ${className}`}
      style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/[0.025] border border-border rounded-xl p-5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-[22px] font-bold text-foreground leading-none mt-1">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[14px] font-bold text-foreground mb-0.5">{children}</h2>;
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground mb-4">{children}</p>;
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.025] border border-border rounded-xl overflow-x-auto w-full mb-4">
      <table className="w-full text-left border-collapse">{children}</table>
    </div>
  );
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-border bg-white/[0.02]">
        {cols.map((c, i) => (
          <th key={i} className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Pagination({ page, total, perPage, onChange }: { page: number; total: number; perPage: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-[12px] text-muted-foreground">
      <span>Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)} - {Math.min(page * perPage, total)} of {total}</span>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-white/5 transition-colors">Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-white/5 transition-colors">Next</button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const norm = (status || "").toLowerCase();
  if (norm === "active" || norm === "verified") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase">
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-zinc-500/15 text-zinc-400 border border-zinc-500/20 uppercase">
      {status}
    </span>
  );
}

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sz = size === "md" ? "size-10 text-[13px]" : "size-8 text-[11px]";
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
    >
      {initials}
    </div>
  );
}

function DropdownMenu({
  items,
  onClose,
}: {
  items: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }[];
  onClose: () => void;
}) {
  return (
    <div
      className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-xl z-50 p-1 divide-y divide-border/50"
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors ${
            item.danger
              ? "text-red-400 hover:bg-red-500/10"
              : "text-foreground hover:bg-white/5"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
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
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto bg-background p-6 flex flex-col justify-between">
        <div>
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-bold text-foreground">{title}</SheetTitle>
            {subtitle && <p className="text-[12px] text-muted-foreground">{subtitle}</p>}
          </SheetHeader>
          {children}
        </div>
        {footer && <div className="pt-5 border-t border-border mt-6">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
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
    if (!search.trim()) return users;
    const lower = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.fullName || "").toLowerCase().includes(lower) ||
        (u.email || "").toLowerCase().includes(lower) ||
        (u.phoneNumber || "").includes(search) ||
        (u._id || "").includes(search)
    );
  }, [users, search]);

  const paged = useMemo(() => {
    return filtered.slice((page - 1) * perPage, page * perPage);
  }, [filtered, page, perPage]);

  const isFrozen = (id: string) => {
    const u = users.find((x) => x._id === id);
    if (u?.isBlocked) return true;
    return frozenIds.has(id);
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
    if (!filtered.length) return;
    const headers = [
      "ID",
      "Full Name",
      "Email",
      "Phone",
      "Naira Wallet",
      "Dollar Wallet",
      "KYC Level",
      "Verified",
      "Blocked",
      "Has Quidax",
      "Created At",
    ];

    const rows = filtered.map((u) => [
      u._id,
      u.fullName,
      u.email,
      u.phoneNumber || "",
      u.nairaWallet || 0,
      u.dollarWallet || 0,
      u.kycLevel || 0,
      u.isVerified || false,
      u.isBlocked || false,
      u.hasQuidaxId || false,
      u.createdAt || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", search ? "filtered-users.csv" : "users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <tr>
              <td colSpan={9} className="px-5 py-12 text-center text-[12px] text-muted-foreground">
                <Loader2 className="animate-spin inline mr-2" size={14} /> Loading registered users...
              </td>
            </tr>
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
