import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageCircle, Printer, Share2, X } from "lucide-react";
import ReactDOM from "react-dom";
import { toast } from "sonner";
import { getBusinessProfile } from "../utils/localStorage";

interface ThermalBillOrder {
  id: bigint;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  orderDate: bigint;
  items: Array<{
    size: string;
    thickness: number;
    quantity: bigint;
    unitPrice: number;
  }>;
}

interface ThermalBillProps {
  order: ThermalBillOrder;
  discount?: number;
  billNumber?: number;
  onClose: () => void;
}

// Draws the bill on a canvas and returns a Blob — no external library needed
async function generateBillCanvas(
  order: ThermalBillOrder,
  billNo: string,
  dateStr: string,
  netAmount: number,
  discount: number,
  logoSrc: string,
  profile: ReturnType<typeof getBusinessProfile>,
): Promise<Blob | null> {
  const W = 400;
  const lineH = 20;
  const pad = 24;

  // Calculate total height needed
  const headerH = logoSrc ? 140 : 90;
  const infoH = 80 + (order.deliveryAddress ? 30 : 0);
  const itemsH = order.items.length * 28 + 40;
  const totalsH = discount > 0 ? 120 : 80;
  const footerH = 80;
  const H = headerH + infoH + itemsH + totalsH + footerH + 40;

  const canvas = document.createElement("canvas");
  const dpr = 2;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  let y = pad;

  // Draw logo if available
  if (logoSrc) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const size = 56;
        ctx.drawImage(img, W / 2 - size / 2, y, size, size);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = logoSrc;
    });
    y += 64;
  }

  // Business name
  ctx.fillStyle = "#000000";
  ctx.font = "bold 15px monospace";
  ctx.textAlign = "center";
  const bizName = (
    profile.businessName || "THE DIGITAL GALLERY BY EMON"
  ).toUpperCase();
  ctx.fillText(bizName, W / 2, y);
  y += lineH;
  ctx.font = "11px monospace";
  ctx.fillStyle = "#555555";
  ctx.fillText("Premium Custom Framing", W / 2, y);
  y += lineH - 2;
  ctx.fillText(profile.phone || "+91 93652 46096", W / 2, y);
  y += lineH + 4;

  // Dashed separator
  const dashes = (n: number) => Array(n).fill("-").join("");
  ctx.fillStyle = "#000000";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(dashes(44), W / 2, y);
  y += lineH;

  // Bill info
  ctx.textAlign = "left";
  ctx.fillStyle = "#000000";
  ctx.font = "11px monospace";
  ctx.fillText(`Bill No: #${billNo}`, pad, y);
  ctx.textAlign = "right";
  ctx.fillText(dateStr, W - pad, y);
  y += lineH;

  ctx.textAlign = "left";
  ctx.fillText(`Customer: ${order.customerName}`, pad, y);
  y += lineH;
  if (order.customerPhone) {
    ctx.fillText(`Phone: ${order.customerPhone}`, pad, y);
    y += lineH;
  }
  if (order.deliveryAddress) {
    ctx.fillText(`Deliver to: ${order.deliveryAddress}`, pad, y);
    y += lineH;
  }
  y += 4;

  // Dashed separator
  ctx.textAlign = "center";
  ctx.fillText(dashes(44), W / 2, y);
  y += lineH;

  // Items header
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.fillText("ITEM", pad, y);
  ctx.textAlign = "center";
  ctx.fillText("QTY", W / 2, y);
  ctx.textAlign = "right";
  ctx.fillText("PRICE", W - pad, y);
  y += 4;
  ctx.textAlign = "center";
  ctx.font = "11px monospace";
  ctx.fillText(dashes(44), W / 2, y);
  y += lineH;

  // Items
  for (const item of order.items) {
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(item.size, pad, y);
    ctx.textAlign = "center";
    ctx.fillText(String(item.quantity), W / 2, y);
    ctx.textAlign = "right";
    ctx.fillText(`\u20B9${item.unitPrice.toLocaleString("en-IN")}`, W - pad, y);
    y += lineH + 4;
  }

  // Dashed separator
  ctx.textAlign = "center";
  ctx.fillText(dashes(44), W / 2, y);
  y += lineH;

  // Totals
  if (discount > 0) {
    const subtotal = netAmount + discount;
    ctx.textAlign = "left";
    ctx.fillText("Subtotal:", pad, y);
    ctx.textAlign = "right";
    ctx.fillText(`\u20B9${subtotal.toLocaleString("en-IN")}`, W - pad, y);
    y += lineH;
    ctx.textAlign = "left";
    ctx.fillText("Discount:", pad, y);
    ctx.textAlign = "right";
    ctx.fillText(`-\u20B9${discount.toLocaleString("en-IN")}`, W - pad, y);
    y += lineH;
  }

  ctx.textAlign = "left";
  ctx.fillText("Net Amount:", pad, y);
  ctx.textAlign = "right";
  ctx.font = "bold 11px monospace";
  ctx.fillText(`\u20B9${netAmount.toLocaleString("en-IN")}`, W - pad, y);
  y += lineH;

  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText("Advance Paid:", pad, y);
  ctx.textAlign = "right";
  ctx.fillText(
    `-\u20B9${order.advancePaid.toLocaleString("en-IN")}`,
    W - pad,
    y,
  );
  y += lineH;

  // Bold separator
  ctx.fillStyle = "#000000";
  ctx.fillRect(pad, y, W - pad * 2, 2);
  y += 10;

  // Balance due
  ctx.font = "bold 15px monospace";
  ctx.textAlign = "left";
  ctx.fillText("BALANCE DUE:", pad, y);
  ctx.textAlign = "right";
  ctx.fillText(`\u20B9${order.balanceDue.toLocaleString("en-IN")}`, W - pad, y);
  y += lineH;

  ctx.fillRect(pad, y, W - pad * 2, 2);
  y += 12;

  // Footer
  ctx.font = "10px monospace";
  ctx.fillStyle = "#555555";
  ctx.textAlign = "center";
  ctx.fillText("WhatsApp: +91 93652 46096", W / 2, y);
  y += lineH - 2;

  const locs = (
    profile.pickupLocations || "Basugaon, Kokrajhar, Bongaigaon, Barpeta Road"
  )
    .split(",")
    .map((s) => s.trim())
    .join(" | ");
  ctx.fillText(locs, W / 2, y);
  y += lineH - 2;

  ctx.fillText(dashes(44), W / 2, y);
  y += lineH - 2;

  ctx.fillText("Thank you for your business!", W / 2, y);
  y += lineH - 2;

  ctx.font = "bold 10px monospace";
  ctx.fillStyle = "#000000";
  ctx.fillText(profile.businessName || "The Digital Gallery by Emon", W / 2, y);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
  });
}

