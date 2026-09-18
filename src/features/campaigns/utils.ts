import { CreateCampaignPayload } from "@/lib/api";

export const toggleArrayItem = (items: string[], item: string): string[] => {
  return items.includes(item) ? items.filter((x) => x !== item) : [...items, item];
};

export const CAMPAIGN_STEPS = ["Segment", "Message & Goal", "Timing", "Review"];

export function buildCampaignPayload(params: {
  finalName: string;
  subjectText: string;
  messageText: string;
  normalizedChannels: string[];
  bannerImage?: string;
  depositType?: string;
  rewardVal?: string;
  campaignType?: string;
  broadcastTime?: string;
  broadcastDate?: string;
  eventDelay?: string;
  segmentId: string;
  bulkRecipients: string[];
  conversionGoal: string;
  goalScopeItems: string[];
  goalRewardType: string;
  depositMinAmount?: string;
  goalMinAmount?: string;
  goalKycTier?: string;
  minAmountPerTx?: string;
  billPaymentCount?: string;
  inviteCount?: string;
  sendMoneyCount?: string;
  rewardPromoCode?: string;
  rewardAmount?: string;
}): CreateCampaignPayload {
  return {
    campaignName: params.finalName,
    subject: params.subjectText,
    message: params.messageText,
    campaignType: params.normalizedChannels.length > 0 ? params.normalizedChannels : ["email"],
    images: params.bannerImage || "https://revas/iuuuyyygggvvvvvfddddsdddddf",
    depositType: params.depositType || "first Deposit",
    conversionReward: params.rewardVal || "200",
    deliveryStrategy: params.campaignType || "drip-timebase",
    deliveryTime: params.broadcastTime || "01:00",
    deliveryDate: params.broadcastDate ? params.broadcastDate : "2026-08-16",
    deliveryTimezone: "Africa/Lagos",
    deliveryFrequency: params.campaignType === "event-trigger" ? params.eventDelay : "weekly",
    deliveryFrequencyValue: "2",
    deliveryFrequencyUnit: "hours",
    deliveryFrequencyTimezone: "Africa/Lagos",
    status: "draft",
    nextDeliveryAt: "2026-08-24",
    segmentId: params.segmentId,
    segment: params.segmentId,
    recipients: params.bulkRecipients,
    conversionGoal: params.conversionGoal,
    conditions: params.goalScopeItems.length > 0 ? params.goalScopeItems.join(", ") : "crypto",
    rewardType: params.conversionGoal === "deposit" ? params.goalRewardType : "hasSendMoney",
    minimumAmount: params.depositMinAmount || params.goalMinAmount || "1000",
    tier: params.goalKycTier || "1",
    minAmountPerTransaction: params.minAmountPerTx || "500",
    numberOfBillPayments: params.billPaymentCount || "1",
    numberOfFriends: params.inviteCount || "1",
    numberOfSend: params.sendMoneyCount || "1",
    promoCode: params.rewardPromoCode || "",
    cashReward: params.rewardAmount || "5000",
  };
}
