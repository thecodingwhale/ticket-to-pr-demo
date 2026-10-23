---
id: 1
title: Discount on a multi-line invoice is short by a cent
type: bug
severity: minor
module: billing
status: open
---

## Expected

The discount on an invoice is a percentage of the invoice subtotal, rounded once, half up, to the nearest cent.

## Actual

On invoice INV-1007 at Northline Auto (three lines at $33.33, 10% discount) the discount shows $9.99 and the total $90.00. The subtotal is $99.99, so 10% is $9.999, which should round to $10.00 and leave a total of $89.99.

## Steps to reproduce

1. Sign in as a service advisor.
2. Create an invoice with three lines: Oil filter 1 × $33.33, Air filter 1 × $33.33, Cabin filter 1 × $33.33.
3. Set the discount to 10% and save.
4. The discount reads $9.99 and the total $90.00. Expected $10.00 and $89.99.

## Notes from the reporter

Single-line invoices are correct. It only shows up when the lines are odd amounts.
