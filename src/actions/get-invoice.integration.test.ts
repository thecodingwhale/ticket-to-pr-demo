import { beforeEach, describe, expect, it } from "vitest";
import type { Session } from "../auth/authorize";
import { resetStore } from "../db/store";
import { createInvoice } from "./create-invoice";
import { getInvoice, listInvoices } from "./get-invoice";

const advisor: Session = { userId: "u1", tenantId: "t_northline", role: "service_advisor" };

beforeEach(() => {
  const store = resetStore();
  store.seedTenant({ id: "t_northline", name: "Northline Auto", status: "active" });
  store.seedTenant({ id: "t_pine", name: "Pine Street Motors", status: "active" });
});

describe("getInvoice", () => {
  it("returns an invoice that belongs to the caller's tenant", async () => {
    const created = await createInvoice(advisor, {
      customer: "M. Santos",
      lines: [{ description: "Coolant flush", quantity: 1, unitCents: 6500 }],
    });
    if (!created.ok) throw new Error(created.error);
    const result = await getInvoice(advisor, created.data.id);
    expect(result).toEqual({ ok: true, data: created.data });
  });

  it("reports an unknown id as not found", async () => {
    expect(await getInvoice(advisor, "inv_missing")).toEqual({ ok: false, error: "Invoice not found" });
  });
});

describe("listInvoices", () => {
  it("lists only the caller's tenant", async () => {
    const pine: Session = { userId: "u9", tenantId: "t_pine", role: "admin" };
    const lines = [{ description: "Tyre rotation", quantity: 1, unitCents: 2500 }];
    await createInvoice(advisor, { customer: "A", lines });
    await createInvoice(pine, { customer: "B", lines });
    const result = await listInvoices(advisor);
    expect(result.ok && result.data.map((invoice) => invoice.customer)).toEqual(["A"]);
  });
});
