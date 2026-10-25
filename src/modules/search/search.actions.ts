"use server";

import { getAllProspects } from "../crm/crm.service";
import { getAllClients } from "../client-lifecycle/client-lifecycle.service";
import { getAllProjects } from "../projects/projects.service";
import { getAllInvoices } from "../finance/finance.service";

export interface SearchResultItem {
  id: string;
  category: "PROSPECT" | "CLIENT" | "PROJECT" | "INVOICE";
  title: string;
  subtitle: string;
  url: string;
  badge?: string;
}

export async function searchGlobalAction(query: string): Promise<SearchResultItem[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResultItem[] = [];

  // 1. Search Prospects
  try {
    const prospects = await getAllProspects();
    for (const p of prospects) {
      if (
        p.companyName.toLowerCase().includes(q) ||
        p.contactName.toLowerCase().includes(q) ||
        p.whatsappNumber.includes(q) ||
        (p.potentialServices && p.potentialServices.toLowerCase().includes(q))
      ) {
        results.push({
          id: p.id,
          category: "PROSPECT",
          title: p.companyName,
          subtitle: `Kontak: ${p.contactName} • ${p.potentialServices || "Layanan"} • Stage: ${p.stage}`,
          url: `/crm`,
          badge: p.stage,
        });
      }
    }
  } catch {}

  // 2. Search Clients
  try {
    const clients = await getAllClients();
    for (const c of clients) {
      if (
        c.name.toLowerCase().includes(q) ||
        c.picName.toLowerCase().includes(q) ||
        c.picPhone.includes(q) ||
        (c.industry && c.industry.toLowerCase().includes(q))
      ) {
        results.push({
          id: c.id,
          category: "CLIENT",
          title: c.name,
          subtitle: `PIC: ${c.picName} • ${c.industry || "Umum"} • +${c.picPhone}`,
          url: `/client-lifecycle`,
          badge: c.status,
        });
      }
    }
  } catch {}

  // 3. Search Projects
  try {
    const projects = await getAllProjects();
    for (const proj of projects) {
      if (
        proj.name.toLowerCase().includes(q) ||
        proj.clientName.toLowerCase().includes(q) ||
        proj.scopeDescription.toLowerCase().includes(q)
      ) {
        results.push({
          id: proj.id,
          category: "PROJECT",
          title: proj.name,
          subtitle: `Klien: ${proj.clientName} • Progress: ${proj.progressPercent}%`,
          url: `/projects`,
          badge: proj.status,
        });
      }
    }
  } catch {}

  // 4. Search Invoices
  try {
    const invoices = await getAllInvoices();
    for (const inv of invoices) {
      if (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q)
      ) {
        results.push({
          id: inv.id,
          category: "INVOICE",
          title: inv.invoiceNumber,
          subtitle: `Klien: ${inv.clientName} • Status: ${inv.status} • Rp ${inv.totalAmount.toLocaleString("id-ID")}`,
          url: `/finance`,
          badge: inv.status,
        });
      }
    }
  } catch {}

  return results.slice(0, 15);
}
