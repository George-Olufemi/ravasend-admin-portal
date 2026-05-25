import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { referralAPI, ReferralBonus, ReferralDetailRecord } from "@/lib/api";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ReferralTab = "overview" | "details";

const ReferralProgram = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as ReferralTab) ?? "overview";

  const overviewQuery = useQuery({
    queryKey: ["referrals"],
    queryFn: referralAPI.getAll,
  });

  const detailsQuery = useQuery({
    queryKey: ["referral-details"],
    queryFn: referralAPI.getAllReferralDetails,
    enabled: activeTab === "details",
  });

  const referrals: ReferralBonus[] = overviewQuery.data?.data || [];
  const referralDetails: ReferralDetailRecord[] = detailsQuery.data?.data || [];

  /**
   * FILTER OUT INVALID RECORDS
   * Prevent crashes from null userId
   */
  const validReferrals = useMemo(() => {
    return referrals.filter((item) => item.userId);
  }, [referrals]);

  const totalReferredUsers = validReferrals.length;
  const totalInvites = overviewQuery.data?.count ?? validReferrals.length;

  const totalRewardGiven = validReferrals.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const totalDepositAmount = validReferrals.reduce(
    (sum, item) => sum + (item.userId?.dollarWallet || 0),
    0,
  );

  const totalDepositUsers = validReferrals.filter(
    (item) => (item.userId?.dollarWallet || 0) > 0,
  ).length;

  const minDeposit = 0;
  const minReward = 0;

  const sortedReferrals = useMemo(() => {
    if (!validReferrals.length) return [];

    return [...validReferrals].sort((a, b) => b.amount - a.amount);
  }, [validReferrals]);

  const filteredReferrals = useMemo(() => {
    return sortedReferrals.filter((item) => {
      const deposit = item.userId?.dollarWallet || 0;

      return deposit >= minDeposit && item.amount >= minReward;
    });
  }, [sortedReferrals]);

  const [viewMode, setViewMode] = useState<"table" | "chart">("table");

  const [chartBy, setChartBy] = useState<"reward" | "deposit">("reward");

  /**
   * SAFE CHART DATA
   */
  const chartData = useMemo(() => {
    const sorted = [...filteredReferrals].sort((a, b) => {
      if (chartBy === "reward") return b.amount - a.amount;

      return (b.userId?.dollarWallet || 0) - (a.userId?.dollarWallet || 0);
    });

    return sorted.slice(0, 10).map((item) => ({
      user: item.userId?.fullName || "Unknown User",
      deposit: item.userId?.dollarWallet || 0,
      reward: item.amount,
    }));
  }, [filteredReferrals, chartBy]);

  const detailsSummary = useMemo(() => {
    const totalAmount = referralDetails.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const withReferrer = referralDetails.filter(
      (item) => item.referredBy,
    ).length;

    const withoutReferrer = referralDetails.length - withReferrer;

    return {
      totalAmount,
      withReferrer,
      withoutReferrer,
    };
  }, [referralDetails]);

  const [detailsPage, setDetailsPage] = useState(1);
  const detailsPageSize = 10;

  const totalDetailsPages = Math.max(
    1,
    Math.ceil(referralDetails.length / detailsPageSize),
  );

  useEffect(() => {
    setDetailsPage((current) => Math.min(current, totalDetailsPages));
  }, [totalDetailsPages]);

  const paginatedReferralDetails = useMemo(() => {
    const start = (detailsPage - 1) * detailsPageSize;
    const end = start + detailsPageSize;

    return referralDetails.slice(start, end);
  }, [detailsPage, referralDetails]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  const formatUsd = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const formatDateTime = (value?: string) => {
    if (!value) return "-";

    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  };

  const getStatusVariant = (status: string, withdrawn: boolean) => {
    if (withdrawn) return "destructive";

    if (status?.toLowerCase() === "locked") return "secondary";

    if (status?.toLowerCase() === "unknown") return "outline";

    return "default";
  };

  /**
   * SAFE CSV EXPORT
   */
  const exportCsv = () => {
    if (!filteredReferrals.length) return;

    const headers = [
      "Referrer Name",
      "Referrer Email",
      "Referrer Phone",
      "Referred Signup Date",
      "Deposit (USD)",
      "Referral Reward (NGN)",
    ];

    const rows = filteredReferrals.map((item) => [
      item.userId?.fullName || "Unknown User",
      item.userId?.email || "-",
      item.userId?.phoneNumber || "-",
      item.userId?.createdAt || "-",
      (item.userId?.dollarWallet || 0).toFixed(2),
      item.amount.toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((row) =>
          row
            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");

    link.setAttribute("href", encodedUri);

    link.setAttribute(
      "download",
      `referral-report-${new Date().toISOString()}.csv`,
    );

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  const handleTabChange = (tab: ReferralTab) => {
    const params = new URLSearchParams(searchParams);

    params.set("tab", tab);

    setSearchParams(params);
  };

  if (overviewQuery.isLoading && activeTab === "overview") {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (detailsQuery.isLoading && activeTab === "details") {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (overviewQuery.error && activeTab === "overview") {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="pt-6 text-center text-destructive">
          Error loading referral data:{" "}
          {(overviewQuery.error as Error)?.message || "Unknown error"}
        </CardContent>
      </Card>
    );
  }

  if (detailsQuery.error && activeTab === "details") {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="pt-6 text-center text-destructive">
          Error loading referral user details:{" "}
          {(detailsQuery.error as Error)?.message || "Unknown error"}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight">
            Referral Program
          </h1>

          <p className="text-muted-foreground">
            Use the sidebar to jump between the current referral overview and
            the new referral user details view.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/80 px-4 py-3 text-sm text-muted-foreground">
          Tip: the Referral Program menu now opens a quick overview/details
          view.
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => handleTabChange(value as ReferralTab)}
      >
        <TabsList>
          <TabsTrigger value="overview">Referral Overview</TabsTrigger>

          <TabsTrigger value="details">Referral User Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader>
                <CardTitle>Invites Sent</CardTitle>

                <CardDescription>Potential referral targets</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="text-3xl font-bold">{totalInvites}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader>
                <CardTitle>Signups from Referrals</CardTitle>

                <CardDescription>
                  Referred users that registered
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="text-3xl font-bold">{totalReferredUsers}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader>
                <CardTitle>Deposit Contributors</CardTitle>

                <CardDescription>
                  Signup users that made deposits
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="text-3xl font-bold">{totalDepositUsers}</div>

                <div className="mt-1 text-sm text-muted-foreground">
                  from {totalReferredUsers} referred
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader>
                <CardTitle>Referral Reward Paid</CardTitle>

                <CardDescription>Total referral rewards given</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(totalRewardGiven)}
                </div>

                <div className="mt-1 text-sm text-muted-foreground">
                  {validReferrals.length} reward records
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 bg-gradient-card border-border/50 shadow-card">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
                <div>
                  <CardTitle>Referral Performance</CardTitle>

                  <CardDescription>
                    Choose table or chart view to inspect top referrals by
                    reward or deposit.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    onClick={() => setViewMode("table")}
                  >
                    Table
                  </Button>

                  <Button
                    variant={viewMode === "chart" ? "default" : "outline"}
                    onClick={() => setViewMode("chart")}
                  >
                    Chart
                  </Button>

                  <Button variant="outline" onClick={exportCsv}>
                    Export CSV
                  </Button>

                  <select
                    value={chartBy}
                    onChange={(e) =>
                      setChartBy(e.target.value as "reward" | "deposit")
                    }
                    className="rounded-lg border border-border/70 bg-background px-2 py-1 text-sm"
                  >
                    <option value="reward">Chart by Reward</option>

                    <option value="deposit">Chart by Deposit</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {viewMode === "chart" ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{
                        top: 8,
                        right: 16,
                        left: 0,
                        bottom: 16,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                      <XAxis
                        dataKey="user"
                        tick={{ fontSize: 12 }}
                        minTickGap={8}
                      />

                      <YAxis
                        tickFormatter={(value) => formatUsd(Number(value))}
                      />

                      <Tooltip
                        formatter={(value: number) => formatUsd(Number(value))}
                      />

                      <Bar
                        dataKey={chartBy}
                        fill={chartBy === "reward" ? "#2563eb" : "#16a34a"}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="rounded-md border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Referrer</TableHead>

                        <TableHead>Referred User</TableHead>

                        <TableHead>Deposit (USD)</TableHead>

                        <TableHead>Referral Reward (NGN)</TableHead>

                        <TableHead>Signup Date</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredReferrals.map((item) => {
                        const deposit = item.userId?.dollarWallet || 0;

                        return (
                          <TableRow
                            key={item._id}
                            className="hover:bg-muted/20"
                          >
                            <TableCell className="font-medium">
                              {item.userId?.fullName || "Unknown User"}
                            </TableCell>

                            <TableCell>{item.userId?.email || "-"}</TableCell>

                            <TableCell>{formatUsd(deposit)}</TableCell>

                            <TableCell>₦{item.amount}</TableCell>

                            <TableCell>
                              {item.userId?.createdAt
                                ? new Date(
                                    item.userId.createdAt,
                                  ).toLocaleDateString()
                                : "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {filteredReferrals.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">
                      No referral records match your filters.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader>
                <CardTitle>Referral Records</CardTitle>

                <CardDescription>
                  Total referral user detail record
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="text-3xl font-bold">
                  {referralDetails.length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader>
                <CardTitle>Total Amount</CardTitle>

                <CardDescription>
                  Combined referral payout amount
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(detailsSummary.totalAmount)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader>
                <CardTitle>Linked Referrers</CardTitle>

                <CardDescription>
                  Referrals with referee information
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="text-3xl font-bold">
                  {detailsSummary.withReferrer}
                </div>
              </CardContent>
            </Card>
            {/* <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader>
                <CardTitle>Pending Referrer</CardTitle>

                <CardDescription>Records without a referee</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="text-3xl font-bold">
                  {detailsSummary.withoutReferrer}
                </div>
              </CardContent>
            </Card> */}
          </div>
          <Card className="mt-6 bg-gradient-card border-border/50 shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Referral User Details</CardTitle>
                  <CardDescription>
                    Referred users and their referrers
                  </CardDescription>
                </div>
                {/* <Badge variant="outline">
                  {referralDetails.length} records
                </Badge> */}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="overflow-hidden rounded-md border border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Referred User</TableHead>
                        <TableHead>Referred By</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginatedReferralDetails.map((item) => (
                        <TableRow
                          key={item.id}
                          className="align-top hover:bg-muted/20"
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {item.user?.fullName || "Unknown User"}
                              </p>

                              <p className="text-sm text-muted-foreground">
                                {item.user?.email || "-"}
                              </p>

                              <p className="text-sm text-muted-foreground">
                                {item.user?.phoneNumber || "-"}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            {item.referredBy ? (
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {item.referredBy?.fullName ||
                                    "Unknown Referrer"}
                                </p>

                                <p className="text-sm text-muted-foreground">
                                  {item.referredBy?.email || "-"}
                                </p>

                                <p className="text-sm text-muted-foreground">
                                  {item.referredBy?.phoneNumber || "-"}
                                </p>
                              </div>
                            ) : (
                              <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-sm text-muted-foreground">
                                No referrer recorded
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{item.type || "-"}</p>

                              <p className="text-sm text-muted-foreground">
                                {item.title || "No title provided"}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {formatCurrency(item.amount || 0)}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>{formatDateTime(item.updatedAt)}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {referralDetails.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">
                      No referral user detail records are available right now.
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-row justify-between">
                  <div className="flex justify-between items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDetailsPage((page) => Math.max(1, page - 1))
                      }
                      disabled={detailsPage === 1}
                    >
                      Previous
                    </Button>

                    <span className="text-sm text-muted-foreground">
                      Page {detailsPage} of {totalDetailsPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDetailsPage((page) =>
                          Math.min(totalDetailsPages, page + 1),
                        )
                      }
                      disabled={detailsPage >= totalDetailsPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReferralProgram;
