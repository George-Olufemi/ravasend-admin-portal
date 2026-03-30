import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { referralAPI, ReferralBonus } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ReferralProgram = () => {
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  const [sortBy, setSortBy] = useState<"reward" | "deposit" | "signup">(
    "reward",
  );
  const [chartBy, setChartBy] = useState<"reward" | "deposit">("reward");
  const [minDeposit, setMinDeposit] = useState<number>(0);
  const [minReward, setMinReward] = useState<number>(0);

  const {
    data: referralResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["referrals"],
    queryFn: referralAPI.getAll,
  });

  const referrals: ReferralBonus[] = referralResponse?.data || [];

  const totalReferredUsers = referrals.length;
  const totalInvites = referralResponse?.count ?? referrals.length;

  const totalRewardGiven = referrals.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const totalDepositAmount = referrals.reduce(
    (sum, item) => sum + (item.userId?.dollarWallet || 0),
    0,
  );

  const totalDepositUsers = referrals.filter(
    (item) => (item.userId?.dollarWallet || 0) > 0,
  ).length;

  const sortedReferrals = useMemo(() => {
    if (!referrals.length) return [];

    const data = [...referrals];

    switch (sortBy) {
      case "deposit":
        return data.sort(
          (a, b) =>
            (b.userId?.dollarWallet || 0) - (a.userId?.dollarWallet || 0),
        );

      case "signup":
        return data.sort((a, b) =>
          a.userId.fullName.localeCompare(b.userId.fullName),
        );

      case "reward":
      default:
        return data.sort((a, b) => b.amount - a.amount);
    }
  }, [referrals, sortBy]);

  const filteredReferrals = useMemo(() => {
    return sortedReferrals.filter((item) => {
      const deposit = item.userId?.dollarWallet || 0;
      return deposit >= minDeposit && item.amount >= minReward;
    });
  }, [sortedReferrals, minDeposit, minReward]);

  const chartData = useMemo(() => {
    const sorted = [...filteredReferrals].sort((a, b) => {
      if (chartBy === "reward") return b.amount - a.amount;
      return (b.userId?.dollarWallet || 0) - (a.userId?.dollarWallet || 0);
    });

    return sorted.slice(0, 10).map((item) => ({
      user: item.userId.fullName,
      deposit: item.userId?.dollarWallet || 0,
      reward: item.amount,
    }));
  }, [filteredReferrals, chartBy]);

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
      item.userId.fullName,
      item.userId.email,
      item.userId.phoneNumber,
      item.userId.createdAt,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="pt-6 text-center text-destructive">
          Error loading referral data:{" "}
          {(error as any)?.message || "Unknown error"}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Referral Program
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Track invited users, signups, deposit conversions, and referral
            reward payout in one clean view.
          </p>
        </div>
      </div>

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
            <CardDescription>Referred users that registered</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalReferredUsers}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle>Deposit Contributors</CardTitle>
            <CardDescription>Signup users that made deposits</CardDescription>
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
              {referrals.length} reward records
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
            <div>
              <CardTitle>Referral Performance</CardTitle>
              <CardDescription>
                Filter, sort, and choose table or chart view for top referrals
                by reward / deposit.
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
          {/* <div className="grid gap-2 sm:grid-cols-3 items-end">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Min Deposit (USD)
              </label>
              <input
                type="number"
                value={minDeposit}
                min={0}
                step={1}
                onChange={(e) => setMinDeposit(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-border/70 bg-background px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Min Reward (USD)
              </label>
              <input
                type="number"
                value={minReward}
                min={0}
                step={1}
                onChange={(e) => setMinReward(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-border/70 bg-background px-2 py-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={exportCsv}>Export CSV</Button>
              <span className="text-xs text-muted-foreground">
                {filteredReferrals.length} row(s) filtered
              </span>
            </div>
          </div> */}

          {viewMode === "chart" ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 16, left: 0, bottom: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="user"
                    tick={{ fontSize: 12 }}
                    minTickGap={8}
                  />
                  <YAxis tickFormatter={(value) => formatUsd(Number(value))} />
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
                    {/* <TableHead>Details</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.map((item) => {
                    const deposit = item.userId?.dollarWallet || 0;
                    return (
                      <TableRow key={item._id} className="hover:bg-muted/20">
                        <TableCell className="font-medium">
                          {item.userId.fullName}
                        </TableCell>
                        <TableCell>{item.userId.email}</TableCell>
                        <TableCell>{formatUsd(deposit)}</TableCell>
                        <TableCell>₦{item.amount}</TableCell>
                        <TableCell>
                          {new Date(item.userId.createdAt).toLocaleDateString()}
                        </TableCell>
                        {/* <TableCell>
                          <Accordion type="single" collapsible>
                            <AccordionItem value={item._id}>
                              <AccordionTrigger className="text-xs">
                                View details
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <div>
                                    <strong>Referred by:</strong>{" "}
                                    {item.userId.fullName} ({item.userId.email})
                                  </div>
                                  <div>
                                    <strong>Deposit:</strong>{" "}
                                    {formatUsd(deposit)}
                                  </div>
                                  <div>
                                    <strong>Reward:</strong>{" "}
                                    {(item.amount)}
                                  </div>
                                  <div>
                                    <strong>Phone:</strong>{" "}
                                    {item.userId.phoneNumber}
                                  </div>
                                  <div>
                                    <strong>Joined:</strong>{" "}
                                    {new Date(
                                      item.userId.createdAt,
                                    ).toLocaleString()}
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </TableCell> */}
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

      {/* Summary */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>Deposit Amount Summary</CardTitle>
          <CardDescription>
            Aggregate referred signup deposit amount and rewards to understand
            conversion.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Total Referred Deposit
              </p>
              <p className="text-xl font-bold">
                {formatCurrency(totalDepositAmount)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Referral Reward Payout
              </p>
              <p className="text-xl font-bold">
                {formatCurrency(totalRewardGiven)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralProgram;
