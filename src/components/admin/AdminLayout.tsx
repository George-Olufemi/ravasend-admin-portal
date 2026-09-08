import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { BarChart2, ChevronRight, Bell, Menu } from "lucide-react";

function TopBar({ title, onToggleMobile }: { title: string; onToggleMobile: () => void }) {
  const userString = localStorage.getItem("reva_admin_user");
  let userInitials = "CO";
  if (userString) {
    try {
      const u = JSON.parse(userString);
      if (u.fullName) {
        userInitials = u.fullName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
      }
    } catch (e) {}
  }

  return (
    <div className="h-[52px] border-b border-border/50 flex items-center px-4 sm:px-7 gap-2.5 sm:gap-3 shrink-0" style={{ background: "#07051A" }}>
      <button
        onClick={onToggleMobile}
        className="lg:hidden p-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        aria-label="Toggle navigation menu"
      >
        <Menu size={18} />
      </button>
      <div className="size-6 rounded-md bg-primary/20 flex items-center justify-center shrink-0 hidden sm:flex">
        <BarChart2 size={13} className="text-primary" />
      </div>
      <span className="text-[12px] text-muted-foreground font-medium hidden sm:inline">Admin Dashboard</span>
      <ChevronRight size={12} className="text-muted-foreground hidden sm:inline" />
      <span className="text-[12px] font-semibold text-foreground truncate">{title}</span>
      <div className="ml-auto flex items-center gap-2.5 sm:gap-3 shrink-0">
        <button className="relative size-8 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={14} />
          <span className="absolute top-1.5 right-1.5 size-1.5 bg-primary rounded-full" />
        </button>
        <div className="size-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}>{userInitials}</div>
      </div>
    </div>
  );
}

const getPageTitle = (pathname: string, search: string) => {
  if (pathname === "/admin" || pathname === "/admin/") return "Dashboard";
  if (pathname.includes("/users")) return "Users";
  if (pathname.includes("/transaction")) return "Transactions";
  if (pathname.includes("/promocodes")) return "Promo Codes";
  if (pathname.includes("/ledger")) return "Ledger";
  if (pathname.includes("/audits")) return "Audits";
  if (pathname.includes("/fee")) return "Fee Structure";
  if (pathname.includes("/referral")) {
    const tab = new URLSearchParams(search).get("tab");
    if (tab === "details") return "User Details";
    if (tab === "downline") return "Downline Explorer";
    return "Overview";
  }
  if (pathname.includes("/withdrawal-control")) return "Withdrawal Controls";
  if (pathname.includes("/roles")) return "Admin & Roles";
  if (pathname.includes("/campaign")) return "Campaigns";
  if (pathname.includes("/competitions")) return "Competitions";
  return "Admin Dashboard";
};

const AdminLayout = () => {
  const token = localStorage.getItem("reva_admin_token");
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [withdrawalPaused, setWithdrawalPaused] = useState(() => {
    return localStorage.getItem("reva_withdrawal_paused") === "true";
  });

  useEffect(() => {
    const handlePauseChange = (e: CustomEvent<boolean>) => {
      setWithdrawalPaused(e.detail);
      localStorage.setItem("reva_withdrawal_paused", String(e.detail));
    };
    window.addEventListener("withdrawal-paused-changed" as any, handlePauseChange);
    return () => window.removeEventListener("withdrawal-paused-changed" as any, handlePauseChange);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, location.search]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const title = getPageTitle(location.pathname, location.search);

  return (
    <div className="min-h-screen flex w-full text-foreground relative overflow-x-hidden" style={{ background: "#07051A" }}>
      <AdminSidebar
        withdrawalPaused={withdrawalPaused}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar title={title} onToggleMobile={() => setIsMobileOpen((open) => !open)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7" style={{ background: "#07051A" }}>
          <Outlet context={{ withdrawalPaused, setWithdrawalPaused }} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;