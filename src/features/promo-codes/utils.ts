import { VALID_SEGMENT_TERMS } from "./constants";

export function resolveSegmentTerm(segmentName: string): string {
  if (!segmentName) return "churnActiveUser";
  const nameLower = segmentName.toLowerCase().replace(/[^a-z0-9]/g, "");

  const directMatch = VALID_SEGMENT_TERMS.find((t) => t.toLowerCase() === nameLower);
  if (directMatch) return directMatch;

  if (nameLower.includes("newuser") || (nameLower.includes("new") && nameLower.includes("first"))) {
    return "newUserNoFirstDeposit";
  }
  if (nameLower.includes("lapse") || nameLower.includes("lapsed")) {
    return "lapseUserNoDeposit";
  }
  if (nameLower.includes("nevertransact") || (nameLower.includes("deposit") && nameLower.includes("never"))) {
    return "depositedNeverTransact";
  }
  if (nameLower.includes("churn") || nameLower.includes("active")) {
    return "churnActiveUser";
  }
  if (nameLower.includes("noreferral") || nameLower.includes("referral")) {
    return "transactorsNoReferral";
  }
  if (nameLower.includes("vip") || nameLower.includes("highvalue")) {
    return "highValueVIPUsers";
  }

  return "churnActiveUser";
}

export function genPromoCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function daysUntil(dateStr: string) {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function fmtN(num: number) {
  return new Intl.NumberFormat().format(num || 0);
}
