import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CirclePause, CirclePlay, Lock, LockOpen, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { systemSettingsAPI } from "@/lib/api";

type ModalAction = "pause" | "resume";
type ControlType = "highValue" | "flagged" | "palmpay" | "newAccount" | "killSwitch";

// ── Response types (based on what you shared) ──
interface AccessControlStatus {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
  };
  isPermitted: boolean; // true = withdrawals active, false = paused
  createdAt: string;
  updatedAt: string;
}

interface AccessControlStatusResponse {
  message: string;
  data: AccessControlStatus;
}

interface AuditLogEntry {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
  };
  featureName: string; // e.g. "System access control disabled by user: Chad Lamb"
  email: string;
  ipAddress: string;
  browser: string;
  device: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

interface AuditLogResponse {
  success: boolean;
  message: string;
  data: AuditLogEntry[];
}

const WITHDRAWAL_STATUS_QUERY_KEY = ["withdrawal-pause-status"] as const;
const WITHDRAWAL_AUDIT_LOG_QUERY_KEY = ["withdrawal-pause-audit-log"] as const;

// Derive PAUSED/RESUMED + a friendly label from the raw featureName string
const parseAuditEntry = (entry: AuditLogEntry) => {
  const isPause = entry.featureName.toLowerCase().includes("disabled");
  return {
    action: isPause ? "PAUSED" : "RESUMED",
    label: isPause ? "Withdrawal Paused" : "Withdrawal Resumed",
  };
};

