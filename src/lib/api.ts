import axios from "axios";

// Re-export all types from types.ts for backward compatibility
export type {
  User,
  LoginResponse,
  UsersResponse,
  TransactionUser,
  Transaction,
  TransactionsResponse,
  PromoCode,
  PromoCodesResponse,
  CreatePromoCodeData,
  MetricsResponse,
  ReferralUser,
  ReferralBonus,
  ReferralBonusesResponse,
  ReferralDetailUser,
  ReferralDetailBonus,
  ReferralDetailRecord,
  ReferralDetailsResponse,
  Fee,
  FeeResponse,
  CreateFeeData,
  LedgerEntry,
  LedgerResponse,
  ActiveUsersResponse,
  TotalTransactionVolumeResponse,
  VolumeGraphTransactionItem,
  TransactionVolumeGraphResponse,
  LedgerReconciliation,
  LedgerReconciliationResponse,
  TotalAmountResponse,
  UserLedgerEntry,
  UserLedgerTotals,
  UserLedgerResponse,
  AuditUser,
  AuditRecord,
  AuditsResponse,
  WithdrawalStatusResponse,
  CampaignItem,
  CreateCampaignPayload,
  CampaignsResponse,
  SingleCampaignResponse,
  CampaignCountResponse,
  SegmentItem,
  SegmentsResponse,
  SingleSegmentResponse,
  SegmentUsersResponse,
  CreateSegmentPayload,
  AnalyticsGraphItem,
  AnalyticsSummary,
  AnalyticsGraph,
  AnalyticsResponse,
  ApiFee,
} from "./types";

import type {
  LoginResponse,
  UsersResponse,
  TransactionsResponse,
  PromoCodesResponse,
  MetricsResponse,
  ReferralBonusesResponse,
  ReferralDetailsResponse,
  FeeResponse,
  LedgerResponse,
  UserLedgerResponse,
  LedgerReconciliationResponse,
  TotalAmountResponse,
  ActiveUsersResponse,
  TotalTransactionVolumeResponse,
  TransactionVolumeGraphResponse,
  AuditsResponse,
  CreatePromoCodeData,
  SegmentUsersResponse,
  CampaignsResponse,
  SingleCampaignResponse,
  CampaignCountResponse,
  SegmentsResponse,
  SingleSegmentResponse,
  CreateSegmentPayload,
  AnalyticsResponse,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Create axios instance without auth for promo codes getAll
const apiNoAuth = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("reva_admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API functions
export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post("/api/v1/admin/admin-login", { email, password });
    return response.data;
  },
};

export const metricsAPI = {
  getAll: async (): Promise<MetricsResponse> => {
    const response = await api.get("/api/v1/admin/metrics");
    return response.data;
  },
};

export const referralAPI = {
  getAll: async (): Promise<ReferralBonusesResponse> => {
    const response = await api.get("/api/v1/admin/all-referral-bonus");
    return response.data;
  },

  getAllReferralDetails: async (): Promise<ReferralDetailsResponse> => {
    const response = await api.get("/api/v1/admin/all-referral-details");
    return response.data;
  },

  getAllReferralDownline: async (params: {
    email?: string;
    referralCode?: string;
    username?: string;
  }) => {
    const response = await api.get("/api/v1/referral/referralDownline", {
      params,
    });

    return response.data;
  },
};

export const usersAPI = {
  getAll: async (): Promise<UsersResponse> => {
    const response = await api.get("/api/v1/user/getAllusers");
    return response.data;
  },
  freezeUserAccount: async (userId: string): Promise<any> => {
    const response = await api.post(`/api/v1/access-control/user-access-control?userId=${userId}`);
    return response.data;
  },
};

export const transactionAPI = {
  getAll: async (): Promise<TransactionsResponse> => {
    const response = await api.get("/api/v1/admin/all-user-transactions");
    return response.data;
  },
  getTransactionVolume: async (): Promise<TotalAmountResponse> => {
    const response = await api.get("/api/v1/admin/getTotalTransactionAmount");
    return response.data;
  },
  getFailedTransaction: async (): Promise<TotalAmountResponse> => {
    const response = await api.get("/api/v1/admin/getTotalFailedTransactionAmount");
    return response.data;
  },
};

