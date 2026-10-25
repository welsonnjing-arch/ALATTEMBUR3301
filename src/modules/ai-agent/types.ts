import { FailedReason, NextAction, PipelineStage } from "@/types/enums";

export interface AIChatAnalysisInput {
  prospectResearchNotes: string;
  conversationHistory: Array<{
    sender: "SALES" | "PROSPECT";
    text: string;
    timestamp: string;
  }>;
}

export interface AIChatAnalysisOutput {
  suggestedStage: PipelineStage;
  suggestedNextAction: NextAction;
  summary: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  proposedFailedReason?: FailedReason;
  suggestedDraftReply: string; // Draft siap kirim untuk di-review manusia
  requiresCommercialApproval: boolean;
  commercialApprovalDetails?: {
    type: "DISCOUNT" | "CUSTOM_PRICING" | "PAYMENT_TERMS" | "CONTRACTUAL_COMMITMENT";
    description: string;
    requestedValue?: string;
  };
}