const WithdrawalControls = () => {
  const queryClient = useQueryClient();

  // ── Status query ──
  const {
    data: statusResponse,
    isLoading: isStatusLoading,
    isError: isStatusError,
  } = useQuery<AccessControlStatusResponse>({
    queryKey: WITHDRAWAL_STATUS_QUERY_KEY,
    queryFn: systemSettingsAPI.getWithdrawalPauseStatus,
  });

  const statusData = statusResponse?.data;
  const killSwitchActive = statusData?.isPermitted ?? false; // true = active
  const isKillSwitchPaused = !killSwitchActive;

  // The 3 server-driven toggles mirror the single isPermitted flag
  const highValuePaused = isKillSwitchPaused;
  const flaggedPaused = isKillSwitchPaused;
  const newAccountPaused = isKillSwitchPaused;

  // PalmPay stays local — not controlled by the status endpoint
  const [palmpayPaused, setPalmpayPaused] = useState(false);

  // ── Audit log query ──
  const {
    data: auditLogResponse,
    isLoading: isAuditLoading,
    isError: isAuditError,
  } = useQuery<AuditLogResponse>({
    queryKey: WITHDRAWAL_AUDIT_LOG_QUERY_KEY,
    queryFn: systemSettingsAPI.getWithdrawalPauseAuditLog,
  });

  const auditLog = auditLogResponse?.data ?? [];

  // Threshold editing (still local — no backend field for this yet)
  const [thresholdValue, setThresholdValue] = useState("N100,000");
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);
  const [tempThreshold, setTempThreshold] = useState("N100,000");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalControl, setModalControl] = useState<ControlType>("highValue");
  const [modalAction, setModalAction] = useState<ModalAction>("pause");
  const [modalReason, setModalReason] = useState("");

  // ── Mutation ──
  const toggleMutation = useMutation({
    mutationFn: systemSettingsAPI.toggleWithdrawalPause,
    onSuccess: () => {
      // Backend doesn't return the updated doc in a predictable shape here,
      // and the audit log is a separate collection anyway — refetch both.
      queryClient.invalidateQueries({ queryKey: WITHDRAWAL_STATUS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WITHDRAWAL_AUDIT_LOG_QUERY_KEY });
      setModalOpen(false);
    },
  });

  const handleThresholdEdit = () => {
    setTempThreshold(thresholdValue);
    setIsEditingThreshold(true);
  };
  const handleThresholdApply = () => {
    setThresholdValue(tempThreshold);
    setIsEditingThreshold(false);
  };
  const handleThresholdCancel = () => {
    setTempThreshold(thresholdValue);
    setIsEditingThreshold(false);
  };

  const handleToggle = (control: ControlType, currentState: boolean) => {
    const action: ModalAction = currentState ? "resume" : "pause";
    setModalControl(control);
    setModalAction(action);
    setModalReason("");
    setModalOpen(true);
  };

  const handleConfirm = () => {
    if (modalControl === "palmpay") {
      setPalmpayPaused(modalAction === "pause");
      setModalOpen(false);
      return;
    }
    // killSwitch, highValue, flagged, newAccount all flip the same server flag
    toggleMutation.mutate();
  };
  // Get content for modal — now action-aware, so copy matches pause vs resume
  const getModalContent = () => {
    const isResume = modalAction === "resume";

    switch (modalControl) {
      case "killSwitch":
        return isResume
          ? {
            title: "Resume all withdrawals",
            description: "Withdrawal processing will return to normal platform-wide.",
            extra: null,
          }
          : {
            title: "Pause all withdrawals",
            description: "This halts every withdrawal on the platform immediately.",
            extra: null,
          };
      case "highValue":
        return isResume
          ? {
            title: "Resume withdrawals above N100,000",
            description:
              "High-value transfers exceeding the threshold will process normally again.",
            extra: (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="font-medium">Threshold:</span>
                <Input type="text" value={thresholdValue} className="w-32 h-8 text-sm" disabled />
              </div>
            ),
          }
          : {
            title: "Pause withdrawals above N100,000",
            description:
              "Hold high-value transfers only — amounts exceeding the threshold are queued.",
            extra: (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="font-medium">Threshold:</span>
                <Input type="text" value={thresholdValue} className="w-32 h-8 text-sm" disabled />
              </div>
            ),
          };
      case "flagged":
        return isResume
          ? {
            title: "Resume withdrawals for flagged accounts",
            description: "Accounts with active fraud flags will be able to withdraw again.",
            extra: null,
          }
          : {
            title: "Pause withdrawals for flagged accounts",
            description: "Hold all outbound requests from accounts with active fraud flags.",
            extra: null,
          };
      case "palmpay":
        return isResume
          ? {
            title: "Resume PalmPay channel",
            description: "PalmPay will be available as a payout channel again.",
            extra: null,
          }
          : {
            title: "Pause PalmPay channel only",
            description: "Block PalmPay as a payout channel while all other methods continue.",
            extra: null,
          };
      case "newAccount":
        return isResume
          ? {
            title: "Resume for new accounts",
            description: "Accounts created within the last 7 days can withdraw again.",
            extra: null,
          }
          : {
            title: "Pause for new accounts (< 7 days)",
            description: "Hold withdrawals from accounts created within the last 7 days.",
            extra: null,
          };
    }
  };

  const modalContent = getModalContent();

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Withdrawal Controls</h1>
          <p className="text-muted-foreground">
            Platform-wide withdrawal management and emergency kill switch
          </p>
        </div>
      </div>

      {/* Withdrawal Kill Switch */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6">
            <div className="flex items-center gap-4">
              <div
                className={`h-16 w-16 rounded-lg flex justify-center items-center ${killSwitchActive ? "bg-green-300/10" : "bg-red-300/10"
                  }`}
              >
                {isStatusLoading ? (
                  <Loader2 className="animate-spin size-8 text-muted-foreground" />
                ) : killSwitchActive ? (
                  <LockOpen className="text-green-600 size-8" />
                ) : (
                  <Lock className="text-red-600 size-8" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold">Withdrawal Kill Switch</h2>
                {isStatusLoading ? (
                  <p className="text-sm text-muted-foreground">Loading status…</p>
                ) : isStatusError ? (
                  <p className="text-sm text-red-500 font-semibold">✗ Failed to load status</p>
                ) : (
                  <p
                    className={
                      killSwitchActive
                        ? "text-green-500 text-sm font-semibold"
                        : "text-red-500 text-sm font-semibold"
                    }
                  >
                    {killSwitchActive
                      ? "✓ ACTIVE — Processing normally"
                      : "✗ PAUSED — All withdrawals halted"}
                  </p>
                )}
                {statusData?.userId?.fullName && (
                  <span className="text-xs text-muted-foreground">
                    Last changed by{" "}
                    <span className="text-white font-semibold">
                      {statusData.userId.fullName}
                    </span>{" "}
                    · {format(new Date(statusData.updatedAt), "MMM d, yyyy 'at' HH:mm")}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant={killSwitchActive ? "destructive" : "default"}
              size="sm"
              disabled={isStatusLoading || toggleMutation.isPending}
              onClick={() => handleToggle("killSwitch", isKillSwitchPaused)}
            >
              {toggleMutation.isPending && modalControl === "killSwitch" ? (
                <Loader2 className="animate-spin" />
              ) : killSwitchActive ? (
                <CirclePause />
              ) : (
                <CirclePlay />
              )}
              {killSwitchActive ? "Pause All Withdrawals" : "Resume All Withdrawals"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Granular Controls */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>Granular Controls</CardTitle>
          <CardDescription>
            Fine-grained pause options without full platform shutdown — each requires a reason
          </CardDescription>
        </CardHeader>
        <hr className="border-border/50" />
        <CardContent className="space-y-4">
          {/* Option 1: High value */}
          <div className="flex flex-col sm:flex-row sm:items-start rounded-lg">
            <div className="flex-1 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Pause withdrawals above N100,000</h4>
                  <p className="text-sm text-muted-foreground">
                    Hold high-value transfers only — amounts exceeding the threshold are queued.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm font-medium">Threshold:</span>
                    {isEditingThreshold ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={tempThreshold}
                          onChange={(e) => setTempThreshold(e.target.value)}
                          className="w-32 h-8 text-sm"
                          autoFocus
                        />
                        <Button size="sm" variant="outline" onClick={handleThresholdApply} className="h-8 px-3 text-xs">
                          Apply
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleThresholdCancel} className="h-8 px-3 text-xs">
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={thresholdValue}
                          className="w-32 h-8 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                          disabled
                          onClick={handleThresholdEdit}
                        />
                        <Button size="sm" variant="ghost" onClick={handleThresholdEdit} className="h-8 px-2 text-xs">
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <Switch
                  checked={highValuePaused}
                  disabled={isStatusLoading || toggleMutation.isPending}
                  onCheckedChange={() => handleToggle("highValue", highValuePaused)}
                />
              </div>
            </div>
          </div>

          <hr className="border-border/50" />

          {/* Option 2: Flagged accounts */}
          <div className="flex flex-col sm:flex-row sm:items-start rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Pause withdrawals for flagged accounts</h4>
                  <p className="text-sm text-muted-foreground">
                    Hold all outbound requests from accounts with active fraud flags.
                  </p>
                </div>
                <Switch
                  checked={flaggedPaused}
                  disabled={isStatusLoading || toggleMutation.isPending}
                  onCheckedChange={() => handleToggle("flagged", flaggedPaused)}
                />
              </div>
            </div>
          </div>

          <hr className="border-border/50" />

          {/* Option 3: PalmPay channel — local only, not tied to status endpoint */}
          <div className="flex flex-col sm:flex-row sm:items-start rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Pause PalmPay channel only</h4>
                  <p className="text-sm text-muted-foreground">
                    Block PalmPay as a payout channel while all other methods continue.
                  </p>
                </div>
                <Switch
                  checked={palmpayPaused}
                  onCheckedChange={() => handleToggle("palmpay", palmpayPaused)}
                />
              </div>
            </div>
          </div>

          <hr className="border-border/50" />

          {/* Option 4: New accounts */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Pause for new accounts (&lt; 7 days)</h4>
                  <p className="text-sm text-muted-foreground">
                    Hold withdrawals from accounts created within the last 7 days.
                  </p>
                </div>
                <Switch
                  checked={newAccountPaused}
                  disabled={isStatusLoading || toggleMutation.isPending}
                  onCheckedChange={() => handleToggle("newAccount", newAccountPaused)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log — now live from getWithdrawalPauseAuditLog */}
      <Card className="bg-gradient-card border-border/50 shadow-card flex-1 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>Every pause and resume with actor and context</CardDescription>
        </CardHeader>
        <hr className="border-border/50" />
        <CardContent className="flex-1 overflow-y-auto p-0 md:p-6">
          {isAuditLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
              <Loader2 className="animate-spin size-4" />
              Loading audit log…
            </div>
          ) : isAuditError ? (
            <p className="text-sm text-red-500 py-8 text-center">Failed to load audit log</p>
          ) : auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No events yet</p>
          ) : (
            <div>
              {auditLog.map((entry) => {
                const { action, label } = parseAuditEntry(entry);
                return (
                  <div
                    key={entry._id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-muted/5 hover:bg-muted/10 transition-colors mb-4"
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${action === "PAUSED" ? "bg-red-500/10" : "bg-green-500/10"
                        }`}
                    >
                      {action === "PAUSED" ? (
                        <Lock className="h-4 w-4 text-red-500" />
                      ) : (
                        <LockOpen className="h-4 w-4 text-green-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{label}</p>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(entry.createdAt), "yyyy-MM-dd HH:mm:ss")}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground/80">
                          {entry.userId?.fullName ?? entry.email}
                          {entry.userId?.role && (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              ({entry.userId.role})
                            </span>
                          )}
                        </span>
                      </div>
                      <p className="text-xs mt-2 text-muted-foreground">
                        {entry.featureName}
                        {entry.browser && entry.browser !== "Other" && ` · ${entry.browser}`}
                        {entry.device && entry.device !== "Other" && ` · ${entry.device}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div
              className={`h-12 w-12 rounded-lg flex justify-center items-center mb-3 ${modalAction === "pause" ? "bg-yellow-300/10" : "bg-green-300/10"
                }`}
            >
              {modalAction === "pause" ? (
                <CirclePause className="text-yellow-500 size-6" />
              ) : (
                <CirclePlay className="text-green-500 size-6" />
              )}
            </div>
            <DialogTitle>
              {modalAction === "pause" ? "Pause this control?" : "Resume this control?"}
            </DialogTitle>
            <h2 className="text-sm font-medium">{modalContent?.title}</h2>
            <DialogDescription className="text-xs">{modalContent?.description}</DialogDescription>
          </DialogHeader>
          <div>
            {modalContent?.extra}
            <div>
              <Label htmlFor="reason" className="text-right text-xs">
                Reason {modalAction === "pause" ? "for pause" : "for resume"} (Optional)
              </Label>
              <Textarea
                id="reason"
                placeholder="Enter a reason..."
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                className="mt-1"
              />
            </div>
            {toggleMutation.isError && (
              <p className="text-xs text-red-500 mt-2">Something went wrong. Please try again.</p>
            )}
          </div>


          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={toggleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="w-full"
              onClick={handleConfirm}
              variant={modalAction === "pause" ? "destructive" : "default"}
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : modalAction === "pause" ? (
                "Pause"
              ) : (
                "Resume"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WithdrawalControls;