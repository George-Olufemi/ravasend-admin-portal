import React, { useState, useEffect } from "react";
import { CampaignItem } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface EditCampaignDialogProps {
  campaign: CampaignItem | null;
  onClose: () => void;
  onSave: (data: Partial<CampaignItem>) => void;
  isSaving: boolean;
}

export function EditCampaignDialog({ campaign, onClose, onSave, isSaving }: EditCampaignDialogProps) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (campaign) {
      setName(campaign.campaignName || "");
      setSubject(campaign.subject || "");
      setMessage(campaign.message || "");
    }
  }, [campaign]);

  return (
    <Dialog open={!!campaign} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Edit Campaign</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 text-[12px]">
          <div>
            <label className="block text-muted-foreground mb-1">Campaign Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-muted-foreground mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-muted-foreground mb-1">Message</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-[12px] font-semibold border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave({ campaignName: name, subject, message })}
            disabled={isSaving}
            className="px-4 py-2 text-[12px] font-bold bg-primary hover:bg-primary/90 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? <LoadingSpinner size="sm" /> : "Save Changes"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
