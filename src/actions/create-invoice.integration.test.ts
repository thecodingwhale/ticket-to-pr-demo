import { beforeEach, describe, expect, it } from "vitest";
import type { Session } from "../auth/authorize";
import { resetStore } from "../db/store";
import { createInvoice } from "./create-invoice";

const advisor: Session = { userId: "u1", tenantId: "t_northline", role: "service_advisor" };
const technician: Session = { userId: "u2", tenantId: "t_northline", role: "technician" };
const suspended: Session = { userId: "u3", tenantId: "t_pine", role: "admin" };

beforeEach(() => {
  const store = resetStore();
  store.seedTenant({ id: "t_northline", name: "Northline Auto", status: "active" });
  store.seedTenant({ id: "t_pine", name: "Pine Street Motors", status: "suspended" });
});

describe("createInvoice", () => {
  it("stores the invoice with its totals, scoped to the caller's tenant", async () => {
    const result = await createInvoice(advisor, {
      customer: "J. Reyes",
      lines: [{ description: "Brake pads", quantity: 2, unitCents: 5000 }],
      discountPercent: 10,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      tenantId: "t_northline",
      number: "INV-1001",
      subtotalCents: 10000,
      discountCents: 1000,
      totalCents: 9000,
    });
  });

  it("rounds the discount once on the subtotal, not per line (ticket #1)", async () => {
    const filter = { quantity: 1, unitCents: 3333 };
    const result = await createInvoice(advisor, {
      customer: "Northline walk-in",
      lines: [
        { description: "Oil filter", ...filter },
        { description: "Air filter", ...filter },
        { description: "Cabin filter", ...filter },
      ],
      discountPercent: 10,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Subtotal $99.99; 10% is $9.999, which rounds half up to $10.00 and leaves $89.99.
    expect(result.data).toMatchObject({ subtotalCents: 9999, discountCents: 1000, totalCents: 8999 });
  });

  it("numbers invoices sequentially", async () => {
    const lines = [{ description: "Wiper blades", quantity: 1, unitCents: 1200 }];
    const first = await createInvoice(advisor, { customer: "A", lines });
    const second = await createInvoice(advisor, { customer: "B", lines });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect([first.data.number, second.data.number]).toEqual(["INV-1001", "INV-1002"]);
  });

  it("returns the validation message instead of throwing on bad input", async () => {
    const result = await createInvoice(advisor, { customer: "", lines: [] });
    expect(result).toEqual({ ok: false, error: "Customer is required; An invoice needs at least one line" });
  });

  it("refuses a technician", async () => {
    await expect(createInvoice(technician, { customer: "X", lines: [] })).rejects.toMatchObject({
      code: "forbidden",
    });
  });

  it("refuses a suspended tenant", async () => {
    await expect(createInvoice(suspended, { customer: "X", lines: [] })).rejects.toMatchObject({
      code: "read_only",
    });
  });
});
