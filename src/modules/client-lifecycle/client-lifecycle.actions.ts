"use server";

import { revalidatePath } from "next/cache";
import { getSessionCookie } from "../auth/session";
import {
  addWarrantyClaim,
  createClient,
  createMaintenanceContract,
  createWarranty,
  generateRenewalFollowUpDraft,
  getAllClients,
  getAllMaintenanceContracts,
  getAllWarranties,
  getClientById,
  updateMaintenanceContractStatus,
  updateWarrantyClaimStatus,
} from "./client-lifecycle.service";
import {
  ClaimStatus,
  CreateClientInput,
  CreateMaintenanceContractInput,
  CreateWarrantyClaimInput,
  CreateWarrantyInput,
} from "./types";
import { MaintenanceContractStatus } from "@/types/enums";

export async function fetchClientsAction() {
  return await getAllClients();
}

export async function fetchClientDetailAction(id: string) {
  return await getClientById(id);
}

export async function createClientAction(input: CreateClientInput) {
  const session = await getSessionCookie();
  if (!session) return { success: false, error: "Sesi telah berakhir." };

  const res = await createClient(input, session.id);
  if (res.success) {
    revalidatePath("/client-lifecycle");
    revalidatePath("/command-center");
  }
  return res;
}

export async function fetchWarrantiesAction() {
  return await getAllWarranties();
}

export async function createWarrantyAction(input: CreateWarrantyInput) {
  const session = await getSessionCookie();
  if (!session) return { success: false, error: "Sesi telah berakhir." };

  const res = await createWarranty(input, session.id);
  if (res.success) {
    revalidatePath("/client-lifecycle");
  }
  return res;
}

export async function addWarrantyClaimAction(input: CreateWarrantyClaimInput) {
  const session = await getSessionCookie();
  if (!session) return { success: false, error: "Sesi telah berakhir." };

  const res = await addWarrantyClaim(input, session.id);
  if (res.success) {
    revalidatePath("/client-lifecycle");
  }
  return res;
}

export async function updateWarrantyClaimStatusAction(
  claimId: string,
  status: ClaimStatus,
  resolutionNotes?: string
) {
  const session = await getSessionCookie();
  if (!session) return { success: false, error: "Sesi telah berakhir." };

  const res = await updateWarrantyClaimStatus(claimId, status, session.id, resolutionNotes);
  if (res.success) {
    revalidatePath("/client-lifecycle");
  }
  return res;
}

export async function fetchMaintenanceContractsAction() {
  return await getAllMaintenanceContracts();
}

export async function createMaintenanceContractAction(
  input: CreateMaintenanceContractInput
) {
  const session = await getSessionCookie();
  if (!session) return { success: false, error: "Sesi telah berakhir." };

  const res = await createMaintenanceContract(input, session.id);
  if (res.success) {
    revalidatePath("/client-lifecycle");
    revalidatePath("/finance");
  }
  return res;
}

export async function updateMaintenanceContractStatusAction(
  contractId: string,
  status: MaintenanceContractStatus
) {
  const session = await getSessionCookie();
  if (!session) return { success: false, error: "Sesi telah berakhir." };

  const res = await updateMaintenanceContractStatus(contractId, status, session.id);
  if (res.success) {
    revalidatePath("/client-lifecycle");
  }
  return res;
}

export async function generateRenewalFollowUpDraftAction(
  type: "WARRANTY" | "MAINTENANCE",
  targetId: string
) {
  const session = await getSessionCookie();
  if (!session) {
    return {
      success: false,
      targetPhone: "",
      clientName: "",
      messageText: "",
      error: "Sesi telah berakhir.",
    };
  }

  return await generateRenewalFollowUpDraft(type, targetId);
}
