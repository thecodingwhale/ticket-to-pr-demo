import { z } from "zod";

export const invoiceLineSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(120),
  quantity: z.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
  unitCents: z.number().int("Unit price must be whole cents").min(0, "Unit price cannot be negative"),
});

export const createInvoiceSchema = z.object({
  customer: z.string().trim().min(1, "Customer is required").max(80),
  lines: z.array(invoiceLineSchema).min(1, "An invoice needs at least one line"),
  discountPercent: z.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%").default(0),
});

export type CreateInvoiceInput = z.input<typeof createInvoiceSchema>;
export type CreateInvoice = z.output<typeof createInvoiceSchema>;
