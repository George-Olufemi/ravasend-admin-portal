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
import { formatDistanceToNow, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
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

  const transactions: Transaction[] = transactionsData?.data || [];

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedData = transactions.slice(startIndex, startIndex + PAGE_SIZE);

  const FIAT_CURRENCIES = ["NGN", "USD", "EUR", "GBP"];

  const formatAmount = (
    amount: number | undefined,
    currency: string | undefined,
  ) => {
    if (amount === undefined) return "N/A";
    const cur = (currency ?? "NGN").toUpperCase();

    if (FIAT_CURRENCIES.includes(cur)) {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: cur,
      }).format(amount);
    }

    const cryptoMatch = cur.match(/^([A-Z]+)/);
    const ticker = cryptoMatch ? cryptoMatch[1] : cur;

    return `${new Intl.NumberFormat("en-NG").format(amount)} ${ticker}`;
  };

  // --- CSV Export ---
  const handleDownloadCSV = () => {
    const headers = [
      "Transaction ID",
      "Full Name",
      "Email",
      "Phone Number",
      "Source",
      "Amount (NGN)",
      "Currency",
      "Reference",
      "Session ID",
      "Fee (NGN)",
      "Net Amount (NGN)",
      "Status",
      "Destination Account Number",
      "Destination Account Name",
      "Destination Bank",
      "Date",
    ];

    const rows = transactions.map((trx) => [
      trx._id,
      trx.userId?.fullName ?? "",
      trx.userId?.email ?? "",
      trx.userId?.phoneNumber ?? "",
      trx.source ?? "",
      trx.amount ?? "",
      trx.currency ?? "",
      trx.reference ?? "",
      trx.sessionId ?? "",
      trx.fee ?? "",
      trx.netAmount ?? "",
      trx.status ?? "",
      trx.destinationAccountNumber ?? "",
      trx.destinationAccountName ?? "",
      trx.destionationBankName ?? "",
      trx.createdAt
        ? format(new Date(trx.createdAt), "yyyy-MM-dd HH:mm:ss")
        : "",
    ]);

    const escape = (val: string | number) => {
      const str = String(val);
      if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };

    const csvContent = [
      headers.map(escape).join(","),
      ...rows.map((row) => row.map(escape).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `transactions_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col space-y-6 min-h-full flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            All user transactions on the platform
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Badge variant="outline" className="text-xs">
            {transactions.length} Total Transactions
          </Badge>
          <Button
            onClick={handleDownloadCSV}
            variant="outline"
            className="flex items-center gap-2 text-xs h-9"
            disabled={transactions.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-card border-border/50 shadow-card flex-1 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Latest financial activities from users
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col min-h-0 p-4 md:p-6 space-y-4 overflow-hidden">
          <div className="flex-1 overflow-auto w-full rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>User</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((trx: Transaction) => (
                    <TableRow key={trx._id} className="hover:bg-muted/20">
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {trx.userId?.fullName ?? "-"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {trx.userId?.email ?? "-"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {trx.userId?.phoneNumber ?? "-"}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="capitalize">
                        {trx.source ?? "-"}
                      </TableCell>

                      <TableCell className="font-medium">
                        {trx.amount?.toLocaleString() ?? "-"}
                      </TableCell>

                      <TableCell>{trx.currency ?? "-"}</TableCell>

                      <TableCell className="font-mono text-xs">
                        {trx.reference ?? "-"}
                      </TableCell>

                      <TableCell>
                        {trx.destinationAccountName ? (
                          <div>
                            <div className="text-sm font-medium">
                              {trx.destinationAccountName ?? "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {trx.destinationAccountNumber ?? "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {trx.destionationBankName ?? "-"}
                            </div>
                          </div>
                        ) : trx.destination ? (
                          <div className="text-sm">
                            {trx.destination ?? "-"}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {formatAmount(trx.fee, "NGN")}
                      </TableCell>

                      <TableCell>
                        {trx.netAmount?.toLocaleString() ?? "-"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            trx.status === "COMPLETED" ||
                            trx.status === "SUCCESS" ||
                            trx.status === "done" ||
                            trx.status === "SUCCESSFUL" ||
                            trx.status === "completed" ||
                            trx.status === "Done" ||
                            trx.status === "accepted"
                              ? "default"
                              : trx.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                          }
                          className={
                            trx.status === "COMPLETED" ||
                            trx.status === "SUCCESS" ||
                            trx.status === "done" ||
                            trx.status === "SUCCESSFUL" ||
                            trx.status === "completed" ||
                            trx.status === "Done" ||
                            trx.status === "accepted"
                              ? "bg-green-500/20 text-green-400"
                              : ""
                          }
                        >
                          {trx.status ?? "-"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-sm whitespace-nowrap">
                        {trx.createdAt
                          ? formatDistanceToNow(new Date(trx.createdAt), {
                              addSuffix: true,
                            })
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {transactions.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/50 shrink-0">
              <span className="text-[12px] text-muted-foreground text-center sm:text-left">
                Showing {startIndex + 1} - {Math.min(startIndex + PAGE_SIZE, transactions.length)} of {transactions.length} transactions
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

export default Transactions;
