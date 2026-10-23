import { describe, expect, it } from "vitest";
import { createInvoiceSchema } from "./invoice";

const valid = {
  customer: "Northline Auto",
  lines: [{ description: "Oil change", quantity: 1, unitCents: 4500 }],
  discountPercent: 10,
};

function firstMessage(input: unknown): string | undefined {
  const result = createInvoiceSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe("createInvoiceSchema", () => {
  it("accepts a valid invoice and defaults the discount to zero", () => {
    const result = createInvoiceSchema.parse({ customer: " Pine Street Motors ", lines: valid.lines });
    expect(result.customer).toBe("Pine Street Motors");
    expect(result.discountPercent).toBe(0);
  });
  it("requires a customer", () => {
    expect(firstMessage({ ...valid, customer: "   " })).toBe("Customer is required");
  });
  it("requires at least one line", () => {
    expect(firstMessage({ ...valid, lines: [] })).toBe("An invoice needs at least one line");
  });
  it("rejects a fractional quantity", () => {
    expect(firstMessage({ ...valid, lines: [{ ...valid.lines[0], quantity: 1.5 }] })).toBe(
      "Quantity must be a whole number",
    );
  });
  it("rejects a negative unit price", () => {
    expect(firstMessage({ ...valid, lines: [{ ...valid.lines[0], unitCents: -1 }] })).toBe(
      "Unit price cannot be negative",
    );
  });
  it("rejects a discount above 100%", () => {
    expect(firstMessage({ ...valid, discountPercent: 101 })).toBe("Discount cannot exceed 100%");
  });
});
