import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { referralAPI, ReferralBonus } from "@/lib/api";
import { Page, ReferralOverviewPage, ReferralDetailsPage, ReferralDownlineTabWrapper } from "@/features/referral-program";

const ReferralProgram = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab =
    (searchParams.get("tab") as "overview" | "details" | "downline") ??
    "overview";

  const overviewQuery = useQuery({
    queryKey: ["referrals"],
    queryFn: referralAPI.getAll,
  });

  const detailsQuery = useQuery({
    queryKey: ["referral-details"],
    queryFn: referralAPI.getAllReferralDetails,
  });

  const handleTabChange = (page: Page) => {
    if (page === "referral-overview") {
      setSearchParams({ tab: "overview" });
    } else if (page === "referral-details") {
      setSearchParams({ tab: "details" });
    } else if (page === "referral-explorer") {
      setSearchParams({ tab: "downline" });
    } else {
      navigate(`/admin/${page}`);
    }
  };

  const exportCsv = () => {
    const list: ReferralBonus[] = overviewQuery.data?.data || [];

    if (!list.length) return;

    const headers = [
      "Referrer Name",
      "Referrer Email",
      "Deposit (USD)",
      "Reward (NGN)",
    ];

    const rows = list.map((item) => [
      item.userId?.fullName || "Unknown User",
      item.userId?.email || "-",
      (item.userId?.dollarWallet || 0).toFixed(2),
      (item.amount || 0).toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((e) => e.join(","))
        .join("\n");

    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `referral-report-${new Date().toISOString()}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (activeTab === "details") {
    return (
      <ReferralDetailsPage
        setPage={handleTabChange}
        detailsData={detailsQuery.data?.data}
        isLoading={detailsQuery.isLoading}
        exportCsv={exportCsv}
      />
    );
  }

  if (activeTab === "downline") {
    return <ReferralDownlineTabWrapper setPage={handleTabChange} />;
  }

  return (
    <ReferralOverviewPage
      setPage={handleTabChange}
      overviewData={overviewQuery.data}
      detailsData={detailsQuery.data?.data}
      isLoading={overviewQuery.isLoading}
      exportCsv={exportCsv}
    />
  );
};


export default ReferralProgram;
