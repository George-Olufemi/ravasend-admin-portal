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
import { auditsAPI, AuditRecord } from "@/lib/api";
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
import { Download, Search, X, Globe, Mail, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

const Audits = () => {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: auditsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["audits"],
    queryFn: auditsAPI.getAll,
  });

  const audits = auditsData?.data || [];

  // Filter audits based on search term
  const filteredAudits = useMemo(() => {
    if (!searchTerm.trim()) return audits;
    const lowerSearch = searchTerm.toLowerCase();
    return audits.filter(
      (audit: AuditRecord) =>
        audit.featureName.toLowerCase().includes(lowerSearch) ||
        audit.email.toLowerCase().includes(lowerSearch) ||
        audit.ipAddress.toLowerCase().includes(lowerSearch) ||
        audit.browser.toLowerCase().includes(lowerSearch) ||
        audit.device.toLowerCase().includes(lowerSearch) ||
        audit.location.toLowerCase().includes(lowerSearch) ||
        audit._id.toLowerCase().includes(lowerSearch),
    );
  }, [audits, searchTerm]);

  // Reset to first page when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Adjust page if it exceeds total pages after filtering
  const totalPages = Math.ceil(filteredAudits.length / PAGE_SIZE);
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    } else if (totalPages === 0) {
      setPage(1);
    }
  }, [page, totalPages]);

  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedAudits = filteredAudits.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  const downloadCSV = () => {
    if (!filteredAudits.length) return;

    const headers = [
      "ID",
      "Feature Name",
      "Email",
      "IP Address",
      "Browser",
      "Device",
      "Location",
      "Created At",
    ];

    const rows = filteredAudits.map((audit: AuditRecord) => [
      audit._id,
      audit.featureName,
      audit.email,
      audit.ipAddress,
      audit.browser,
      audit.device,
      audit.location,
      audit.createdAt,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      searchTerm ? "filtered-audits.csv" : "audits.csv",
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
            Error loading audits: {(error as any)?.message || "Unknown error"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col space-y-6 min-h-full flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track and monitor all user activities and system events
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by feature, email, IP..."
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
          <Button
            onClick={downloadCSV}
            disabled={filteredAudits.length === 0}
            className="flex items-center justify-center gap-2 shrink-0"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-card border-border/50 shadow-card flex-1 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            {filteredAudits.length === audits.length
              ? `Total of ${audits.length} audit records`
              : `Showing ${filteredAudits.length} of ${audits.length} records`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 p-4 md:p-6 space-y-4 overflow-hidden">
          <div className="flex-1 overflow-auto w-full rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Event</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Device Info</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAudits.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No audit records found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAudits.map((audit: AuditRecord) => (
                    <TableRow key={audit._id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-2">
                            {audit.featureName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{audit.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{audit.ipAddress}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {audit.browser} • {audit.device}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{audit.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span
                            title={new Date(audit.createdAt).toLocaleString()}
                          >
                            {formatDistanceToNow(new Date(audit.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredAudits.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/50 shrink-0">
              <span className="text-[12px] text-muted-foreground text-center sm:text-left">
                Showing {startIndex + 1} - {Math.min(startIndex + PAGE_SIZE, filteredAudits.length)} of {filteredAudits.length} records
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

export default Audits;
