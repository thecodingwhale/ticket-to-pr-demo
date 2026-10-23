import { authorizeAction, type Session } from "../auth/authorize";
import { getStore, type Invoice } from "../db/store";
import { lineTotalCents, percentOfCents, sumCents } from "../lib/money";
import { createInvoiceSchema, type CreateInvoiceInput } from "../schemas/invoice";
import type { ActionResult } from "./result";

export async function createInvoice(
  session: Session,
  input: CreateInvoiceInput,
): Promise<ActionResult<Invoice>> {
  authorizeAction(session, ["admin", "service_advisor"]);

  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((issue) => issue.message).join("; ") };
  }

  const { customer, lines, discountPercent } = parsed.data;
  const lineTotals = lines.map((line) => lineTotalCents(line.quantity, line.unitCents));
  const subtotalCents = sumCents(lineTotals);
  // The discount is applied line by line so each line can show its own share.
  const discountCents = sumCents(lineTotals.map((total) => percentOfCents(total, discountPercent)));

  const store = getStore();
  const invoice: Invoice = {
    id: store.nextId(),
    tenantId: session.tenantId,
    number: store.nextInvoiceNumber(),
    customer,
    lines,
    subtotalCents,
    discountPercent,
    discountCents,
    totalCents: subtotalCents - discountCents,
    createdAt: new Date().toISOString(),
  };
  return { ok: true, data: store.insertInvoice(invoice) };
}
