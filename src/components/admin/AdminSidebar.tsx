import {
  Users,
  Gift,
  LogOut,
  BarChart3,
  CircleDollarSign,
  ArrowLeftRight,
  Percent,
  Sheet,
  Shield,
  ChevronDown,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: BarChart3 },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Transactions", url: "/admin/transaction", icon: ArrowLeftRight },
  { title: "Promo Codes", url: "/admin/promocodes", icon: Percent },
  { title: "Ledger", url: "/admin/ledger", icon: Sheet },
  { title: "Audits", url: "/admin/audits", icon: Shield },
  { title: "Fee", url: "/admin/fee", icon: CircleDollarSign },
  { title: "Referral Downline", url: "/admin/referraldownline", icon: Gift },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isReferralOpen, setIsReferralOpen] = useState(false);

  const isCollapsed = state === "collapsed";
  const isReferralActive = location.pathname === "/admin/referral";
  const currentTab =
    new URLSearchParams(location.search).get("tab") ?? "overview";

  const handleLogout = () => {
    localStorage.removeItem("reva_admin_token");
    localStorage.removeItem("reva_admin_user");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"}>
      <SidebarContent className="bg-gradient-card border-r border-border/50">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {isCollapsed ? "R" : "Ravasend Admin"}
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">
            {!isCollapsed && ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Regular menu items — exactly as they were before */}
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-3 md:py-5 rounded-lg transition-all duration-200 mb-2 ${
                          isActive
                            ? "bg-primary/20 text-primary border border-primary/30 shadow-glow"
                            : "hover:bg-secondary/50 text-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Referral Program — same active style, with dropdown */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/admin/referral?tab=overview"
                    onClick={() => setIsReferralOpen(true)}
                    className={() =>
                      `flex items-center gap-3 px-3.5 py-3 md:py-5 rounded-lg transition-all duration-200 mb-2 ${
                        isReferralActive
                          ? "bg-primary/20 text-primary border border-primary/30 shadow-glow"
                          : "hover:bg-secondary/50 text-foreground"
                      }`
                    }
                  >
                    <Gift className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="font-medium">Referral Program</span>
                        <span
                          className="ml-auto rounded-md p-1 transition hover:bg-background/70"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsReferralOpen((o) => !o);
                          }}
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              isReferralOpen ? "rotate-180" : ""
                            }`}
                          />
                        </span>
                      </>
                    )}
                  </NavLink>
                </SidebarMenuButton>

                {!isCollapsed && isReferralOpen && (
                  <div className="ml-6 mt-1 mb-2 flex flex-col gap-1">
                    <NavLink
                      to="/admin/referral?tab=overview"
                      className={`flex items-center px-3.5 py-2 rounded-lg transition-all duration-200 text-sm border ${
                        isReferralActive && currentTab === "overview"
                          ? "bg-primary/15 text-primary border-primary/30 font-medium"
                          : "border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                    >
                      Overview
                    </NavLink>
                    <NavLink
                      to="/admin/referral?tab=details"
                      className={`flex items-center px-3.5 py-2 rounded-lg transition-all duration-200 text-sm border ${
                        isReferralActive && currentTab === "details"
                          ? "bg-primary/15 text-primary border-primary/30 font-medium"
                          : "border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                    >
                      User Details
                    </NavLink>
                  </div>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t border-border/50">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className={`w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${
              isCollapsed ? "px-2" : ""
            }`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
