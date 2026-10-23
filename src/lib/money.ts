/**
 * All money is integer cents. Floating-point values never reach the store.
 */

export function lineTotalCents(quantity: number, unitCents: number): number {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new RangeError("quantity must be a positive integer");
  }
  if (!Number.isInteger(unitCents) || unitCents < 0) {
    throw new RangeError("unitCents must be a non-negative integer");
  }
  return quantity * unitCents;
}

export function sumCents(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** A percentage of an amount, rounded half up to the nearest cent. */
export function percentOfCents(amountCents: number, percent: number): number {
  if (percent < 0 || percent > 100) {
    throw new RangeError("percent must be between 0 and 100");
  }
  return Math.round((amountCents * percent) / 100);
}

export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
