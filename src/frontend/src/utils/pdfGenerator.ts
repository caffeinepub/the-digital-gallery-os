import type { CustomerOrder } from "../backend";
import { getBusinessProfile } from "./localStorage";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jspdf: { jsPDF: new (...args: any[]) => any };
  }
}

export function generateReceipt(
  order: CustomerOrder,
  logoBase64?: string,
  discount?: number,
) {
  const JsPDF = window.jspdf?.jsPDF;
  if (!JsPDF) {
    alert("PDF library not loaded. Please check your internet connection.");
    return;
  }

  const profile = getBusinessProfile();
  const effectiveLogo = logoBase64 || profile.logoBase64 || "";
  const businessName = profile.businessName || "The Digital Gallery by Emon";
  const pickupLocations =
    profile.pickupLocations || "Basugaon, Kokrajhar, Bongaigaon, Barpeta Road";
  const phone = profile.phone || "+91 93652 46096";
  const pickupPoints = pickupLocations
    .split(",")
    .map((s) => s.trim())
    .join("  •  ");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = new JsPDF({ unit: "mm", format: "a4" }) as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = margin;

  // ---- Header ----
  if (effectiveLogo) {
    try {
      doc.addImage(effectiveLogo, "PNG", margin, y, 24, 24);
    } catch {
      // ignore bad image
    }
  }
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(31, 31, 31);
  doc.text(businessName, effectiveLogo ? margin + 28 : pageWidth / 2, y + 10, {
    align: effectiveLogo ? "left" : "center",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text(
    "Premium Custom Framing",
    effectiveLogo ? margin + 28 : pageWidth / 2,
    y + 17,
    { align: effectiveLogo ? "left" : "center" },
  );

  y += 32;

  // Gold divider
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ---- Receipt Title ----
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.setTextColor(31, 31, 31);
  doc.text("ORDER RECEIPT", pageWidth / 2, y, { align: "center" });
  y += 8;

  // ---- Order Info ----
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(31, 31, 31);

  const orderDate = new Date(
    Number(order.orderDate) / 1_000_000,
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  doc.text(`Customer: ${order.customerName}`, margin, y);
  doc.text(`Order Date: ${orderDate}`, pageWidth - margin, y, {
    align: "right",
  });
  y += 5;
  doc.setTextColor(110, 110, 110);
  doc.text(`Order ID: #${String(order.id).padStart(4, "0")}`, margin, y);
  y += 8;

  // ---- Items Table ----
  doc.setDrawColor(230, 224, 214);
  doc.setLineWidth(0.3);

  const colWidths = [55, 30, 15, 35, 35];
  const colX = [margin];
  for (let i = 1; i < colWidths.length; i++) {
    colX.push(colX[i - 1] + colWidths[i - 1]);
  }
  const headers = ["Frame Size", "Thickness", "Qty", "Unit Price", "Total"];
  const tableAligns: ("left" | "right")[] = [
    "left",
    "left",
    "left",
    "right",
    "right",
  ];

  doc.setFillColor(243, 230, 184);
  doc.rect(margin, y, pageWidth - margin * 2, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(138, 107, 18);
  headers.forEach((h, i) => {
    const xPos =
      tableAligns[i] === "right" ? colX[i] + colWidths[i] - 2 : colX[i] + 2;
    doc.text(h, xPos, y + 5.5, { align: tableAligns[i] });
  });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(31, 31, 31);
  order.items.forEach((item, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(249, 246, 240);
      doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
    }
    const rowData = [
      item.size,
      `${item.thickness}"`,
      String(item.quantity),
      `₹${item.unitPrice.toLocaleString("en-IN")}`,
      `₹${(item.unitPrice * Number(item.quantity)).toLocaleString("en-IN")}`,
    ];
    rowData.forEach((d, i) => {
      const xPos =
        tableAligns[i] === "right" ? colX[i] + colWidths[i] - 2 : colX[i] + 2;
      doc.text(d, xPos, y + 4.5, { align: tableAligns[i] });
    });
    doc.setDrawColor(230, 224, 214);
    doc.line(margin, y + 7, pageWidth - margin, y + 7);
    y += 7;
  });
  y += 6;

  // ---- Summary ----
  const summaryX = pageWidth - margin - 60;
  const discountVal = discount && discount > 0 ? discount : 0;
  const summaryHeight = discountVal > 0 ? 36 : 28;
  doc.setFillColor(249, 246, 240);
  doc.rect(summaryX - 4, y - 2, 64, summaryHeight, "F");
  doc.setDrawColor(212, 175, 55);
  doc.rect(summaryX - 4, y - 2, 64, summaryHeight);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text("Total Amount:", summaryX, y + 4);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 31, 31);
  doc.text(
    `₹${order.totalAmount.toLocaleString("en-IN")}`,
    pageWidth - margin,
    y + 4,
    { align: "right" },
  );

  let summaryY = y + 11;
  if (discountVal > 0) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    doc.text("Discount:", summaryX, summaryY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 50, 50);
    doc.text(
      `-₹${discountVal.toLocaleString("en-IN")}`,
      pageWidth - margin,
      summaryY,
      { align: "right" },
    );
    summaryY += 7;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    doc.text("Net Amount:", summaryX, summaryY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 31, 31);
    doc.text(
      `₹${order.totalAmount.toLocaleString("en-IN")}`,
      pageWidth - margin,
      summaryY,
      { align: "right" },
    );
    summaryY += 7;
  } else {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    doc.text("Advance Paid:", summaryX, summaryY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 31, 31);
    doc.text(
      `₹${order.advancePaid.toLocaleString("en-IN")}`,
      pageWidth - margin,
      summaryY,
      { align: "right" },
    );
    summaryY += 7;
  }

  // Balance row
  doc.setFillColor(212, 175, 55);
  doc.rect(summaryX - 4, y + summaryHeight - 12, 64, 10, "F");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("Balance Due:", summaryX, y + summaryHeight - 5);
  doc.text(
    `₹${order.balanceDue.toLocaleString("en-IN")}`,
    pageWidth - margin,
    y + summaryHeight - 5,
    { align: "right" },
  );
  y += summaryHeight + 14;

  // ---- Digital Signature ----
  const sigBoxWidth = 60;
  const sigBoxX = (pageWidth - sigBoxWidth) / 2;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.setFillColor(250, 250, 250);
  doc.rect(sigBoxX, y, sigBoxWidth, 28, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text(businessName, pageWidth / 2, y + 5, { align: "center" });

  if (effectiveLogo) {
    try {
      doc.addImage(effectiveLogo, "PNG", pageWidth / 2 - 7.5, y + 6, 15, 15);
    } catch {
      // ignore
    }
  }

  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);
  doc.line(sigBoxX + 5, y + 23, sigBoxX + sigBoxWidth - 5, y + 23);

  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Authorized Signatory", pageWidth / 2, y + 27, { align: "center" });
  y += 36;

  // ---- Footer ----
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(`WhatsApp: ${phone}`, pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.text(`Pickup Points: ${pickupPoints}`, pageWidth / 2, y, {
    align: "center",
  });
  y += 5;
  doc.setTextColor(212, 175, 55);
  doc.text(
    "Thank you for supporting a local business! Visit us again at The Digital Gallery.",
    pageWidth / 2,
    y,
    { align: "center" },
  );

  const customerSlug = order.customerName.replace(/\s+/g, "-").toLowerCase();
  doc.save(`receipt-${customerSlug}-${String(order.id)}.pdf`);
}
