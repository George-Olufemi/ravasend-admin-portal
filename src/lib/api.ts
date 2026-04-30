import axios from "axios";

// const BASE_URL = "https://reva-backend-zwra.onrender.com";
const BASE_URL = "https://backend-ymhe.onrender.com";

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
  status: "Pending" | "Processing" | "Completed" | "FAILED" | "COMPLETED";
  fee: number;
  netAmount: number;
  cards: any[]; // empty array for now, keep flexible
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

// API functions
export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post("/api/v1/user/login", { email, password });
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
    const response = await apiNoAuth.get("/api/v1/promo/getPromo");
    return response.data;
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
    const response = await api.get("/api/v1/receive/getFee");
    return response.data;
  },

  create: async (data: CreateFeeData): Promise<any> => {
    const response = await api.post("/api/v1/receive/createFee", {
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
