/**
 * An in-memory stand-in for the database.
 *
 * In production this layer is Postgres with row-level security, and tenant
 * isolation is enforced by the database. The demo keeps the same shape so the
 * scoping rules in CLAUDE.md can be tested without a database running.
 */
export type TenantStatus = "active" | "suspended";

export interface Tenant {
  id: string;
  name: string;
  status: TenantStatus;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitCents: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  number: string;
  customer: string;
  lines: InvoiceLine[];
  subtotalCents: number;
  discountPercent: number;
  discountCents: number;
  totalCents: number;
  createdAt: string;
}

export class Store {
  readonly tenants = new Map<string, Tenant>();
  readonly invoices = new Map<string, Invoice>();
  private sequence = 1000;

  seedTenant(tenant: Tenant): Tenant {
    this.tenants.set(tenant.id, tenant);
    return tenant;
  }

  nextInvoiceNumber(): string {
    this.sequence += 1;
    return `INV-${this.sequence}`;
  }

  nextId(): string {
    return `inv_${Math.random().toString(36).slice(2, 10)}`;
  }

  insertInvoice(invoice: Invoice): Invoice {
    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  findInvoice(id: string): Invoice | undefined {
    return this.invoices.get(id);
  }

  listInvoices(tenantId: string): Invoice[] {
    return [...this.invoices.values()].filter((invoice) => invoice.tenantId === tenantId);
  }
}

let current: Store | undefined;

/** The process-wide store, created on first use. */
export function getStore(): Store {
  current ??= new Store();
  return current;
}

/** Replace the store with an empty one. Tests call this in `beforeEach`. */
export function resetStore(): Store {
  current = new Store();
  return current;
}
