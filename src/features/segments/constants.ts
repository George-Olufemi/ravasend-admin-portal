export const COLOR_PALETTE = ["#7B3FE4", "#F59E0B", "#4ADE80", "#F87171", "#A78BFA", "#60A5FA", "#34D399", "#FB923C"];

export const SEG_FIELDS = [
	{ key: "nairaWallet", label: "Naira Wallet Balance (₦)", type: "currency" },
	{ key: "dollarWallet", label: "Dollar Wallet Balance ($)", type: "currency" },
	{ key: "isFirstDeposit", label: "Is First Deposit", type: "boolean" },
	{ key: "isFirstConversion", label: "Is First Conversion", type: "boolean" },
	{ key: "kycLevel", label: "KYC Level", type: "enum" },
	{ key: "depositCount", label: "Deposit Count", type: "number" },
	{ key: "referralCount", label: "Referral Count", type: "number" },
	{ key: "totalDeposited", label: "Total Deposited Amount", type: "currency" },
	{ key: "daySinceSignUp", label: "Days Since Sign Up", type: "number" },
	{ key: "daySinceLastTransact", label: "Days Since Last Transaction", type: "number" },
	{ key: "country", label: "Country", type: "enum" },
	{ key: "accountStatus", label: "Account Status", type: "enum" },
];

export const SEG_ENUM_VALUES: Record<string, string[]> = {
	kycLevel: ["0", "1", "2", "3"],
	country: ["Nigeria", "Ghana", "Kenya", "Uganda", "United Kingdom", "United States", "Canada"],
	accountStatus: ["Active", "Inactive", "Suspended", "Pending", "Flagged"],
};

export const SEG_OPERATORS = ["=", "!=", ">", "<", ">=", "<=", "between"];
