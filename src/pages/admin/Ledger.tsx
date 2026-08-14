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
import { ledgerAPI, LedgerEntry, LedgerResponse } from "@/lib/api";
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
import {
  Download,
  Search,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const getUserId = (entry: LedgerEntry): string | undefined =>
  typeof entry.userId === "string" ? entry.userId : entry.userId?._id;

const getUserEmail = (entry: LedgerEntry): string | undefined =>
  typeof entry.userId === "string" ? undefined : entry.userId?.email;

const Ledger = () => {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const {
    data: ledgerData,
    isLoading,
    error,
  } = useQuery<LedgerResponse>({
    queryKey: ["ledger"],
    queryFn: ledgerAPI.getAll,
  });
  const entries = ledgerData?.data || [];

  const { data: userLedgerData, isLoading: userLedgerLoading } = useQuery({
    queryKey: ["user-ledger", selectedUserId],
    queryFn: () => ledgerAPI.viewuserledger(selectedUserId!),
    enabled: !!selectedUserId,
  });

  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) return entries;
    const lowerSearch = searchTerm.toLowerCase();
    return entries.filter(
      (entry: LedgerEntry) =>
        getUserEmail(entry)?.toLowerCase().includes(lowerSearch) ||
        getUserId(entry)?.toLowerCase().includes(lowerSearch) ||
        entry.type?.toLowerCase().includes(lowerSearch) ||
        entry._id?.toLowerCase().includes(lowerSearch) ||
        entry.transaction?.toLowerCase().includes(lowerSearch) ||
        entry.currency?.toLowerCase().includes(lowerSearch),
    );
  }, [entries, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredEntries.length / PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    } else if (totalPages === 0) {
      setPage(1);
    }
  }, [page, totalPages]);

  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedEntries = filteredEntries.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatCrypto = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 8,
    }).format(amount);
  };

  const isDebit = (type: string) => type?.toUpperCase().startsWith("DEBIT");
  const isCredit = (type: string) =>
    type?.toUpperCase().startsWith("DEPOSIT") ||
    type?.toUpperCase().startsWith("CREDIT");

  const getTypeLabel = (type: string) => {
    if (isDebit(type)) return "Debit";
    if (isCredit(type)) return "Credit";
    return "Other";
  };

  const isNgnAmount = (entry: { currency?: string; type?: string }) => {
    if (!entry.currency) return true;
    const currency = entry.currency.toUpperCase();
    if (currency === "NGN") return true;
    if (entry.type?.toLowerCase().includes("to ngn")) return true;
    return false;
  };

  const AmountDisplay = ({
    entry,
    signClass,
    sign = "",
  }: {
    entry: {
      amount: number;
      cryptoAmount?: number;
      currency?: string;
      type?: string;
    };
    signClass: string;
    sign?: string;
  }) => {
    const ngn = isNgnAmount(entry);
    return (
      <>
        <span className={`font-semibold ${signClass}`}>
          {ngn
            ? `${sign}${formatCurrency(entry.amount)}`
            : `${sign}${formatCrypto(entry.amount)} ${entry.currency?.toUpperCase()}`}
        </span>
        {ngn && (
          <CryptoPill
            cryptoAmount={entry.cryptoAmount}
            currency={entry.currency}
          />
        )}
      </>
    );
  };

  const CryptoPill = ({
    cryptoAmount,
    currency,
  }: {
    cryptoAmount?: number;
    currency?: string;
  }) => {
    if (cryptoAmount === undefined || cryptoAmount === null || !currency)
      return null;
    return (
      <Badge
        variant="outline"
        className="mt-1 bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1 w-fit text-[10px] font-normal"
      >
        <Coins className="h-3 w-3" />
        {formatCrypto(cryptoAmount)} {currency.toUpperCase()}
      </Badge>
    );
  };

  const downloadCSV = () => {
    if (!filteredEntries.length) return;

    const headers = [
      "ID",
      "User ID",
      "Email",
      "Transaction ID",
      "Type",
      "Amount",
      "Crypto Amount",
      "Crypto Currency",
      "Balance Before",
      "Balance After",
      "Created At",
    ];

    const rows = filteredEntries.map((entry: LedgerEntry) => [
      entry._id,
      getUserId(entry) || "",
      getUserEmail(entry) || "",
      entry.transaction,
      `"${entry.type}"`,
      entry.amount,
      entry.cryptoAmount ?? "",
      entry.currency ?? "",
      entry.balanceBefore,
      entry.balanceAfter,
      entry.createdAt,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      searchTerm ? "filtered-ledger.csv" : "ledger.csv",
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearSearch = () => setSearchTerm("");

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
            Error loading ledger: {(error as any)?.message || "Unknown error"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col space-y-6 min-h-full flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Ledger</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            View all platform ledger entries and balance movements
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, type, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-8 text-sm"
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
          <Button onClick={downloadCSV} className="flex items-center justify-center gap-2 shrink-0">
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-card border-border/50 shadow-card flex-1 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle>All Ledger Entries</CardTitle>
          <CardDescription>
            {filteredEntries.length === entries.length
              ? `Total of ${entries.length} ledger entries`
              : `Showing ${filteredEntries.length} of ${entries.length} entries`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 p-4 md:p-6 space-y-4 overflow-hidden">
          <div className="flex-1 overflow-auto w-full rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/20">
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance Before</TableHead>
                  <TableHead>Balance After</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEntries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No ledger entries found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEntries.map((entry: LedgerEntry) => (
                    <TableRow
                      key={entry._id}
                      className="hover:bg-muted/20 cursor-pointer transition"
                      onClick={() => {
                        const uid = getUserId(entry);
                        if (!uid) return;
                        setSelectedUserId(uid);
                        setSelectedUserEmail(getUserEmail(entry) || uid);
                        setIsSheetOpen(true);
                      }}
                    >
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">
                            {getUserEmail(entry) || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {getUserId(entry)?.slice(-6) || "—"}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            isDebit(entry.type)
                              ? "bg-red-500/10 text-red-400 border-red-500/20 flex items-center gap-1 w-fit"
                              : isCredit(entry.type)
                                ? "bg-green-500/10 text-green-400 border-green-500/20 flex items-center gap-1 w-fit"
                                : "flex items-center gap-1 w-fit"
                          }
                        >
                          {isDebit(entry.type) ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : isCredit(entry.type) ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : null}
                          {getTypeLabel(entry.type)}
                        </Badge>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        <div
                          className="text-sm text-muted-foreground truncate"
                          title={entry.type}
                        >
                          {entry.type}
                        </div>
                        <div className="text-xs text-muted-foreground/60 mt-0.5">
                          Txn: {entry.transaction?.slice(-8) || "—"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <AmountDisplay
                          entry={entry}
                          signClass={
                            isDebit(entry.type)
                              ? "text-red-400"
                              : isCredit(entry.type)
                                ? "text-green-400"
                                : ""
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <div className="text-sm font-medium">
                          {formatCurrency(entry.balanceBefore)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm font-medium">
                          {formatCurrency(entry.balanceAfter)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(entry.createdAt), {
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

          {filteredEntries.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/50 shrink-0">
              <span className="text-[12px] text-muted-foreground text-center sm:text-left">
                Showing {startIndex + 1} - {Math.min(startIndex + PAGE_SIZE, filteredEntries.length)} of {filteredEntries.length} entries
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

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Ledger for{" "}
              <span className="text-primary">{selectedUserEmail}</span>
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {userLedgerLoading ? (
              <div className="flex justify-center py-10">
                <LoadingSpinner />
              </div>
            ) : userLedgerData?.data?.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                No ledger records found
              </div>
            ) : (
              userLedgerData?.data.map((item) => {
                const debit = item.type.toUpperCase().startsWith("DEBIT");
                const credit = item.type.toUpperCase().startsWith("CREDIT");

                return (
                  <div
                    key={item._id}
                    className="p-4 rounded-xl border bg-muted/20 hover:bg-muted/30 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {debit ? (
                          <ArrowUpRight className="h-4 w-4 text-red-400" />
                        ) : credit ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-400" />
                        ) : null}

                        <span className="text-sm font-medium">
                          {debit ? "Debit" : credit ? "Credit" : "Transaction"}
                        </span>
                      </div>

                      <div className="text-right">
                        <AmountDisplay
                          entry={item}
                          signClass={
                            debit
                              ? "text-red-400"
                              : credit
                                ? "text-green-400"
                                : ""
                          }
                          sign={debit ? "−" : credit ? "+" : ""}
                        />
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground mt-1">
                      {item.type}
                    </div>

                    <div className="flex justify-between text-xs mt-3 text-muted-foreground">
                      <span>Before: {formatCurrency(item.balanceBefore)}</span>
                      <span>After: {formatCurrency(item.balanceAfter)}</span>
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Ledger;
