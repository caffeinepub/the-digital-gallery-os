# The Digital Gallery OS

## Current State
- Smart Billing has a "Generate Receipt" button that downloads a PDF
- WhatsApp button already exists but is separate from bill generation
- "Add to Khatabook" saves the order; PDF generation is a separate step
- Khatabook has PDF buttons on each order row

## Requested Changes (Diff)

### Add
- ThermalBill modal/overlay component: displays a compact, modern B&W thermal receipt (3"x2" style)
  - Store name and tagline at top
  - Customer name, date, order ID
  - Item, qty, unit price, total in clean monospace layout
  - Dashed separators between sections
  - Net amount, advance paid, balance due summary
  - Footer: WhatsApp contact, pickup points, thank-you message
  - Two action buttons: Print (browser print, thermal-style CSS) and Send via WhatsApp
  - On print: hides all page UI except the thermal bill, uses print CSS for compact size
- Auto-save to Khatabook: when a bill is created (new primary action), it saves to Khatabook AND immediately opens the thermal bill view
- Customer phone stored alongside order in Khatabook for WhatsApp from ledger

### Modify
- SmartBilling: Replace "Add to Khatabook" + "Generate Receipt" (PDF) + separate WhatsApp button with single "Create Bill" primary action
  - On "Create Bill": saves to Khatabook, opens ThermalBill modal with Print + WhatsApp buttons
- Khatabook: Replace "PDF" button on each order with "Bill" button that opens ThermalBill modal for that order
- CustomerOrder data model in localStorage: add optional `customerPhone` field so WhatsApp can be sent from Khatabook too
- Remove PDF generator usage from billing flow (keep file but stop using it in billing; Khatabook bill buttons open ThermalBill instead)

### Remove
- "Generate Receipt" (PDF download) button from SmartBilling
- "PDF" button label in Khatabook replaced with "Bill" opening thermal view

## Implementation Plan
1. Create `src/frontend/src/components/ThermalBill.tsx` — modal with thermal receipt layout, Print button, WhatsApp button
2. Update `CustomerOrder` usage in localStorage to optionally include `customerPhone`
3. Update `SmartBilling.tsx` — merge Create Bill flow: save to Khatabook + open ThermalBill modal
4. Update `Khatabook.tsx` — replace PDF button with Bill button that opens ThermalBill modal
5. Add print CSS in `index.css` or inline for thermal-only print media
