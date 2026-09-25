import React from "react";
import { useQuery } from "@tanstack/react-query";
import { campaignAPI, CampaignItem } from "@/lib/api";
import { SlidePanel, StatusBadge, PurpleBtn } from "@/components/admin/shared";
import { Skeleton } from "@/components/ui/skeleton";

interface CampaignDetailSheetProps {
  campaignId: string | null;
  onClose: () => void;
  onUpdateStatus: (id: string, currentStatus: string) => void;
}

export function CampaignDetailSheet({ campaignId, onClose, onUpdateStatus }: CampaignDetailSheetProps) {
  const { data: campaignRes, isLoading } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => campaignAPI.getById(campaignId!),
    enabled: !!campaignId,
  });

  const campaign = campaignRes?.data as CampaignItem | undefined;

  return (
    <SlidePanel
      open={!!campaignId}
      onClose={onClose}
      title="Campaign Details"
      subtitle={campaign?.campaignName || "View campaign summary"}
    >
      {isLoading ? (
        <div className="space-y-4 p-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : campaign ? (
        <div className="space-y-4 text-[13px]">
          <div>
            <span className="text-muted-foreground block text-[11px]">Name</span>
            <span className="font-semibold text-foreground">{campaign.campaignName}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Status</span>
            <StatusBadge status={campaign.status} />
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Subject</span>
            <span className="text-foreground">{campaign.subject || "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Message</span>
            <p className="text-foreground bg-secondary/50 p-3 rounded-lg mt-1 text-[12px]">{campaign.message || "—"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <span className="text-muted-foreground block text-[11px]">Recipients</span>
              <span className="font-medium text-foreground">{campaign.totalRecipients || campaign.recipients?.length || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Type</span>
              <span className="font-medium text-foreground uppercase">{campaign.campaignType}</span>
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <PurpleBtn
              onClick={() => {
                if (campaignId) onUpdateStatus(campaignId, campaign.status);
              }}
              size="sm"
            >
              {campaign.status?.toLowerCase() === "paused" ? "Resume Campaign" : "Pause Campaign"}
            </PurpleBtn>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-[12px]">Campaign not found.</p>
      )}
    </SlidePanel>
  );
}
