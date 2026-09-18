import { User } from "@/lib/api";

export const filterUsers = (users: User[], search: string): User[] => {
  if (!search.trim()) return users;
  const lower = search.toLowerCase();
  return users.filter(
    (u) =>
      (u.fullName || "").toLowerCase().includes(lower) ||
      (u.email || "").toLowerCase().includes(lower) ||
      (u.phoneNumber || "").includes(search) ||
      (u._id || "").includes(search)
  );
};

export const downloadUsersCSV = (filtered: User[], search: string) => {
  if (!filtered.length) return;
  const headers = [
    "ID",
    "Full Name",
    "Email",
    "Phone",
    "Naira Wallet",
    "Dollar Wallet",
    "KYC Level",
    "Verified",
    "Blocked",
    "Has Quidax",
    "Created At",
  ];

  const rows = filtered.map((u) => [
    u._id,
    u.fullName,
    u.email,
    u.phoneNumber || "",
    u.nairaWallet || 0,
    u.dollarWallet || 0,
    u.kycLevel || 0,
    u.isVerified || false,
    u.isBlocked || false,
    u.hasQuidaxId || false,
    u.createdAt || "",
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers, ...rows].map((e) => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", search ? "filtered-users.csv" : "users.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const checkIsFrozen = (user: User | undefined, frozenIds: Set<string>) => {
  if (!user) return false;
  if (user.isBlocked) return true;
  return frozenIds.has(user._id);
};
