export interface PrizeTier {
  rankFrom: number;
  rankTo: number;
  label: string;
  prize: number;
}

export interface Competition {
  id: string;
  title: string;
  type: string;
  typeCategory: string;
  typeSubcategory: string;
  typeSubcategories?: string[];
  tagline: string;
  season: string;
  prizePool: number;
  status: "active" | "upcoming" | "ended" | "draft";
  start: string;
  end: string;
  participants: number;
  accentColor: string;
  entryCondition: "auto" | "manual";
  minQualifyingAmt: number;
  visibility: "public" | "hidden";
  notes: string;
  referralBonus?: number;
  prizeTiers: PrizeTier[];
}

export interface CompLeaderboardEntry {
  rank: number;
  userId: string;
  user: string;
  metric: number;
  metricLabel: string;
  trend: "up" | "down";
  flagged?: boolean;
  flagNote?: string;
}
