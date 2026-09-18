import { AdminRole } from "./types";

export function normalizeRole(roleStr: string): AdminRole {
  const r = roleStr?.toLowerCase() || "";
  if (r.includes("owner")) return "Owner";
  if (r.includes("super") || r === "admin") return "Super Admin";
  if (r.includes("competition")) return "Competition Manager";
  if (r.includes("finance") || r.includes("ops")) return "Finance / Ops";
  if (r.includes("support")) return "Support Agent";
  return "Read Only";
}
