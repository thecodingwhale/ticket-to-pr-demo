import { authorizeAction, type Session } from "../auth/authorize";
import { getStore, type Invoice } from "../db/store";
import type { ActionResult } from "./result";

const READERS = ["admin", "service_advisor", "technician"] as const;

export async function getInvoice(session: Session, invoiceId: string): Promise<ActionResult<Invoice>> {
  authorizeAction(session, READERS, { intent: "read" });

  const invoice = getStore().findInvoice(invoiceId);
  if (!invoice) {
    return { ok: false, error: "Invoice not found" };
  }
  return { ok: true, data: invoice };
}

export async function listInvoices(session: Session): Promise<ActionResult<Invoice[]>> {
  authorizeAction(session, READERS, { intent: "read" });
  return { ok: true, data: getStore().listInvoices(session.tenantId) };
}
