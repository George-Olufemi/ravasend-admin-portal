import React from "react";
import { Page } from "../types";
import ReferralDownline from "../../../pages/admin/ReferralDownline";

export function ReferralDownlineTabWrapper({ setPage }: { setPage: (p: Page) => void }) {
  const REFERRAL_TABS: { label: string; page: Page }[] = [
    { label: "Overview", page: "referral-overview" },
    { label: "User Details", page: "referral-details" },
    { label: "Downline Explorer", page: "referral-explorer" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Referral Program
        </h1>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground mb-6">
        Track every invite, signup, and reward across your network.
      </p>

      {/* Referral tabs */}
      <div className="flex items-center gap-1 mb-7 bg-white/[0.03] border border-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
        {REFERRAL_TABS.map((t) => (
          <button
            key={t.page}
            onClick={() => setPage(t.page)}
            className={`px-4 sm:px-5 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all ${
              t.page === "referral-explorer"
                ? "text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={
              t.page === "referral-explorer"
                ? {
                    background:
                      "linear-gradient(135deg,#7B3FE4,#5B2AB8)",
                  }
                : {}
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Downline content */}
      <ReferralDownline isTab />
    </div>
  );
}