export const dashboardAPI = {
  getTotalActiveUsers: async (): Promise<ActiveUsersResponse> => {
    const response = await api.get("/api/v1/admin/getTotalActiveUsers");
    return response.data;
  },
  getTotalTransactionVolume: async (): Promise<TotalTransactionVolumeResponse> => {
    const response = await api.get("/api/v1/admin/getTotalTransactionVolume");
    return response.data;
  },
  getTransactionVolumeGraph: async (
    period: "last30days" | "last90days" = "last30days"
  ): Promise<TransactionVolumeGraphResponse> => {
    const response = await api.get(`/api/v1/admin/getTransactionVolumeGraph?period=${period}`);
    return response.data;
  },
};

export const promoCodesAPI = {
  getAll: async (): Promise<PromoCodesResponse> => {
    try {
      const response = await api.get("/api/v1/promo/getPromo");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          message:
            error.response?.data?.message || "No active promos found",
          data: [],
        };
      }
      throw error;
    }
  },

  getNumberOfActivePromo: async () => {
    try {
      const response = await api.get("/api/v1/promo/getTotalActivePromo");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          message:
            error.response?.data?.message || "No active promos found",
          data: [],
        };
      }
      throw error;
    }
  },


  getNumberOfPromoRedeemed: async () => {
    try {
      const response = await api.get("/api/v1/promo/getTotalPromoRedeemed");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          message:
            error.response?.data?.message || "No active promos found",
          data: [],
        };
      }
      throw error;
    }
  },

  getTotalValueGiven: async () => {
    try {
      const response = await api.get("/api/v1/promo/getTotalValueGiven");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          message:
            error.response?.data?.message || "No active promos found",
          data: [],
        };
      }
      throw error;
    }
  },

  create: async (data: CreatePromoCodeData): Promise<any> => {
    const response = await api.post("/api/v1/promo/createPromo", data);
    // console.log("response: ", response);
    return response.data;
  },

  delete: async (id: string): Promise<any> => {
    const response = await api.delete(
      `/api/v1/promo/deletePromo?promoCode=${id}`
    );
    // console.log("response: ", response);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreatePromoCodeData>
  ): Promise<any> => {
    const response = await api.put(`/api/v1/promo/updatePromo/${id}`, data);
    return response.data;
  },

  getTargetSegmentUsers: async (segmentTerm: string): Promise<SegmentUsersResponse> => {
    try {
      const response = await api.get(`/api/v1/promo/getTargetSegmentUsers?segmentTerm=${segmentTerm}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          success: false,
          message: error.response?.data?.message || "No target segment users found",
          total: 0,
          data: [],
        };
      }
      throw error;
    }
  },
};

export const feesAPI = {
  getAll: async (): Promise<FeeResponse> => {
    try {
      const response = await api.get("/api/v1/receive/getFee");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          message: error.response?.data?.message || "No fees found",
          data: [],
        };
      }
      throw error;
    }
  },

  getAllForexFee: async (): Promise<FeeResponse> => {
    try {
      const response = await api.get("/api/v1/receive/getForexFee");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          message: error.response?.data?.message || "No forex fees found",
          data: [],
        };
      }
      throw error;
    }
  },

  getAllWithdrawalFees: async (): Promise<FeeResponse> => {
    try {
      const response = await api.get("/api/v1/receive/getWithdrawalFee");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          message: error.response?.data?.message || "No withdrawal fees found",
          data: [],
        };
      }
      throw error;
    }
  },

  getAllBillFees: async (): Promise<FeeResponse> => {
    try {
      const response = await api.get("/api/v1/receive/getBillFee");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          message: error.response?.data?.message || "No bill fees found",
          data: [],
        };
      }
      throw error;
    }
  },

  create: async (data: any): Promise<any> => {
    const response = await api.post("/api/v1/receive/createFee", data);
    return response.data;
  },

  createForexFee: async (data: any): Promise<any> => {
    const response = await api.post("/api/v1/receive/createForexFee", data);
    return response.data;
  },

  createWithdrawalFee: async (data: any): Promise<any> => {
    const response = await api.post("/api/v1/receive/createWithdrawalFee", data);
    return response.data;
  },

  createBillFee: async (data: any): Promise<any> => {
    const response = await api.post("/api/v1/receive/createBillFee", data);
    return response.data;
  },

  update: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/api/v1/receive/updateFee/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<any> => {
    const response = await api.delete(`/api/v1/receive/deleteFee/${id}`);
    return response.data;
  },
};

export const ledgerAPI = {
  getAll: async (): Promise<LedgerResponse> => {
    const response = await api.get("/api/v1/ledger/getAdminGetAllLedger");
    return response.data;
  },
  viewuserledger: async (id: string): Promise<UserLedgerResponse> => {
    const response = await api.get(`/api/v1/ledger/getUserAggregateLedger/${id}`);
    // console.log("response: ", response);
    return response.data;
  },
  getReconciliation: async (): Promise<LedgerReconciliationResponse> => {
    const response = await api.get("/api/v1/admin/getLedgerReconciliation");
    return response.data;
  },
  getAllCredits: async (): Promise<TotalAmountResponse> => {
    const response = await api.get("/api/v1/admin/getTotalLedgerCredit");
    return response.data;
  },
  getAllDebits: async (): Promise<TotalAmountResponse> => {
    const response = await api.get("/api/v1/admin/getTotalLedgerDebit");
    return response.data;
  },
  getLedgerNet: async (): Promise<TotalAmountResponse> => {
    const response = await api.get("/api/v1/admin/getTotalLedgerNet");
    return response.data;
  },
  getAllUserWallet: async (): Promise<TotalAmountResponse> => {
    const response = await api.get("/api/v1/admin/getTotalUserBalance");
    return response.data;
  },
}

export const auditsAPI = {
  getAll: async (): Promise<AuditsResponse> => {
    const response = await api.get("/api/v1/auditlogs/audit-logs");
    return response.data;
  }
}

export const eventsAPI = {
  getAll: async (): Promise<FeeResponse> => {
    const response = await api.get("/api/v1/user/getAllEvents");
    return response.data;
  },
  getanevent: async (id: string): Promise<any> => {
    const response = await api.get(`/api/v1/event/events/${id}`);
    // console.log("response: ", response);
    return response.data;
  }
}

export const systemSettingsAPI = {
  getWithdrawalPauseStatus: async () => {
    const response = await api.get("/api/v1/access-control/access-control-status");
    return response.data;
  },

  toggleWithdrawalPause: async () => {
    const response = await api.post("/api/v1/access-control/system-access-control");
    return response.data;
  },

  getWithdrawalPauseAuditLog: async () => {
    const response = await api.get("/api/v1/user/getAllAudits");
    return response.data;
  },
};

export const adminAndRolesAPI = {
  getAll: async () => {
    try {
      const response = await api.get("/api/v1/admin/all-admin-members");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          message:
            error.response?.data?.message || "No active promos found",
          data: [],
        };
      }
      throw error;
    }
  },

  invite: async (data: { email: string; fullName: string; password: string; role: string }) => {
    const response = await api.post("/api/v1/admin/invite-admin-member", data);
    return response.data;
  },

  delete: async (id: string): Promise<any> => {
    const response = await api.delete(
      `/api/v1/admin/remove-admin-member${id}`
    );
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.post(`/api/v1/admin/update-admin-member`, data);
    return response.data;
  },
};


export const campaignAPI = {
  getAllCampaigns: async (): Promise<CampaignsResponse> => {
    const response = await api.get("/api/v1/campaign/getCampaigns");
    return response.data;
  },
  getTotalCampaigns: async (): Promise<CampaignCountResponse> => {
    const response = await api.get("/api/v1/campaign/getTotalCampaigns");
    return response.data;
  },
  getTotalActiveCampaigns: async (): Promise<CampaignCountResponse> => {
    const response = await api.get("/api/v1/campaign/getTotalActiveCampaigns");
    return response.data;
  },
  getTotalCampaignSent: async (): Promise<CampaignCountResponse> => {
    const response = await api.get("/api/v1/campaign/getTotalCampaignSent");
    return response.data;
  },
  createCampaign: async (id: string, data: any): Promise<SingleCampaignResponse> => {
    const cleanId = id ? (id.startsWith("/") ? id : `/${id}`) : "";
    const response = await api.post(`/api/v1/campaign/createCampaign${cleanId}`, data);
    return response.data;
  },
  getCampaignById: async (id: string): Promise<SingleCampaignResponse> => {
    const response = await api.get(`/api/v1/campaign/getCampaignById/${id}`);
    return response.data;
  },
  updateCampaign: async (id: string, data: any): Promise<SingleCampaignResponse> => {
    const response = await api.put(`/api/v1/campaign/updateCampaign/${id}`, data);
    return response.data;
  },
  deleteCampaign: async (id: string): Promise<any> => {
    const response = await api.delete(`/api/v1/campaign/deleteCampaign/${id}`);
    return response.data;
  },
  getDeletedCampaigns: async () => {
    const response = await api.get("/api/v1/campaign/getDeletedCampaigns");
    return response.data;
  },
  restoreCampaign: async (id: string): Promise<any> => {
    try {
      const response = await api.put(`/api/v1/campaign/restoreCampaign/${id}`);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        const response = await api.post(`/api/v1/campaign/restoreCampaign/${id}`);
        return response.data;
      }
      throw err;
    }
  },
  sendBulkEmail: async (data: { subject: string; message: string; recipients: string[] }): Promise<any> => {
    const response = await api.post("/api/v1/admin/send-bulk-email", data);
    return response.data;
  },
  sendBulkPushNotification: async (data: { subject: string; message: string; recipients: string[] }): Promise<any> => {
    const response = await api.post("/api/v1/admin/send-bulk-in-app", data);
    return response.data;
  },
  getNewUsersNoFirstDeposit: async () => {
    const response = await api.get("/api/v1/campaign/getNewUsersNoFirstDeposit");
    return response.data;
  },
  getUserDepositedNeverTransacted: async () => {
    const response = await api.get("/api/v1/campaign/getUserDepositedNeverTransacted");
    return response.data;
  },
  getUserTransactWithZeroReferrals: async () => {
    const response = await api.get("api/v1/campaign/getUserTransactWithZeroReferrals");
    return response.data;
  },
  getLapsedUsersNoDepositGreaterThan7days: async () => {
    const response = await api.get("/api/v1/campaign/getLapsedUsersNoDepositGreaterThan7days");
    return response.data;
  },
  getChurnedActiveUsersWalletGreaterThan0InactiveGreaterThan14days: async () => {
    const response = await api.get("/api/v1/campaign/getChurnedActiveUsersWalletGreaterThan0InactiveGreaterThan14days");
    return response.data;
  },
}


export const segmentAPI = {
  getAllSegments: async (): Promise<SegmentsResponse> => {
    const response = await api.get("/api/v1/segment/get-all-segments");
    return response.data;
  },
  getSegmentById: async (id: string): Promise<SingleSegmentResponse> => {
    const response = await api.get(`/api/v1/segment/get-segment/${id}`);
    return response.data;
  },
  getSegmentUsers: async (
    segmentTerm?: string,
    segmentValue?: string | number | boolean,
    equalSign?: string
  ): Promise<SegmentUsersResponse> => {
    const params = new URLSearchParams();
    if (segmentTerm) params.append("segmentTerm", segmentTerm);
    if (segmentValue !== undefined && segmentValue !== null && segmentValue !== "") {
      params.append("segmentValue", String(segmentValue));
    }
    if (equalSign) params.append("equalSign", equalSign);
    const queryString = params.toString();
    const response = await api.get(`/api/v1/segment/get-segment-users${queryString ? `?${queryString}` : ""}`);
    return response.data;
  },
  createSegment: async (data: CreateSegmentPayload): Promise<SingleSegmentResponse> => {
    const response = await api.post("/api/v1/segment/create-segment", data);
    return response.data;
  },
  updateSegment: async (id: string, data: CreateSegmentPayload): Promise<SingleSegmentResponse> => {
    const response = await api.put(`/api/v1/segment/update-segment/${id}`, data);
    return response.data;
  },
  deleteSegment: async (id: string): Promise<any> => {
    const response = await api.delete(`/api/v1/segment/delete-segment/${id}`);
    return response.data;
  },
  getTargetSegmentUsers: async (segmentTerm: string): Promise<SegmentUsersResponse> => {
    try {
      const response = await api.get(`/api/v1/promo/getTargetSegmentUsers?segmentTerm=${segmentTerm}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          success: false,
          message: error.response?.data?.message || "No target segment users found",
          total: 0,
          data: [],
        };
      }
      throw error;
    }
  },
};

export const auditAPI = {
  getAllAudit: async () => {
    const response = await api.get("/api/v1/auditlogs/audit-logs");
    return response.data;
  },
  getAuditByQuery: async (query: string) => {
    const response = await api.get("/api/v1/auditlogs/audit-logs?search=" + query);
    return response.data;
  }
};


export const analyticsAPI = {
  getAnalytics: async (startDate: string, endDate: string): Promise<AnalyticsResponse> => {
    const response = await api.get(`/api/v1/analytics/get-analytics?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },
};