export interface User {
  _id: string;
  fullName: string;
  email: string;
  isVerified: boolean;
  isBlocked: boolean;
  nairaWallet: number;
  dollarWallet: number;
  kycLevel: number;
  hasKyc: boolean;
  hasQuidaxId: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
  quidaxId?: string;
  image?: string;
  username: string;
  phoneNumber: string;
  referralCode: string;
  referredBy: string;
  lastLogin: string;
  isFirstDeposit: boolean;
  isFirstConversion: boolean;
  ngn?: number;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface UsersResponse {
  users: User[];
}

export interface TransactionUser {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface Transaction {
  _id: string;
  userId: TransactionUser;
  source: string;
  amount: number;
  currency: string;
  destination: string;
  sessionId: string;
  destinationAccountNumber: string;
  destinationAccountName: string;
  destinationBankName?: string;
  destionationBankName?: string;
  reference: string;
  status: "Pending" | "Processing" | "Completed" | "FAILED" | "COMPLETED" | "Done" | "accepted" | "completed" | "SUCCESSFUL" | "pending" | "Pending" | "SUCCESS" | "done";
  fee: number;
  netAmount: number;
  cards: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface TransactionsResponse {
  message: string;
  data: Transaction[];
}

export interface PromoCode {
  _id: string;
  promoCode: string;
  promoType?: "standard" | "premium" | string;
  description?: string;
  rewardAmount?: number;
  discount: number;
  transactionAmount: number;
  expiredAt: string;
  usageCount: number;
  maxUsage: number | null;
  targetSegments?: string[];
  status?: "active" | "inactive" | string;
  isDeleted?: boolean;
}

export interface PromoCodesResponse {
  success?: boolean;
  message: string;
  data: PromoCode[];
}

export interface CreatePromoCodeData {
  promoCode?: string;
  promoType?: string;
  rewardAmount?: number;
  description?: string;
  transactionAmount?: string | number;
  maxUsage?: number;
  days?: number;
  discount?: string | number;
  expiredAt?: string;
  targetSegments?: string[];
}

export interface MetricsResponse {
  message: string;
  data: {
    users: {
      total: number;
      thisMonth: number;
      lastMonth: number;
      growthRate: string;
    };
    transactions: {
      total: number;
      thisMonth: number;
      lastMonth: number;
      growthRate: string;
    };
    promos: {
      total: number;
      expiredSoon: number;
    };
    growthRate: {
      total: number;
      growthRate: string;
    };
    recent: {
      transactions: any[];
      promos: any[];
      users: User[];
    };
  };
}

export interface ReferralUser {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dollarWallet: number;
  createdAt: string;
}

export interface ReferralBonus {
  _id: string;
  userId: ReferralUser;
  amount: number;
  referredCount?: number;
}

export interface ReferralBonusesResponse {
  message: string;
  totalAmount: number;
  count: number;
  data: ReferralBonus[];
}

export interface ReferralDetailUser {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface ReferralDetailBonus {
  billPaymentBonus: boolean;
  bonus30Paid: boolean;
  bonus100Paid: boolean;
  bonus500Paid: boolean;
  bonus1000Paid: boolean;
}

export interface ReferralDetailRecord {
  id: string;
  user: ReferralDetailUser;
  referredBy: ReferralDetailUser | null;
  amount: number;
  status: string;
  type: string;
  title: string | null;
  description: string | null;
  locked: number;
  withdrawn: boolean;
  bonus: ReferralDetailBonus;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralDetailsResponse {
  success: boolean;
  message: string;
  count: number;
  data: ReferralDetailRecord[];
}

export interface Fee {
  _id: string;
  ruleName?: string;
  category?: string;
  applicationType?: string;
  currency?: string;
  feeType?: string;
  amount: number;
  percentage?: string;
  maximumAmount?: string;
  assets?: string[];
  corridors?: string[];
  banks?: string[];
  services?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface FeeResponse {
  message?: string;
  success?: boolean;
  data: Fee[];
}

export interface CreateFeeData {
  amount?: string | number;
  ruleName?: string;
  category?: string;
  applicationType?: string;
  currency?: string;
  feeType?: string;
  percentage?: string;
  maximumAmount?: string;
  assets?: string[] | string;
  corridors?: string[] | string;
  banks?: string[] | string;
  services?: string[] | string;
}

export interface LedgerEntry {
  _id: string;
  userId: {
    _id: string;
    email: string;
  } | string;
  transaction: string;
  type: string;
  description?: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  updatedAt: string;
  currency?: string;
  cryptoAmount?: number;
  __v?: number;
}

export interface LedgerResponse {
  success: boolean;
  message?: string;
  data: LedgerEntry[];
}

export interface ActiveUsersResponse {
  success: boolean;
  message?: string;
  data: {
    totalActiveUsers: number;
    previousMonthActiveUsers: number;
    percentageChange: string;
  };
}

export interface TotalTransactionVolumeResponse {
  success: boolean;
  message?: string;
  data: {
    totalAmount: number;
    previousMonthAmount: number;
    percentageChange: string;
  };
}

export interface VolumeGraphTransactionItem {
  date: string;
  amount: number;
}

export interface TransactionVolumeGraphResponse {
  success: boolean;
  message?: string;
  data: {
    period: string;
    days: number;
    transactions: VolumeGraphTransactionItem[];
  };
}

export interface LedgerReconciliation {
  totalCredits: number;
  totalDebits: number;
  ledgerNet: number;
  actualNet: number;
  reconciliationGap: number;
}

export interface LedgerReconciliationResponse {
  success: boolean;
  message?: string;
  data: LedgerReconciliation;
}

export interface TotalAmountResponse {
  success?: boolean;
  message?: string;
  data?: {
    totalAmount?: number | string;
  };
}

export interface UserLedgerEntry {
  _id: string;
  userId: {
    _id: string;
    email: string;
  } | string;
  transaction: string;
  type: string;
  description?: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  updatedAt: string;
  currency?: string;
  cryptoAmount?: number;
  __v?: number;
}

export interface UserLedgerTotals {
  deposit?: number;
  credit?: number;
  debit?: number;
  totalCryptoDeposit?: number;
}

export interface UserLedgerResponse {
  success: boolean;
  message?: string;
  data: UserLedgerEntry[];
  userBalance?: number;
  totals?: UserLedgerTotals;
}

export interface AuditUser {
  _id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
}

export interface AuditRecord {
  _id: string;
  userId?: AuditUser | string;
  featureName: string;
  action?: string;
  email: string;
  status?: string;
  description?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  ipAddress: string;
  browser: string;
  device: string;
  operatingSystem?: string;
  location: string;
  resourceType?: string;
  resourceId?: string;
  warning?: string;
  userAgent?: string;
  metadata?: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface AuditsResponse {
  success: boolean;
  message: string;
  data: AuditRecord[];
}

export interface WithdrawalStatusResponse {
  success: boolean;
  isWithdrawalPaused: boolean;
  message?: string;
}

export interface CampaignItem {
  _id: string;
  campaignName: string;
  subject: string;
  message: string;
  recipients: string[];
  campaignType: string;
  image?: string;
  depositType?: string;
  conversionReward?: string;
  deliveryStrategy?: string;
  deliveryTime?: string;
  deliveryDate?: string;
  deliveryTimezone?: string;
  deliveryFrequency?: string;
  deliveryFrequencyValue?: number;
  deliveryFrequencyUnit?: string;
  deliveryFrequencyTimezone?: string;
  status: string;
  totalRecipients?: number;
  totalSent?: number;
  totalDelivered?: number;
  totalFailed?: number;
  totalOpened?: number;
  totalClicked?: number;
  nextDeliveryAt?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface CreateCampaignPayload {
  campaignName: string;
  subject: string;
  message: string;
  campaignType: string[];
  images?: string;
  depositType?: string;
  conversionReward?: string;
  deliveryStrategy?: string;
  deliveryTime?: string;
  deliveryDate?: string;
  deliveryTimezone?: string;
  deliveryFrequency?: string;
  deliveryFrequencyValue?: string;
  status?: string;
  deliveryFrequencyUnit?: string;
  deliveryFrequencyTimezone?: string;
  nextDeliveryAt?: string;
  conversionGoal?: string;
  conditions?: string;
  rewardType?: string;
  minimumAmount?: string;
  tier?: string;
  minAmountPerTransaction?: string;
  numberOfBillPayments?: string;
  numberOfFriends?: string;
  numberOfSend?: string;
  promoCode?: string;
  cashReward?: string;
  segmentId?: string;
  segment?: string;
  recipients?: string[];
}

export interface CampaignsResponse {
  success: boolean;
  message: string;
  data: CampaignItem[];
}

export interface SingleCampaignResponse {
  success: boolean;
  message: string;
  data: CampaignItem;
}

export interface CampaignCountResponse {
  success: boolean;
  message: string;
  data: number;
}

export interface SegmentItem {
  _id: string;
  segmentName: string;
  description: string;
  emails: string[];
  totalUserTargeted: number;
  status: string;
  isLinkedToCampaign: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface SegmentsResponse {
  success: boolean;
  message: string;
  count: number;
  data: SegmentItem[];
}

export interface SingleSegmentResponse {
  success: boolean;
  message: string;
  data: SegmentItem;
}

export interface SegmentUsersResponse {
  success: boolean;
  message: string;
  total: number;
  data: Array<{
    _id: string;
    email: string;
    kycLevel?: number;
    [key: string]: any;
  }>;
}

export interface CreateSegmentPayload {
  segmentName: string;
  description: string;
  emails: string[];
}

export interface AnalyticsGraphItem {
  date: string;
  total: number;
}

export interface AnalyticsSummary {
  totalTransactionSum: number;
  totalUsers: number;
  totalTransaction: number;
  totalFeesSum: number;
}

export interface AnalyticsGraph {
  transactionVolume: AnalyticsGraphItem[];
  transactionCount: AnalyticsGraphItem[];
  newUsers: AnalyticsGraphItem[];
  fees: AnalyticsGraphItem[];
}

export interface AnalyticsResponse {
  status: boolean;
  data: {
    summary: AnalyticsSummary;
    graph: AnalyticsGraph;
  };
}

// Alias for Fee used in Fee.tsx
export type ApiFee = Fee;

export interface CompetitionItem {
  _id: string;
  title: string;
  competitionType: string;
  assets: string[];
  tagline: string;
  seasonLabel: string;
  status: "LIVE" | "UPCOMING" | "DRAFT" | "ENDED" | string;
  minQualifyAmount: number;
  entryCondition: string;
  prizePool: number;
  startDate: string;
  endDate: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface CompetitionTimelineStatus {
  activeCompetition: number;
  totalPrizePool: number;
  totalParticipant: number;
  pendingDisbursments: number;
}

export interface CompetitionTimelineStatusResponse {
  status: string;
  message: string;
  data: CompetitionTimelineStatus;
}

export interface CompetitionsResponse {
  status: string;
  message: string;
  total?: number;
  data: CompetitionItem[];
}

export interface SingleCompetitionResponse {
  status: string;
  message: string;
  data: CompetitionItem;
}

export interface CreateCompetitionPayload {
  title: string;
  competitionType: string;
  assets: string[];
  tagline: string;
  seasonLabel: string;
  status: string;
  minQualifyAmount: number;
  entryCondition: string;
  prizePool: number;
  startDate: string;
  endDate: string;
}

export interface CompetitionParticipantItem {
  _id?: string;
  userId?: string | { _id: string; email?: string; fullName?: string; username?: string };
  user?: string;
  email?: string;
  rank?: number;
  metric?: number;
  metricLabel?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface CompetitionParticipantsResponse {
  status: string;
  message: string;
  total?: number;
  data: CompetitionParticipantItem[];
}

