export type AdminRole = "Owner" | "Super Admin" | "Competition Manager" | "Finance / Ops" | "Support Agent" | "Read Only";

export interface ApiAdminMember {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "inactive" | "pending";
  lastSeen: string;
  addedDate: string;
  avatar: string;
}

export type PermMatrix = Record<AdminRole, Record<string, boolean>>;
