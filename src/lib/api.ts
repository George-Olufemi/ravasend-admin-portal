import axios from "axios";
import { AnyARecord } from "dns";

// const BASE_URL = "https://reva-backend-zwra.onrender.com";
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

// Types
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
  destionationBankName: string;
  reference: string;
  status: "Pending" | "Processing" | "Completed" | "FAILED" | "COMPLETED" | "Done" | "accepted" | "completed" | "SUCCESSFUL" | "pending" | "Pending" | "SUCCESS" | "done";
  fee: number;
  netAmount: number;
  cards: any[]; // empty array for now, keep flexible`
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
  discount: number;
  transactionAmount: number;
  expiredAt: string;
  usageCount: number;
  maxUsage: number;
}

export interface PromoCodesResponse {
  message: string;
  data: PromoCode[];
}

export interface CreatePromoCodeData {
  discount: string;
  expiredAt: string;
  maxUsage: number;
  transactionAmount: string;
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
  feeName: string;
  amount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeResponse {
  message: string;
  data: Fee[];
}

export interface CreateFeeData {
  amount: string; // keep as string for form input, convert when sending
}

export interface LedgerEntry {
  _id: string;
  userId: {
    _id: string;
    email: string;
  };
  transaction: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  updatedAt: string;
  currency: string;
  cryptoAmount: number;
  __v: number;
}

export interface LedgerResponse {
  success: boolean;
  data: LedgerEntry[];
}

export interface UserLedgerEntry {
  _id: string;
  userId: string;
  transaction: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface UserLedgerResponse {
  success: boolean;
  data: UserLedgerEntry[];
}

export interface AuditRecord {
  _id: string;
  featureName: string;
  email: string;
  ipAddress: string;
  browser: string;
  device: string;
  location: string;
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
};

export const transactionAPI = {
  getAll: async (): Promise<TransactionsResponse> => {
    const response = await api.get("/api/v1/admin/all-user-transactions");
    return response.data;
  },
};

export const promoCodesAPI = {
  getAll: async (): Promise<PromoCodesResponse> => {
    try {
      const response = await apiNoAuth.get("/api/v1/promo/getPromo");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          message:
            error.response?.data?.message || "No active promos found",
          data: [],
        };
      }
      throw error; // let real errors bubble up
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

  create: async (data: CreateFeeData): Promise<any> => {
    const response = await api.post("/api/v1/receive/createFee", {
      amount: Number(data.amount),
    });
    return response.data;
  },

  createForexFee: async (data: CreateFeeData): Promise<any> => {
    const response = await api.post("/api/v1/receive/createForexFee", {
      amount: Number(data.amount),
    });
    return response.data;
  },

  createWithdrawalFee: async (data: CreateFeeData): Promise<any> => {
    const response = await api.post("/api/v1/receive/createWithdrawalFee", {
      amount: Number(data.amount),
    });
    return response.data;
  },

  update: async (id: string, data: Partial<CreateFeeData>): Promise<any> => {
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
    const response = await api.get(`/api/v1/ledger/getLedger/${id}`);
    // console.log("response: ", response);
    return response.data;
  },
}

export const auditsAPI = {
  getAll: async (): Promise<AuditsResponse> => {
    const response = await api.get("/api/v1/user/getAllAudits");
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