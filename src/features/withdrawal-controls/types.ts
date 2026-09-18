export interface AccessControlStatus {
  _id: string;
  userId?: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    role?: string;
  };
  isPermitted: boolean; // true = withdrawals active, false = paused
  createdAt: string;
  updatedAt: string;
}

export interface AccessControlStatusResponse {
  message: string;
  data: AccessControlStatus;
}

export interface AuditLogEntry {
  _id: string;
  userId?: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    role?: string;
  };
  featureName: string;
  email?: string;
  ipAddress?: string;
  browser?: string;
  device?: string;
  location?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLogResponse {
  success: boolean;
  message: string;
  data: AuditLogEntry[];
}
