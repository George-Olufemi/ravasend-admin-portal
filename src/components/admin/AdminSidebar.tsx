import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  ArrowLeftRight,
  Tag,
  BookOpen,
  ShieldCheck,
  Percent,
  Share2,
  ChevronDown,
  Trophy,
  Target,
  Megaphone,
  ShieldAlert,
  UserCog,
  LogOut,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/images/ravasend.png";

interface NavChild {
  id: string;
  label: string;
  url: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  url: string;
  children?: NavChild[];
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  withdrawalPaused?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const NAV: NavGroup[] = [
  {
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, url: "/admin" },
      // { id: "analytics", label: "Analytics", icon: BarChart3, url: "/admin" },
      { id: "users", label: "Users", icon: Users, url: "/admin/users" },
      { id: "transactions", label: "Transactions", icon: ArrowLeftRight, url: "/admin/transaction" },
      { id: "promo-codes", label: "Promo Codes", icon: Tag, url: "/admin/promocodes" },
      { id: "ledger", label: "Ledger", icon: BookOpen, url: "/admin/ledger" },
      { id: "audits", label: "Audits", icon: ShieldCheck, url: "/admin/audits" },
      { id: "fee", label: "Fee Structure", icon: Percent, url: "/admin/fee" },
      {
        id: "referral",
        label: "Referral Program",
        icon: Share2,
        url: "/admin/referral?tab=overview",
        children: [
          { id: "referral-overview", label: "Overview", url: "/admin/referral?tab=overview" },
          { id: "referral-details", label: "User Details", url: "/admin/referral?tab=details" },
          { id: "referral-explorer", label: "Downline Explorer", url: "/admin/referral?tab=downline" },
        ],
      },
    ],
  },
  {
    label: "Engagement",
    items: [
      // { id: "competitions", label: "Competitions", icon: Trophy, url: "/admin/competitions" },
      { id: "segments", label: "Segments", icon: Target, url: "/admin/segments" },
      { id: "campaigns", label: "Campaigns", icon: Megaphone, url: "/admin/campaign" },
    ],
  },
  {
    label: "Security & Access",
    items: [
      { id: "withdrawals", label: "Withdrawal Controls", icon: ShieldAlert, url: "/admin/withdrawal-control" },
      { id: "admin-roles", label: "Admin & Roles", icon: UserCog, url: "/admin/roles" },
    ],
  },
];

function ImageWithFallback({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [error, setError] = useState(false);
  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-primary/20 text-primary font-bold text-xs ${className}`}>
        R
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
}

export function AdminSidebar({ withdrawalPaused, isMobileOpen, onCloseMobile }: AdminSidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ referral: false });
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const userString = localStorage.getItem("reva_admin_user");
  let userName = "Chukwuemeka Obi";
  let userRole = "Super Admin";
  let userInitials = "CO";
  if (userString) {
    try {
      const u = JSON.parse(userString);
      if (u.fullName) {
        userName = u.fullName;
        userInitials = u.fullName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
      }
      if (u.role) userRole = u.role;
    } catch (e) {}
  }

  const handleLogout = () => {
    localStorage.removeItem("reva_admin_token");
    localStorage.removeItem("reva_admin_user");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };

  const isUrlActive = (itemUrl: string) => {
    const currentPath = location.pathname;
    const currentTab = new URLSearchParams(location.search).get("tab");

    if (itemUrl.includes("?tab=")) {
      const urlObj = new URL(itemUrl, "http://localhost");
      const targetTab = urlObj.searchParams.get("tab");
      return currentPath === urlObj.pathname && (currentTab === targetTab || (!currentTab && targetTab === "overview"));
    }

    if (itemUrl === "/admin") {
      return currentPath === "/admin" || currentPath === "/admin/";
    }

    return currentPath === itemUrl || currentPath.startsWith(itemUrl + "/");
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] lg:w-[210px] shrink-0 h-screen flex flex-col border-r border-border/50 overflow-hidden transition-transform duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ background: "#07051A" }}
      >
        <div className="h-[60px] flex items-center justify-between px-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <ImageWithFallback src={logoImg} alt="Ravasend" className="size-8 rounded-lg object-contain" />
            <span className="text-[13px] font-bold text-foreground tracking-tight">Ravasend Admin</span>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

      {withdrawalPaused && (
        <div className="mx-3 mt-3 px-3 py-2 bg-red-500/10 border border-red-500/25 rounded-lg flex items-center gap-2 shrink-0">
          <span className="size-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span className="text-[10px] text-red-400 font-bold">Withdrawals Paused</span>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {NAV.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-3 mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isParentActive =
                  isUrlActive(item.url) || item.children?.some((c) => isUrlActive(c.url));
                const expanded = openGroups[item.id];
                const Icon = item.icon;

                return (
                  <div key={item.id}>
                    {item.children ? (
                      <button
                        onClick={() => setOpenGroups((o) => ({ ...o, [item.id]: !o[item.id] }))}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all group relative"
                        style={{
                          color: isParentActive ? "#C4B5FD" : "#6E6A8A",
                          background: isParentActive ? "rgba(123,63,228,0.15)" : undefined,
                        }}
                      >
                        {isParentActive && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                            style={{ background: "#7B3FE4" }}
                          />
                        )}
                        <Icon size={15} style={{ color: isParentActive ? "#C4B5FD" : "#6E6A8A" }} />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          size={13}
                          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                          style={{ color: "#6E6A8A" }}
                        />
                      </button>
                    ) : (
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
                        className={({ isActive }) => {
                          const active = isActive || isUrlActive(item.url);
                          return `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all group relative`;
                        }}
                        style={({ isActive }) => {
                          const active = isActive || isUrlActive(item.url);
                          return {
                            color: active ? "#C4B5FD" : "#6E6A8A",
                            background: active ? "rgba(123,63,228,0.15)" : undefined,
                          };
                        }}
                      >
                        {({ isActive }) => {
                          const active = isActive || isUrlActive(item.url);
                          return (
                            <>
                              {active && (
                                <span
                                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                                  style={{ background: "#7B3FE4" }}
                                />
                              )}
                              <Icon size={15} style={{ color: active ? "#C4B5FD" : "#6E6A8A" }} />
                              <span className="flex-1 text-left">{item.label}</span>
                            </>
                          );
                        }}
                      </NavLink>
                    )}

                    {item.children && expanded && (
                      <div className="ml-8 mt-0.5 space-y-0.5">
                        {item.children.map((child) => {
                          const childActive = isUrlActive(child.url);
                          return (
                            <NavLink
                              key={child.id}
                              to={child.url}
                              className="w-full block text-left px-3 py-2 rounded-lg text-[12px] transition-all"
                              style={{
                                color: childActive ? "#C4B5FD" : "#6E6A8A",
                                fontWeight: childActive ? 600 : 400,
                                background: childActive ? "rgba(123,63,228,0.12)" : undefined,
                              }}
                            >
                              {child.label}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border/50 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <div
            className="size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
          >
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-foreground truncate">{userName}</p>
            <p className="text-[9px] text-muted-foreground">{userRole}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-[#6E6A8A] hover:text-foreground transition-colors"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
    </>
  );
}

export default AdminSidebar;