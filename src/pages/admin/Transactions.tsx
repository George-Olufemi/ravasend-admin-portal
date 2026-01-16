"use client";

import { useState } from "react";
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { transactionAPI } from "@/lib/api";
import { Transaction } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const Transactions = () => {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const {
    data: transactionsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: transactionAPI.getAll,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-destructive">
          Error loading transactions
        </CardContent>
      </Card>
    );
  }

  const transactions = transactionsData?.data || [];

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedData = transactions.slice(startIndex, startIndex + PAGE_SIZE);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            All user transactions on the platform
          </p>
        </div>
        <Badge variant="outline">
          {transactions.length} Total Transactions
        </Badge>
      </div>

      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Latest financial activities from users
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>User</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedData.map((trx: Transaction) => (
                  <TableRow key={trx._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{trx.userId.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {trx.userId.email}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="capitalize">{trx.source}</TableCell>

                    <TableCell className="font-medium">
                      {formatCurrency(trx.amount)}
                    </TableCell>

                    <TableCell>{trx.currency}</TableCell>
                    <TableCell>{trx.reference}</TableCell>
                    <TableCell>{formatCurrency(trx.fee) || "N/A"}</TableCell>

                    <TableCell>
                      {formatCurrency(trx.netAmount) || "N/A"}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          trx.status === "COMPLETED"
                            ? "default"
                            : trx.status === "FAILED"
                            ? "destructive"
                            : trx.status === "Processing"
                            ? "primary"
                            : "secondary"
                        }
                      >
                        {trx.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(trx.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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

export default Transactions;
