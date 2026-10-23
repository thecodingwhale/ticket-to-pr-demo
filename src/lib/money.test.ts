import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { formatCents, lineTotalCents, percentOfCents, sumCents } from "./money";

describe("lineTotalCents", () => {
  it("multiplies quantity by unit price", () => {
    expect(lineTotalCents(3, 1250)).toBe(3750);
  });
  it("rejects a zero or fractional quantity", () => {
    expect(() => lineTotalCents(0, 100)).toThrow(RangeError);
    expect(() => lineTotalCents(1.5, 100)).toThrow(RangeError);
  });
  it("rejects a negative or fractional unit price", () => {
    expect(() => lineTotalCents(1, -1)).toThrow(RangeError);
    expect(() => lineTotalCents(1, 10.5)).toThrow(RangeError);
  });
});

describe("percentOfCents", () => {
  it("takes a percentage of an amount", () => {
    expect(percentOfCents(10000, 10)).toBe(1000);
  });
  it("rounds half up to the nearest cent", () => {
    expect(percentOfCents(3333, 10)).toBe(333);
    expect(percentOfCents(1005, 50)).toBe(503);
  });
  it("rejects a percentage outside 0 to 100", () => {
    expect(() => percentOfCents(100, -1)).toThrow(RangeError);
    expect(() => percentOfCents(100, 101)).toThrow(RangeError);
  });
  it("never exceeds the amount and returns the whole amount at 100%", () => {
    fc.assert(
      fc.property(fc.nat({ max: 10_000_000 }), fc.integer({ min: 0, max: 100 }), (amount, percent) => {
        const result = percentOfCents(amount, percent);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(amount);
        expect(Number.isInteger(result)).toBe(true);
      }),
    );
    fc.assert(fc.property(fc.nat({ max: 10_000_000 }), (amount) => percentOfCents(amount, 100) === amount));
  });
});

describe("sumCents and formatCents", () => {
  it("sums an empty list to zero", () => {
    expect(sumCents([])).toBe(0);
  });
  it("formats cents as currency", () => {
    expect(formatCents(123456)).toBe("$1,234.56");
  });
});