export default function ThermalBill({
  order,
  discount = 0,
  billNumber,
  onClose,
}: ThermalBillProps) {
  const profile = getBusinessProfile();
  const billNo = billNumber
    ? String(billNumber).padStart(4, "0")
    : String(order.id).slice(-4).padStart(4, "0");
  const dateStr = new Date(
    Number(order.orderDate) / 1_000_000,
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const netAmount = order.totalAmount;
  const subtotal = netAmount + discount;

  const logoSrc = profile.logoBase64 || "";

  // Share bill as image using native Canvas API (no html2canvas needed)
  const handleShareAsImage = async () => {
    const toastId = toast.loading("Generating bill image...");
    try {
      const blob = await generateBillCanvas(
        order,
        billNo,
        dateStr,
        netAmount,
        discount,
        logoSrc,
        profile,
      );

      toast.dismiss(toastId);

      if (!blob) {
        toast.error("Failed to generate image.");
        return;
      }

      const file = new File([blob], `bill-${billNo}.jpg`, {
        type: "image/jpeg",
      });

      // Try Web Share API (works on mobile)
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Bill #${billNo} - ${order.customerName}`,
          });
          return;
        } catch (e: unknown) {
          // If user cancelled (AbortError), don't fall through to download
          if (e instanceof Error && e.name === "AbortError") return;
        }
      }

      // Fallback: download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bill-${billNo}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Bill image saved to downloads!");
    } catch {
      toast.dismiss(toastId);
      toast.error("Could not generate image. Try printing instead.");
    }
  };

  const handlePrint = () => window.print();

  // Order confirmation template message
  const handleSendConfirmation = () => {
    const phone = (order.customerPhone || "").replace(/\D/g, "");
    if (!phone) {
      toast.error("No phone number for this customer.");
      return;
    }
    const itemLabel = order.items[0]?.size ?? "your order";
    const msg = `Order Confirmed! ✅\nHi ${order.customerName}, your order for ${itemLabel} is confirmed with The Digital Gallery by Emon.\n\nTotal: ₹${netAmount.toLocaleString("en-IN")}\nAdvance: ₹${order.advancePaid.toLocaleString("en-IN")}\nBalance: ₹${order.balanceDue.toLocaleString("en-IN")}\n\n📍 Pickup Info: We provide pickup points in Basugaon, Kokrajhar, Bongaigaon, and Barpeta Road. I will message you to coordinate the exact meeting spot once your order is ready!\n\nThanks,\nEmon\nThe Digital Gallery\n📞 +91 9365246096`;
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  const locations = (
    profile.pickupLocations || "Basugaon, Kokrajhar, Bongaigaon, Barpeta Road"
  )
    .split(",")
    .map((s) => s.trim());

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      data-ocid="thermal.modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="button"
        tabIndex={-1}
        aria-label="Close"
      />

      <div className="relative z-10 w-full max-w-xs">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
          data-ocid="thermal.close_button"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Bill preview */}
        <div
          id="thermal-bill-capture"
          className="bg-white rounded border border-gray-200 font-mono text-black text-xs overflow-hidden"
          style={{ maxWidth: "320px", margin: "0 auto" }}
        >
          {/* Header */}
          <div className="text-center px-4 pt-5 pb-3">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt="Logo"
                className="w-14 h-14 object-contain mx-auto mb-2 rounded"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#436B95]/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-[#436B95] font-bold text-lg">DG</span>
              </div>
            )}
            <div className="font-bold text-sm tracking-wider uppercase">
              {profile.businessName || "THE DIGITAL GALLERY BY EMON"}
            </div>
            <div className="text-xs mt-0.5 text-gray-500">
              Premium Custom Framing
            </div>
            <div className="text-xs text-gray-500">
              {profile.phone || "+91 93652 46096"}
            </div>
          </div>

          <div className="border-t border-dashed border-gray-400 mx-3" />

          <div className="px-4 py-2 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-gray-500">
                Bill No: <span className="text-black font-bold">#{billNo}</span>
              </span>
              <span className="text-gray-500">{dateStr}</span>
            </div>
            <div>
              Customer:{" "}
              <span className="font-semibold">{order.customerName}</span>
            </div>
            {order.customerPhone && (
              <div className="text-gray-500">Phone: {order.customerPhone}</div>
            )}
            {order.deliveryAddress && (
              <div className="text-gray-500 leading-snug">
                Deliver to:{" "}
                <span className="text-black">{order.deliveryAddress}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-400 mx-3" />

          <div className="px-4 py-2">
            <div className="flex justify-between font-bold text-xs uppercase mb-1">
              <span className="flex-1">Item</span>
              <span className="w-8 text-center">Qty</span>
              <span className="w-20 text-right">Price</span>
            </div>
            <div className="border-t border-dashed border-gray-300 mb-2" />
            {order.items.map((item) => (
              <div
                key={`${item.size}-${String(item.quantity)}`}
                className="flex justify-between mb-1.5"
              >
                <span className="flex-1 pr-2 leading-tight">{item.size}</span>
                <span className="w-8 text-center">{String(item.quantity)}</span>
                <span className="w-20 text-right">
                  ₹{item.unitPrice.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-400 mx-3" />

          <div className="px-4 py-2 space-y-0.5">
            {discount > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal:</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount:</span>
                  <span>-₹{discount.toLocaleString("en-IN")}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Net Amount:</span>
              <span className="font-semibold">
                ₹{netAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Advance Paid:</span>
              <span>-₹{order.advancePaid.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="border-t-2 border-black mx-3" />
          <div className="px-4 py-2">
            <div className="flex justify-between font-bold text-sm">
              <span>BALANCE DUE:</span>
              <span>₹{order.balanceDue.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div className="border-t-2 border-black mx-3" />

          <div className="text-center px-4 py-3 text-xs text-gray-500">
            <div>WhatsApp: +91 93652 46096</div>
            <div className="mt-0.5">{locations.join(" | ")}</div>
            <div className="border-t border-dashed border-gray-300 my-2" />
            <div>Thank you for your business!</div>
            <div className="font-semibold text-black">
              {profile.businessName || "The Digital Gallery by Emon"}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button
            onClick={handlePrint}
            className="bg-[#353935] hover:bg-[#1e211e] text-white font-medium h-10 rounded-lg text-xs"
            data-ocid="thermal.print_button"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print Bill
          </Button>
          <Button
            onClick={handleShareAsImage}
            className="bg-[#436B95] hover:bg-[#355578] text-white font-medium h-10 rounded-lg text-xs"
            data-ocid="thermal.share_button"
          >
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            Share Image
          </Button>
          {order.customerPhone && (
            <>
              <Button
                onClick={handleSendConfirmation}
                className="text-white font-medium h-10 rounded-lg text-xs"
                style={{ background: "#25D366" }}
                data-ocid="thermal.confirm_button"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Order Confirmed
              </Button>
              <Button
                onClick={() => {
                  const phone = (order.customerPhone || "").replace(/\D/g, "");
                  const msg = `Hi ${order.customerName}, your bill #${billNo} is ready. Total: ₹${netAmount.toLocaleString("en-IN")}, Balance: ₹${order.balanceDue.toLocaleString("en-IN")}. - The Digital Gallery, Emon. 📞 +91 93652 46096`;
                  window.open(
                    `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
                    "_blank",
                  );
                }}
                variant="outline"
                className="h-10 rounded-lg text-xs border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
                data-ocid="thermal.whatsapp_button"
              >
                <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                WhatsApp
              </Button>
            </>
          )}
        </div>

        {/* Print styles */}
        <style>{`
          @media print {
            body > * { display: none !important; }
            #thermal-bill-capture { display: block !important; position: fixed; top: 0; left: 0; width: 80mm; background: white; }
          }
        `}</style>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
