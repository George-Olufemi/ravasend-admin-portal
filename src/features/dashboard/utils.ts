import { downloadCSV } from "@/lib/formatters";

export function exportDashboardReport(
  totalUsers: number,
  activeUsers: number,
  totalVol: number,
  segmentCount: number,
  campaignCount: number,
  withdrawalPaused: boolean
) {
  const headers = ["Metric", "Value"];
  const rows = [
    ["Total Users", totalUsers],
    ["Active Users", activeUsers],
    ["Total Transaction Volume (NGN)", totalVol],
    ["Total Segments", segmentCount],
    ["Total Campaigns", campaignCount],
    ["Withdrawal Kill Switch", withdrawalPaused ? "ACTIVE" : "INACTIVE"],
    ["Export Date", new Date().toLocaleString()],
  ];
  downloadCSV(headers, rows, `dashboard-report-${new Date().toISOString().slice(0, 10)}.csv`);
}
