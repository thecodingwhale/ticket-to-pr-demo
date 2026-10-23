---
id: 2
title: An invoice can be opened with another shop's invoice id
type: bug
severity: critical
module: billing
status: open
---

## Expected

A user only ever sees invoices that belong to their own shop. Any other invoice id behaves as if it does not exist.

## Actual

A service advisor at Pine Street Motors pasted an invoice id from a Northline Auto receipt into the invoice page and saw Northline's customer name, lines and totals.

## Steps to reproduce

1. As Northline Auto, create an invoice and copy its id.
2. Sign in as a Pine Street Motors service advisor.
3. Open the invoice by that id.
4. The invoice loads. Expected: "Invoice not found".

## Notes from the reporter

The invoice list is correct (it only shows our own invoices). It is only the direct link that leaks.
