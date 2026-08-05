import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { CirclePause, CirclePlay, Lock, LockOpen } from "lucide-react";
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

// Mock audit log data
const auditLog = [
  {
    id: 1,
    action: "PAUSED",
    timestamp: "2026-07-02T14:23:11",
    actor: "Chukwuemeka Obi (Super Admin)",
    reason: "Suspicious withdrawal batch detected",
  },
  {
    id: 2,
    action: "RESUMED",
    timestamp: "2026-07-02T16:47:33",
    actor: "Chukwuemeka Obi (Super Admin)",
    reason: "Investigation complete — no breach confirmed",
  },
  {
    id: 3,
    action: "PAUSED",
    timestamp: "2026-06-18T09:12:05",
    actor: "Adoro Nwosu (Organization Lead)",
    reason: "",
  },
];

// Type for modal action
type ModalAction = "pause" | "resume";

// Type for which control is being toggled
type ControlType =
  | "highValue"
  | "flagged"
  | "palmpay"
  | "newAccount";

const WithdrawalControls = () => {
  // State for granular controls
  const [highValuePaused, setHighValuePaused] = useState(false);
  const [flaggedPaused, setFlaggedPaused] = useState(false);
  const [palmpayPaused, setPalmpayPaused] = useState(false);
  const [newAccountPaused, setNewAccountPaused] = useState(false);

  // State for threshold editing
  const [thresholdValue, setThresholdValue] = useState("N100,000");
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);
  const [tempThreshold, setTempThreshold] = useState("N100,000");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalControl, setModalControl] = useState<ControlType>("highValue");
  const [modalAction, setModalAction] = useState<ModalAction>("pause");
  const [modalReason, setModalReason] = useState("");

  // For the kill switch, we just show status (static for now)
  const killSwitchActive = true;

  // Handle threshold edit
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

  // Function to open modal when a switch is toggled
  const handleToggle = (control: ControlType, currentState: boolean) => {
    // Determine action: if currently false, we want to pause; if true, resume
    const action: ModalAction = currentState ? "resume" : "pause";
    setModalControl(control);
    setModalAction(action);
    setModalReason("");
    setModalOpen(true);
  };

  // Function to confirm the action
  const handleConfirm = () => {
    // Update the appropriate state based on control and action
    // action: if pause, set to true; if resume, set to false
    const newState = modalAction === "pause";
    switch (modalControl) {
      case "highValue":
        setHighValuePaused(newState);
        break;
      case "flagged":
        setFlaggedPaused(newState);
        break;
      case "palmpay":
        setPalmpayPaused(newState);
        break;
      case "newAccount":
        setNewAccountPaused(newState);
        break;
    }
    // Here you would also save the reason to the audit log (API call, etc.)
    console.log(
      `${modalAction.toUpperCase()} ${modalControl} with reason: ${modalReason}`
    );
    setModalOpen(false);
  };

  // Get content for modal based on control
  const getModalContent = () => {
    switch (modalControl) {
      case "highValue":
        return {
          title: "Pause withdrawals above N100,000",
          description:
            "Hold high-value transfers only — amounts exceeding the threshold are queued.",
          extra: <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="font-medium">Threshold:</span>
            <Input type="text" value="N100,000" className="w-32 h-8 text-sm" disabled />
          </div>,
        };
      case "flagged":
        return {
          title: "Pause withdrawals for flagged accounts",
          description:
            "Hold all outbound requests from accounts with active fraud flags.",
          extra: null,
        };
      case "palmpay":
        return {
          title: "Pause PalmPay channel only",
          description:
            "Block PalmPay as a payout channel while all other methods continue.",
          extra: null,
        };
      case "newAccount":
        return {
          title: "Pause for new accounts (< 7 days)",
          description:
            "Hold withdrawals from accounts created within the last 7 days.",
          extra: null,
        };
    }
  };

  const modalContent = getModalContent();

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Withdrawal Controls
          </h1>
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
              <div className="bg-green-300/10 h-16 w-16 rounded-lg flex justify-center items-center">
                <LockOpen className="text-green-600 size-8" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold">Withdrawal Kill Switch</h2>
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
                <span className="text-xs text-muted-foreground">
                  Last changed by{" "}
                  <span className="text-white font-semibold">
                    Chukwuemeka Obi
                  </span>{" "}
                  · Jul 2, 2026 at 14:23
                </span>
              </div>
            </div>
            <Button variant="destructive" size="sm" className="">
              <CirclePause />
              Pause All Withdrawals
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Granular Controls */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>Granular Controls</CardTitle>
          <CardDescription>
            Fine-grained pause options without full platform shutdown — each
            requires a reason
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
                    Hold high-value transfers only — amounts exceeding the
                    threshold are queued.
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleThresholdApply}
                          className="h-8 px-3 text-xs"
                        >
                          Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleThresholdCancel}
                          className="h-8 px-3 text-xs"
                        >
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleThresholdEdit}
                          className="h-8 px-2 text-xs"
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <Switch
                  checked={highValuePaused}
                  onCheckedChange={() =>
                    handleToggle("highValue", highValuePaused)
                  }
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
                  <h4 className="font-medium">
                    Pause withdrawals for flagged accounts
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Hold all outbound requests from accounts with active fraud
                    flags.
                  </p>
                </div>
                <Switch
                  checked={flaggedPaused}
                  onCheckedChange={() =>
                    handleToggle("flagged", flaggedPaused)
                  }
                />
              </div>
            </div>
          </div>

          <hr className="border-border/50" />

          {/* Option 3: PalmPay channel */}
          <div className="flex flex-col sm:flex-row sm:items-start rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Pause PalmPay channel only</h4>
                  <p className="text-sm text-muted-foreground">
                    Block PalmPay as a payout channel while all other methods
                    continue.
                  </p>
                </div>
                <Switch
                  checked={palmpayPaused}
                  onCheckedChange={() =>
                    handleToggle("palmpay", palmpayPaused)
                  }
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
                  <h4 className="font-medium">
                    Pause for new accounts (&lt; 7 days)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Hold withdrawals from accounts created within the last 7
                    days.
                  </p>
                </div>
                <Switch
                  checked={newAccountPaused}
                  onCheckedChange={() =>
                    handleToggle("newAccount", newAccountPaused)
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card className="bg-gradient-card border-border/50 shadow-card flex-1 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>
            Every pause and resume with actor and reason
          </CardDescription>
        </CardHeader>
        <hr className="border-border/50" />
        <CardContent className="flex-1 overflow-y-auto p-0 md:p-6">
          <div className="">
            {auditLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-muted/5 hover:bg-muted/10 transition-colors mb-4"
              >
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${entry.action === "PAUSED"
                  ? "bg-red-500/10"
                  : "bg-green-500/10"
                  }`}>
                  {entry.action === "PAUSED" ? (
                    <Lock className="h-4 w-4 text-red-500" />
                  ) : (
                    <LockOpen className="h-4 w-4 text-green-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0 ">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">
                        {entry.action === "PAUSED" ? "Withdrawal Paused" : "Withdrawal Resumed"}
                      </p>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(entry.timestamp), "yyyy-MM-dd HH:mm:ss")}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground/80">
                      {entry.actor}
                    </span>
                  </div>
                  <p className="text-xs mt-2">
                    {entry.reason || (
                      <span className="text-muted-foreground italic">
                        No reason provided
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className={`h-12 w-12 rounded-lg flex justify-center items-center mb-3 ${modalAction === "pause"
              ? "bg-yellow-300/10"
              : "bg-green-300/10"
              }`}>
              {modalAction === "pause" ? (
                <CirclePause className="text-yellow-500 size-6" />
              ) : (
                <CirclePlay className="text-green-500 size-6" />
              )}
            </div>
            <DialogTitle>
              {modalAction === "pause" ? "Enable this Control?" : "Disable this Control?"}
            </DialogTitle>
            <h2 className="text-sm">{modalContent?.title}</h2>
            <DialogDescription className="text-xs">
              {modalContent?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="">
            {modalContent?.extra}
            <div className="">
              <Label htmlFor="reason" className="text-right text-xs">
                Reason {modalAction === "pause" ? "for pause" : "for resume"} (required for audit log)
              </Label>
              <Textarea
                id="reason"
                placeholder="Enter a reason..."
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button className="w-full" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="w-full"
              onClick={handleConfirm}
              variant={modalAction === "pause" ? "destructive" : "default"}
            >
              {modalAction === "pause" ? "Pause" : "Resume"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WithdrawalControls;