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
import { usersAPI, User } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { useState, useMemo, useEffect } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Download, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const Users = () => {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: usersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: usersAPI.getAll,
  });

  const users = usersData?.users || [];

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const lowerSearch = searchTerm.toLowerCase();
    return users.filter(
      (user: User) =>
        user.fullName.toLowerCase().includes(lowerSearch) ||
        user.email.toLowerCase().includes(lowerSearch) ||
        (user.username && user.username.toLowerCase().includes(lowerSearch)) ||
        (user.phoneNumber &&
          user.phoneNumber.toLowerCase().includes(lowerSearch)) ||
        user._id.toLowerCase().includes(lowerSearch),
    );
  }, [users, searchTerm]);

  // Reset to first page when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Adjust page if it exceeds total pages after filtering
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    } else if (totalPages === 0) {
      setPage(1);
    }
  }, [page, totalPages]);

  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const downloadCSV = () => {
    if (!filteredUsers.length) return;

    const headers = [
      "ID",
      "Full Name",
      "Email",
      "Phone",
      "Username",
      "Naira Wallet",
      "Dollar Wallet",
      "KYC Level",
      "Has KYC",
      "Verified",
      "Blocked",
      "Has Quidax",
      "Referral Code",
      "Referred By",
      "Created At",
      "Last Login",
    ];

    const rows = filteredUsers.map((user: User) => [
      user._id,
      user.fullName,
      user.email,
      user.phoneNumber,
      user.username,
      user.nairaWallet,
      user.dollarWallet,
      user.kycLevel,
      user.hasKyc,
      user.isVerified,
      user.isBlocked,
      user.hasQuidaxId,
      user.referralCode,
      user.referredBy || "",
      user.createdAt,
      user.lastLogin || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      searchTerm ? "filtered-users.csv" : "users.csv",
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearSearch = () => {
    setSearchTerm("");
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
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            Error loading users: {(error as any)?.message || "Unknown error"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-7 flex flex-col space-y-6 min-h-full flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage and view all registered users on the platform
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, username or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-8"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={downloadCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-card border-border/50 shadow-card flex-1 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {filteredUsers.length === users.length
              ? `Total of ${users.length} users on Ravasend`
              : `Showing ${filteredUsers.length} of ${users.length} users`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 p-4 md:p-6 space-y-4 overflow-hidden">
          <div className="flex-1 overflow-auto w-full rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>NGN Balance</TableHead>
                  <TableHead>USD Balance</TableHead>
                  <TableHead>KYC Level</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No users found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user: User) => (
                    <TableRow key={user._id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image} alt={user.fullName} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {getInitials(user.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {user._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{user.email}</div>
                          {user.isVerified && (
                            <Badge
                              variant="secondary"
                              className="h-5 text-xs bg-green-500/20 text-green-400"
                            >
                              Verified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{user.phoneNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge
                            variant={user.isBlocked ? "destructive" : "default"}
                            className={
                              user.isBlocked
                                ? ""
                                : "bg-green-500/20 text-green-400"
                            }
                          >
                            {user.isBlocked ? "Blocked" : "Active"}
                          </Badge>
                          {user.hasQuidaxId && (
                            <div>
                              <Badge variant="outline" className="h-5 text-xs">
                                Quidax ID
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(user.nairaWallet)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${user?.dollarWallet}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className={
                              user.hasKyc
                                ? "bg-green-500/20 text-green-400"
                                : ""
                            }
                          >
                            Level {user.kycLevel}
                          </Badge>
                          {user.hasKyc && (
                            <Badge
                              variant="secondary"
                              className="h-5 text-xs bg-blue-500/20 text-blue-400"
                            >
                              KYC Complete
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(user.createdAt), {
                            addSuffix: true,
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-border/50 shrink-0">
              <span className="text-[12px] text-muted-foreground">
                Showing {startIndex + 1} - {Math.min(startIndex + PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users
              </span>
              {totalPages > 1 && (
                <Pagination className="mx-0 w-auto">
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
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
