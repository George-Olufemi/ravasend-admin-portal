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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { referralAPI } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  Download,
  Search,
  X,
  Users,
  Wallet,
  Lock,
  Unlock,
  Gift,
  Award,
  Copy,
  User,
  Mail,
  Hash,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types based on the referral downline response
interface ReferralDownlineUser {
  id: string;
  fullName: string;
  email: string;
  referralCode: string;
}

interface ReferralDownlineWallet {
  _id: string;
  userId: string | ReferralDownlineUser;
  amount: number;
  status: string;
  lockedAmount: number;
  withdrawn: boolean;
  bonus30Paid: boolean;
  bonus100Paid: boolean;
  bonus500Paid: boolean;
  bonus1000Paid: boolean;
  billPaymentBonus: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReferralDownlineInvitedUser {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  referredBy: string;
  amount: number;
  lockedAmount: number;
  locked: number;
  title: string;
  description: string;
  status: string;
  billPaymentBonus: boolean;
  bonus30Paid: boolean;
  bonus100Paid: boolean;
  bonus500Paid: boolean;
  bonus1000Paid: boolean;
  withdrawn: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReferralDownlineTransaction {
  _id: string;
  userId: string;
  source: string;
  amount: number;
  currency: string;
  reference: string;
  status: string;
  fee?: number;
  netAmount?: number;
  createdAt: string;
  updatedAt: string;
  cards?: any[];
  metadata?: any;
}

interface ReferralDownlineData {
  success: boolean;
  message: string;
  data: {
    user: ReferralDownlineUser;
    wallet: ReferralDownlineWallet;
    totalInvited: number;
    invitedUsers: ReferralDownlineInvitedUser[];
    referralItems: Array<{
      _id: string;
      userId: string;
      count: number;
      emails: string[];
      createdAt: string;
      updatedAt: string;
    }>;
    referralBonuses: Array<{
      _id: string;
      userId: string;
      amount: number;
    }>;
    transactions: ReferralDownlineTransaction[];
  };
}

const ReferralDownline = () => {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const {
    data: referralData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["referralDownline", activeSearch],
    queryFn: () => referralAPI.getAllReferralDownline(activeSearch),
    enabled: !!activeSearch,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const data = referralData?.data as ReferralDownlineData["data"] | undefined;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setActiveSearch(searchTerm.trim());
      setPage(1);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setActiveSearch("");
    setPage(1);
  };

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null) return "₦0.00";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-500/20 text-gray-400";
    const statusMap: Record<string, string> = {
      COMPLETED: "bg-green-500/20 text-green-400",
      SUCCESS: "bg-green-500/20 text-green-400",
      SUCCESSFUL: "bg-green-500/20 text-green-400",
      Done: "bg-green-500/20 text-green-400",
      accepted: "bg-green-500/20 text-green-400",
      completed: "bg-green-500/20 text-green-400",
      FAILED: "bg-red-500/20 text-red-400",
      FAIL: "bg-red-500/20 text-red-400",
      Processing: "bg-yellow-500/20 text-yellow-400",
      pending: "bg-yellow-500/20 text-yellow-400",
      locked: "bg-orange-500/20 text-orange-400",
      initiated: "bg-blue-500/20 text-blue-400",
    };
    return statusMap[status] || "bg-gray-500/20 text-gray-400";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Paginate invited users
  const invitedUsers = data?.invitedUsers || [];
  const totalPages = Math.ceil(invitedUsers.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedInvitedUsers = invitedUsers.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  // Adjust page if it exceeds total pages after filtering
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    } else if (totalPages === 0) {
      setPage(1);
    }
  }, [page, totalPages]);

  const safeData = (value: any, fallback: any = "-") => {
    return value !== undefined && value !== null && value !== ""
      ? value
      : fallback;
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Referral Downline
          </h1>
          <p className="text-muted-foreground">
            Search for a user by username, email, or referral code to view their
            downline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username, email, or referral code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-8"
                disabled={isLoading}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" disabled={!searchTerm.trim() || isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </form>
        </div>
      </div>

      {!activeSearch ? (
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardContent className="py-12">
            <div className="text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Search for a user</h3>
              <p className="text-muted-foreground">
                Enter a username, email address, or referral code to view their
                referral downline
              </p>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              Error loading referral data:{" "}
              {(error as any)?.message || "Unknown error"}
            </div>
            <div className="text-center mt-4">
              <Button onClick={() => refetch()} variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !data || !data.user ? (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="py-12">
            <div className="text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No user found for "{activeSearch}"
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try searching with a different username, email, or referral code
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards - with safe fallbacks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Invited
                    </p>
                    <p className="text-2xl font-bold">
                      {safeData(data.totalInvited, 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-500/20">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Wallet Balance
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(data.wallet?.amount || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-500/20">
                    <Wallet className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Locked Amount
                    </p>
                    <p className="text-2xl font-bold text-orange-400">
                      {formatCurrency(data.wallet?.lockedAmount || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-500/20">
                    <Lock className="h-6 w-6 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Bonuses
                    </p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {formatCurrency(
                        (data.referralBonuses || []).reduce(
                          (sum, b) => sum + (b?.amount || 0),
                          0,
                        ),
                      )}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-yellow-500/20">
                    <Award className="h-6 w-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Profile Card - with safe fallbacks */}
          <Card className="bg-gradient-card border-border/50 shadow-card">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                Detailed information about the referrer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/20 text-primary text-lg">
                      {getInitials(data.user?.fullName || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xl font-semibold">
                      {safeData(data.user?.fullName, "Unknown User")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <Mail className="inline h-3 w-3 mr-1" />
                      {safeData(data.user?.email, "No email")}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Referral Code:
                      </span>
                      <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded-md">
                        {safeData(data.user?.referralCode, "N/A")}
                      </span>
                      {data.user?.referralCode && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() =>
                                  copyToClipboard(data.user.referralCode)
                                }
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Copy referral code</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <Badge
                    className={
                      data.wallet?.status === "locked"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-green-500/20 text-green-400"
                    }
                  >
                    {data.wallet?.status === "locked" ? (
                      <Lock className="h-3 w-3 mr-1" />
                    ) : (
                      <Unlock className="h-3 w-3 mr-1" />
                    )}
                    {safeData(data.wallet?.status, "Unknown")
                      .charAt(0)
                      .toUpperCase() +
                      safeData(data.wallet?.status, "Unknown").slice(1)}
                  </Badge>
                  <Badge variant="outline">
                    <Hash className="h-3 w-3 mr-1" />
                    ID: {safeData(data.user?.id, "").slice(-8) || "N/A"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Bonus 30</p>
                  <Badge
                    variant={data.wallet?.bonus30Paid ? "default" : "outline"}
                    className={
                      data.wallet?.bonus30Paid
                        ? "bg-green-500/20 text-green-400"
                        : ""
                    }
                  >
                    {data.wallet?.bonus30Paid ? "✅ Paid" : "⏳ Pending"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bonus 100</p>
                  <Badge
                    variant={data.wallet?.bonus100Paid ? "default" : "outline"}
                    className={
                      data.wallet?.bonus100Paid
                        ? "bg-green-500/20 text-green-400"
                        : ""
                    }
                  >
                    {data.wallet?.bonus100Paid ? "✅ Paid" : "⏳ Pending"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bonus 500</p>
                  <Badge
                    variant={data.wallet?.bonus500Paid ? "default" : "outline"}
                    className={
                      data.wallet?.bonus500Paid
                        ? "bg-green-500/20 text-green-400"
                        : ""
                    }
                  >
                    {data.wallet?.bonus500Paid ? "✅ Paid" : "⏳ Pending"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bonus 1000</p>
                  <Badge
                    variant={data.wallet?.bonus1000Paid ? "default" : "outline"}
                    className={
                      data.wallet?.bonus1000Paid
                        ? "bg-green-500/20 text-green-400"
                        : ""
                    }
                  >
                    {data.wallet?.bonus1000Paid ? "✅ Paid" : "⏳ Pending"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral Items and Bonuses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-blue-400" />
                  Referral Items
                </CardTitle>
                <CardDescription>
                  Groups of emails referred by this user
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-64 overflow-y-auto">
                {(data.referralItems || []).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No referral items found
                  </p>
                ) : (
                  (data.referralItems || []).map((item) => (
                    <div
                      key={item._id}
                      className="bg-muted/30 rounded-lg p-4 mb-3 last:mb-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Count: {safeData(item.count, 0)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.createdAt
                            ? formatDistanceToNow(new Date(item.createdAt), {
                                addSuffix: true,
                              })
                            : "Unknown date"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(item.emails || []).map((email, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {email || "Unknown email"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-400" />
                  Referral Bonuses
                </CardTitle>
                <CardDescription>Bonuses earned from referrals</CardDescription>
              </CardHeader>
              <CardContent>
                {(data.referralBonuses || []).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No referral bonuses found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(data.referralBonuses || []).map((bonus) => (
                      <div
                        key={bonus._id}
                        className="flex items-center justify-between bg-yellow-500/10 rounded-lg px-4 py-2"
                      >
                        <span className="text-sm text-muted-foreground">
                          Bonus #{safeData(bonus._id, "").slice(-6) || "N/A"}
                        </span>
                        <span className="font-semibold text-yellow-400">
                          {formatCurrency(bonus.amount || 0)}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-border pt-2 mt-2">
                      <span className="font-medium">Total</span>
                      <span className="font-bold text-yellow-400">
                        {formatCurrency(
                          (data.referralBonuses || []).reduce(
                            (sum, b) => sum + (b?.amount || 0),
                            0,
                          ),
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Invited Users Table */}
          <Card className="bg-gradient-card border-border/50 shadow-card flex-1 flex flex-col min-h-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Invited Users
              </CardTitle>
              <CardDescription>
                {(data.invitedUsers || []).length === 0
                  ? "No users have been invited yet"
                  : `Total of ${data.invitedUsers.length} users invited by ${safeData(data.user?.fullName, "this user")}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 md:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Bonus Amount</TableHead>
                      <TableHead>Locked Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInvitedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No invited users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedInvitedUsers.map((invitedUser) => (
                        <TableRow
                          key={invitedUser._id}
                          className="hover:bg-muted/20"
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/20 text-primary">
                                  {getInitials(
                                    invitedUser.userId?.fullName || "",
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {safeData(
                                    invitedUser.userId?.fullName,
                                    "Unknown",
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ID:{" "}
                                  {safeData(invitedUser.userId?._id, "").slice(
                                    -6,
                                  ) || "N/A"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {safeData(invitedUser.userId?.email, "No email")}
                          </TableCell>
                          <TableCell>
                            {safeData(
                              invitedUser.userId?.phoneNumber,
                              "No phone",
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-green-400">
                              {formatCurrency(invitedUser.amount || 0)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(invitedUser.lockedAmount || 0) > 0 ? (
                              <div className="font-medium text-orange-400">
                                {formatCurrency(invitedUser.lockedAmount || 0)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                invitedUser.status === "locked"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : "bg-green-500/20 text-green-400"
                              }
                            >
                              {safeData(invitedUser.status, "Unknown")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {invitedUser.createdAt
                                ? formatDistanceToNow(
                                    new Date(invitedUser.createdAt),
                                    { addSuffix: true },
                                  )
                                : "Unknown"}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {(data.invitedUsers || []).length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(p - 1, 1))}
                          className={
                            page === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(totalPages, 5) }).map(
                        (_, index) => {
                          let pageNumber = index + 1;
                          if (totalPages > 5) {
                            if (page <= 3) {
                              pageNumber = index + 1;
                            } else if (page >= totalPages - 2) {
                              pageNumber = totalPages - 4 + index;
                            } else {
                              pageNumber = page - 2 + index;
                            }
                          }
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                className="cursor-pointer"
                                isActive={page === pageNumber}
                                onClick={() => setPage(pageNumber)}
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        },
                      )}

                      {totalPages > 5 && page < totalPages - 2 && (
                        <>
                          <PaginationItem>
                            <span className="px-2">...</span>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink
                              className="cursor-pointer"
                              onClick={() => setPage(totalPages)}
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage((p) => Math.min(p + 1, totalPages))
                          }
                          className={
                            page === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          {(data.transactions || []).length > 0 && (
            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Latest transactions for this user
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {(data.transactions || []).slice(0, 10).map((tx) => (
                    <div
                      key={tx._id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {safeData(tx.source, "Unknown")}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {safeData(tx.reference, "").slice(0, 16) || "N/A"}...
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tx.createdAt
                            ? formatDistanceToNow(new Date(tx.createdAt), {
                                addSuffix: true,
                              })
                            : "Unknown"}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className="text-sm font-semibold">
                          {formatCurrency(tx.amount || 0)}
                        </div>
                        <Badge className={getStatusColor(tx.status)}>
                          {safeData(tx.status, "Unknown")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ReferralDownline;
