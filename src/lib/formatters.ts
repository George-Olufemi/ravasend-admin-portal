/**
 * Shared formatting utilities used across admin pages
 */

export function fmtN(num: number): string {
  return new Intl.NumberFormat().format(num || 0);
}

export function ngn(num: number): string {
  return "₦" + fmtN(num);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatNaira(v: number): string {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(1)}K`;
  return `₦${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateLabel(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return dateStr;
}

export function getInitials(nameOrEmail: string): string {
  if (!nameOrEmail) return "AD";
  if (nameOrEmail.includes(" ")) {
    const parts = nameOrEmail.split(" ");
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  }
  return nameOrEmail.slice(0, 2).toUpperCase();
}

export function downloadCSV(headers: string[], rows: (string | number)[][], filename: string): void {
  if (!rows.length) return;
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers, ...rows].map((e) => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
