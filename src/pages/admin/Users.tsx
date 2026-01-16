import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { usersAPI, User } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";


const Users = () => {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: usersAPI.getAll,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
            Error loading users: {(error as any)?.message || 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const users = usersData?.users || [];

  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedUsers = users.slice(startIndex, startIndex + PAGE_SIZE);

  // console.log("users: ", users);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage and view all registered users on the platform
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/30"
        >
          {users.length} Total Users
        </Badge>
      </div>

      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Complete list of users registered on the Reva platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>NGN Balance</TableHead>
                  <TableHead>USD Balance</TableHead>
                  <TableHead>KYC Level</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user: User) => (
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
                            user.hasKyc ? "bg-green-500/20 text-green-400" : ""
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
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between mt-4">
            {/* <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p> */}

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

                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
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
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;