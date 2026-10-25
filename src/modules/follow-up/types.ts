export interface FollowUpSequenceState {
  prospectId: string;
  currentStep: "INITIAL" | "FU1" | "FU2" | "FU3" | "FAILED";
  lastSentDate: string;
  nextDueDate: string;
  isSequenceActive: boolean;
  stoppedReason?: "CLIENT_REPLIED" | "MARKED_FAILED" | "MANUAL_PAUSE";
}
