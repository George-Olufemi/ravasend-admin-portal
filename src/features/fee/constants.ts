export const FEE_CATS = [
  { label: "Bank Transfers", color: "blue" },
  { label: "Crypto", color: "violet" },
  { label: "Bills & Airtime", color: "orange" },
  { label: "Cross-border", color: "cyan" },
  { label: "Internal Transfer", color: "green" },
  { label: "Other", color: "zinc" },
];

export const CURRENCIES = ["NGN", "USDC", "USDT", "USD", "GBP", "EUR", "GHS"];

export const catColorMap: Record<string, string> = {
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
  green: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  zinc: "bg-zinc-500/10 border-zinc-500/20 text-zinc-400",
};

export const USER_COMMISSION_PCT = 30;
export const PLATFORM_COMMISSION_PCT = 70;

export const BILLS_SERVICE_TYPES = [
  "Airtime (MTN, Airtel, GLO, 9mobile)",
  "Data Bundles",
  "Electricity Bills",
  "TV Subscriptions",
  "Internet Services",
  "Water Bills",
  "Insurance Premiums",
  "Custom Bills",
];

export const BANK_PROVIDERS = [
  "Access Bank",
  "Zenith Bank",
  "GTBank",
  "First Bank",
  "UBA",
  "FCMB",
  "Fidelity Bank",
  "Stanbic IBTC",
  "Union Bank",
  "Polaris Bank",
  "Sterling Bank",
  "Wema Bank",
  "Keystone Bank",
  "Heritage Bank",
  "Ecobank",
  "JAIZ Bank",
  "Kuda Bank",
  "OPay",
  "Palmpay",
  "Moniepoint",
];

export const CRYPTO_ASSETS = [
  "BTC",
  "ETH",
  "USDC",
  "USDT",
  "SOL",
  "BNB",
  "MATIC",
  "TRX",
  "XRP",
  "AVAX",
];

export const BILL_SERVICE_PROVIDERS = [
  "MTN Airtime",
  "Airtel Airtime",
  "GLO Airtime",
  "9mobile Airtime",
  "MTN Data",
  "Airtel Data",
  "GLO Data",
  "9mobile Data",
  "AEDC (Abuja)",
  "EKEDC (Eko)",
  "IKEDC (Ikeja)",
  "PHEDC (Port Harcourt)",
  "EEDC (Enugu)",
  "Jos Electricity",
  "Kaduna Electricity",
  "DSTV",
  "GOtv",
  "Startimes",
  "Spectranet",
  "Smile Internet",
  "WAEC",
  "NECO",
  "JAMB",
];

export const CORRIDOR_PROVIDERS = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "United Kingdom",
  "United States",
  "Canada",
  "South Africa",
  "Uganda",
  "Tanzania",
  "Rwanda",
  "Zimbabwe",
  "Zambia",
  "Cameroon",
  "Ivory Coast",
  "Senegal",
  "Ethiopia",
  "Egypt",
  "Morocco",
  "Germany",
  "France",
  "Netherlands",
  "Australia",
  "UAE",
  "India",
];

export const PROVIDERS_BY_CATEGORY: Record<string, string[]> = {
  "Bank Transfers": BANK_PROVIDERS,
  Crypto: CRYPTO_ASSETS,
  "Bills & Airtime": BILL_SERVICE_PROVIDERS,
  "Cross-border": CORRIDOR_PROVIDERS,
  "Internal Transfer": [],
};

export const VTPASS_SERVICES = [
  { service: "MTN Airtime", commission: 3.0 },
  { service: "Airtel Airtime", commission: 4.0 },
  { service: "GLO Airtime", commission: 5.0 },
  { service: "9mobile Airtime", commission: 5.0 },
  { service: "MTN Data", commission: 3.0 },
  { service: "Airtel Data", commission: 4.0 },
  { service: "GLO Data", commission: 5.0 },
  { service: "9mobile Data", commission: 5.0 },
  { service: "DSTV Subscription", commission: 2.0 },
  { service: "GOtv Subscription", commission: 2.0 },
  { service: "Startimes Subscription", commission: 2.5 },
  { service: "Electricity (AEDC, EKEDC, IKEDC, etc.)", commission: 1.2 },
];
