import { useQuery } from "@tanstack/react-query";
import { metricsAPI } from "@/lib/api"; // adjust path to your api file
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Gift, TrendingUp, DollarSign } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("reva_admin_user") || "{}");

  // Fetch metrics with React Query
  const {
    data: metricsResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["metrics"],
    queryFn: metricsAPI.getAll,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    console.error(error);
    return <p>Failed to load metrics. Please try again.</p>;
  }

  const metrics = metricsResponse?.data;

  const stats = [
    {
      title: "Total Users",
      value: metrics?.users?.total ?? 0,
      description: `${metrics?.users?.growthRate} from last month`,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Active Promo Codes",
      value: metrics?.promos?.total ?? 0,
      description: `${metrics?.promos?.expiredSoon} expiring soon`,
      icon: Gift,
      color: "text-green-500",
    },
    {
      title: "Total Transactions",
      value: metrics?.transactions?.total ?? 0,
      description: `${metrics?.transactions?.growthRate} from last month`,
      icon: DollarSign,
      color: "text-yellow-500",
    },
    {
      title: "Growth Rate",
      value: metrics?.growthRate?.growthRate ?? "0%",
      description: "Monthly active users",
      icon: TrendingUp,
      color: "text-purple-500",
    },
  ];

  // recent activity (users, transactions, promos)
  type RecentActivity = {
    users?: Array<{ _id: string; fullName: string; createdAt: string }>;
    transactions?: Array<{
      _id: string;
      amount: number;
      status: string;
      createdAt: string;
    }>;
    promos?: Array<{ _id: string; promoCode: string; createdAt: string }>;
  };

  const recent: RecentActivity = metrics?.recent ?? {
    users: [],
    transactions: [],
    promos: [],
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Welcome back, {user.fullName || "Admin"}! 👋
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Here's what's happening with your Reva platform today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="bg-gradient-card border-border/50 shadow-card"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest user registrations and transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recent Users */}
            {recent.users?.map((u: any) => (
              <div key={u._id} className="flex items-center space-x-4">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{u.fullName} registered</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(u.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Recent Transactions */}
            {recent.transactions?.map((t: any) => (
              <div key={t._id} className="flex items-center space-x-4">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Transaction of ₦{t.amount} {t.status.toLowerCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(t.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Recent Promos */}
            {recent.promos?.map((p: any) => (
              <div key={p._id} className="flex items-center space-x-4">
                <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Gift className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Promo code {p.promoCode} created
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(p.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>All systems operational</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Status</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-green-500">Operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-green-500">Operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Payment Gateway</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-green-500">Operational</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
