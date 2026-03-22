import { Button } from "@/components/ui/button";
import { MessageCircle, Printer, Share2, X } from "lucide-react";
import ReactDOM from "react-dom";
import { toast } from "sonner";
import { getBusinessProfile } from "../utils/localStorage";

interface ThermalBillOrder {
  id: bigint;
  customerName: string;
  customerPhone?: string;
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
  onClose: () => void;
}

export default function ThermalBill({
  order,
  discount = 0,
  onClose,
}: ThermalBillProps) {
  const profile = getBusinessProfile();
  const billNo = String(order.id).padStart(4, "0");
  const dateStr = new Date(
    Number(order.orderDate) / 1_000_000,
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const netAmount = order.totalAmount;
  const subtotal = netAmount + discount;

  const handleShareAsImage = async () => {
    const el = document.getElementById("thermal-bill-capture");
    if (!el) return;
    // Load html2canvas from CDN if not bundled
    let html2canvas: (
      el: HTMLElement,
      opts?: object,
    ) => Promise<HTMLCanvasElement>;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod =
        (await (window as any).loadHtml2Canvas?.()) ??
        new Promise<any>((res, rej) => {
          if ((window as any).html2canvas) {
            res((window as any).html2canvas);
            return;
          }
          const s = document.createElement("script");
          s.src =
            "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
          s.onload = () => res((window as any).html2canvas);
          s.onerror = rej;
          document.head.appendChild(s);
        });
      html2canvas = mod;
    } catch {
      toast.error(
        "Could not load image export library. Try copying bill text instead.",
      );
      return;
    }
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    let quality = 0.85;
    let blob: Blob | null = null as Blob | null;
    await new Promise<void>((resolve) => {
      canvas.toBlob(
        (b) => {
          blob = b;
          resolve();
        },
        "image/jpeg",
        quality,
      );
    });
    if (blob && blob.size > 1.5 * 1024 * 1024) {
      quality = 0.6;
      await new Promise<void>((resolve) => {
        canvas.toBlob(
          (b) => {
            blob = b;
            resolve();
          },
          "image/jpeg",
          quality,
        );
      });
    }
    if (!blob) return;
    const file = new File([blob], `bill-${billNo}.jpg`, { type: "image/jpeg" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Bill #${billNo} - ${order.customerName}`,
        });
        return;
      } catch {
        /* cancelled */
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bill-${billNo}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    if (!order.customerPhone) return;
    const itemLabel = order.items[0]?.size ?? "frame";
    const msg = `Hi ${order.customerName}, your order for ${itemLabel} is confirmed! Total: ₹${netAmount}, Advance: ₹${order.advancePaid}, Balance: ₹${order.balanceDue}. Thanks, Emon — The Digital Gallery. 📞 +91 93652 46096`;
    const phone = order.customerPhone.replace(/\D/g, "");
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

  const logoSrc = profile.logoBase64 || "";

  const receiptContent = (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #thermal-bill-print-root { display: block !important; position: fixed; top: 0; left: 0; width: 80mm; background: white; }
        }
      `}</style>

      <div id="thermal-bill-print-root" style={{ display: "none" }}>
        <div
          style={{
            width: "80mm",
            padding: "8px",
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#000",
            background: "#fff",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "6px" }}>
            {logoSrc && (
              <img
                src={logoSrc}
                alt="Logo"
                style={{
                  width: "40px",
                  height: "40px",
                  objectFit: "contain",
                  margin: "0 auto 4px",
                }}
              />
            )}
            <div
              style={{
                fontSize: "13px",
                fontWeight: "bold",
                letterSpacing: "0.5px",
              }}
            >
              {profile.businessName || "THE DIGITAL GALLERY BY EMON"}
            </div>
            <div style={{ fontSize: "10px", marginTop: "2px" }}>
              Premium Custom Framing
            </div>
            <div style={{ fontSize: "10px" }}>
              {profile.phone || "+91 93652 46096"}
            </div>
          </div>
          <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "2px",
            }}
          >
            <span>Bill No: #{billNo}</span>
            <span>{dateStr}</span>
          </div>
          <div style={{ marginBottom: "2px" }}>
            Customer: {order.customerName}
          </div>
          {order.customerPhone && (
            <div style={{ marginBottom: "4px" }}>
              Phone: {order.customerPhone}
            </div>
          )}
          <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              marginBottom: "2px",
            }}
          >
            <span style={{ flex: 2 }}>ITEM</span>
            <span style={{ flex: 0.5, textAlign: "center" }}>QTY</span>
            <span style={{ flex: 1, textAlign: "right" }}>PRICE</span>
          </div>
          <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
          {order.items.map((item) => (
            <div
              key={`${item.size}-${String(item.quantity)}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span style={{ flex: 2 }}>{item.size}</span>
              <span style={{ flex: 0.5, textAlign: "center" }}>
                {String(item.quantity)}
              </span>
              <span style={{ flex: 1, textAlign: "right" }}>
                ₹{item.unitPrice.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
          <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
          {discount > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "2px",
                }}
              >
                <span>Subtotal:</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "2px",
                }}
              >
                <span>Discount:</span>
                <span>-₹{discount.toLocaleString("en-IN")}</span>
              </div>
            </>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "2px",
            }}
          >
            <span>Net Amount:</span>
            <span>₹{netAmount.toLocaleString("en-IN")}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <span>Advance Paid:</span>
            <span>-₹{order.advancePaid.toLocaleString("en-IN")}</span>
          </div>
          <div style={{ borderTop: "2px solid #000", margin: "6px 0" }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              fontSize: "13px",
              marginBottom: "4px",
            }}
          >
            <span>BALANCE DUE:</span>
            <span>₹{order.balanceDue.toLocaleString("en-IN")}</span>
          </div>
          <div style={{ borderTop: "2px solid #000", margin: "6px 0" }} />
          <div
            style={{ textAlign: "center", marginTop: "6px", fontSize: "10px" }}
          >
            <div>WhatsApp: +91 93652 46096</div>
            <div style={{ marginTop: "2px" }}>{locations.join(" | ")}</div>
            <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
            <div>Thank you for your business!</div>
            <div>{profile.businessName || "The Digital Gallery by Emon"}</div>
          </div>
        </div>
      </div>
    </>
  );

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      data-ocid="thermal.modal"
    >
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

        <div
          id="thermal-bill-capture"
          className="bg-white rounded border border-gray-200 font-mono text-black text-xs overflow-hidden"
          style={{ maxWidth: "320px", margin: "0 auto" }}
        >
          {/* Logo + header */}
          <div className="text-center px-4 pt-5 pb-3">
            {logoSrc && (
              <img
                src={logoSrc}
                alt="Logo"
                className="w-12 h-12 object-contain mx-auto mb-2"
              />
            )}
            <div className="font-bold text-sm tracking-wider uppercase">
              {profile.businessName || "THE DIGITAL GALLERY BY EMON"}
            </div>
            <div className="text-xs mt-0.5 text-gray-600">
              Premium Custom Framing
            </div>
            <div className="text-xs text-gray-500">
              {profile.phone || "+91 93652 46096"}
            </div>
          </div>

          <div className="border-t border-dashed border-gray-400 mx-3" />

          <div className="px-4 py-2 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-gray-600">
                Bill No:{" "}
                <span className="text-black font-semibold">#{billNo}</span>
              </span>
              <span className="text-gray-600">{dateStr}</span>
            </div>
            <div>
              Customer:{" "}
              <span className="font-semibold">{order.customerName}</span>
            </div>
            {order.customerPhone && (
              <div className="text-gray-600">Phone: {order.customerPhone}</div>
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
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span>-₹{discount.toLocaleString("en-IN")}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Net Amount:</span>
              <span className="font-semibold">
                ₹{netAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Advance Paid:</span>
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

          <div className="text-center px-4 py-3 text-xs text-gray-600">
            <div>WhatsApp: +91 93652 46096</div>
            <div className="mt-0.5">{locations.join(" | ")}</div>
            <div className="border-t border-dashed border-gray-300 my-2" />
            <div className="text-gray-500">Thank you for your business!</div>
            <div className="font-semibold text-black">
              {profile.businessName || "The Digital Gallery by Emon"}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Button
            onClick={handlePrint}
            className="flex-1 bg-[#353935] hover:bg-[#1e211e] text-white font-medium h-10 rounded-lg"
            data-ocid="thermal.print_button"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Bill
          </Button>
          <Button
            onClick={handleShareAsImage}
            className="flex-1 bg-[#436B95] hover:bg-[#355578] text-white font-medium h-10 rounded-lg"
            data-ocid="thermal.share_button"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Image
          </Button>
          {order.customerPhone && (
            <Button
              onClick={handleWhatsApp}
              className="flex-1 text-white font-medium h-10 rounded-lg"
              style={{ background: "#25D366" }}
              data-ocid="thermal.secondary_button"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    <>
      {receiptContent}
      {modalContent}
    </>,
    document.body,
  );
}
