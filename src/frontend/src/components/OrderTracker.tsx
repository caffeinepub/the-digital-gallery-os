import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Package, Phone, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import type { CustomerOrder } from "../backend";
import { OrderStatus } from "../backend";
import { useActor } from "../hooks/useActor";
import { getBusinessProfile, getLocalOrders } from "../utils/localStorage";

interface Props {
  token: string;
}

type TrackingOrder = CustomerOrder & {
  customerPhone?: string;
  deliveryAddress?: string;
  billNumber?: number;
};

const STEPS = [
  { key: OrderStatus.pending, label: "Order Placed", icon: Clock },
  { key: OrderStatus.ready, label: "Ready for Pickup", icon: Package },
  { key: OrderStatus.delivered, label: "Delivered", icon: Truck },
];

const STATUS_STEP = {
  [OrderStatus.pending]: 0,
  [OrderStatus.ready]: 1,
  [OrderStatus.delivered]: 2,
};

const STATUS_COLOR = {
  [OrderStatus.pending]: "bg-amber-100 text-amber-800 border-amber-300",
  [OrderStatus.ready]: "bg-green-100 text-green-800 border-green-300",
  [OrderStatus.delivered]: "bg-gray-100 text-gray-700 border-gray-300",
};

const STATUS_LABEL = {
  [OrderStatus.pending]: "Pending",
  [OrderStatus.ready]: "Ready for Pickup",
  [OrderStatus.delivered]: "Delivered",
};

function LogoMark({ src, size = 56 }: { src: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt="Logo"
        style={{ width: size, height: size }}
        className="object-contain rounded-xl"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-xl bg-[#436B95] flex items-center justify-center"
    >
      <span className="text-white font-bold text-lg">DG</span>
    </div>
  );
}

export default function OrderTracker({ token }: Props) {
  const { actor, isFetching } = useActor();
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const profile = getBusinessProfile();

  useEffect(() => {
    if (isFetching) return;

    async function fetchOrder() {
      setLoading(true);
      // Try backend first
      if (actor) {
        try {
          const result = await actor.getOrderByToken(token);
          if (result) {
            setOrder(result as TrackingOrder);
            setLoading(false);
            return;
          }
        } catch {
          /* fall through to localStorage */
        }
      }
      // Fallback: search localStorage
      const localOrders = getLocalOrders() as TrackingOrder[];
      const found = localOrders.find(
        (o) =>
          (o as TrackingOrder & { trackingToken?: string }).trackingToken ===
          token,
      );
      if (found) {
        setOrder(found);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }

    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, isFetching, token]);

  const logoSrc = profile.logoBase64 || "";
  const businessName = profile.businessName || "The Digital Gallery by Emon";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f6] flex flex-col items-center justify-center p-6">
        <LogoMark src={logoSrc} size={56} />
        <p className="mt-4 text-sm text-[#8B8589] animate-pulse">
          Loading your order…
        </p>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-[#f8f7f6] flex flex-col items-center justify-center p-6 text-center">
        <LogoMark src={logoSrc} size={56} />
        <h1 className="mt-4 font-serif text-xl font-bold text-[#353935]">
          {businessName}
        </h1>
        <div className="mt-8 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-sm w-full">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <Package className="h-6 w-6 text-gray-400" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-[#353935]">
            Order Not Found
          </h2>
          <p className="mt-2 text-sm text-[#8B8589]">
            We couldn't find an order with this tracking link. Please check the
            link you received or contact us.
          </p>
          <a
            href="https://wa.me/919365246096"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#25D366" }}
          >
            <Phone className="h-4 w-4" /> Contact on WhatsApp
          </a>
        </div>
        <p className="mt-6 text-xs text-[#8B8589]">
          © {new Date().getFullYear()} {businessName}
        </p>
      </div>
    );
  }

  const currentStep = STATUS_STEP[order.status];
  const billLabel = (order as TrackingOrder).billNumber
    ? `#${String((order as TrackingOrder).billNumber).padStart(4, "0")}`
    : `#${String(order.id).slice(-4).padStart(4, "0")}`;
  const dateStr = new Date(
    Number(order.orderDate) / 1_000_000,
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#f8f7f6] pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <LogoMark src={logoSrc} size={36} />
        <div>
          <p className="font-serif text-sm font-bold text-[#353935] leading-tight">
            {businessName}
          </p>
          <p
            className="text-[10px] text-[#436B95]"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Order Tracking
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-4">
        {/* Status Hero Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-[#8B8589] font-medium">Order</p>
              <p className="text-lg font-bold font-mono text-[#436B95]">
                {billLabel}
              </p>
            </div>
            <Badge
              className={`${STATUS_COLOR[order.status]} border text-xs font-semibold px-3 py-1`}
            >
              {STATUS_LABEL[order.status]}
            </Badge>
          </div>

          {/* Progress stepper */}
          <div className="flex items-center mt-4">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx < currentStep;
              const isActive = idx === currentStep;
              return (
                <div key={step.key} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive
                          ? "bg-[#436B95] border-[#436B95] text-white"
                          : isCompleted
                            ? "bg-[#353935] border-[#353935] text-white"
                            : "bg-gray-100 border-gray-200 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <p
                      className={`text-[9px] font-medium mt-1.5 text-center leading-tight ${
                        isActive
                          ? "text-[#436B95]"
                          : isCompleted
                            ? "text-[#353935]"
                            : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mb-4 mx-1 ${
                        idx < currentStep ? "bg-[#353935]" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#436B95] mb-3">
            Order Details
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-[#8B8589]">Customer</span>
              <span className="text-xs font-semibold text-[#353935]">
                {order.customerName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-[#8B8589]">Date</span>
              <span className="text-xs text-[#353935]">{dateStr}</span>
            </div>
            {(order as TrackingOrder).deliveryAddress && (
              <div className="flex justify-between gap-2">
                <span className="text-xs text-[#8B8589] shrink-0">Address</span>
                <span className="text-xs text-[#353935] text-right">
                  {(order as TrackingOrder).deliveryAddress}
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B8589] mb-2">
              Items
            </p>
            <div className="space-y-1.5">
              {order.items.map((item, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: stable bill items
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-[#353935]">{item.size}</span>
                  <span className="text-xs text-[#8B8589]">
                    Qty {String(item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#436B95] mb-3">
            Payment
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-[#8B8589]">Total Amount</span>
              <span className="text-xs font-semibold text-[#353935]">
                ₹{order.totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-[#8B8589]">Advance Paid</span>
              <span className="text-xs font-semibold text-green-600">
                ₹{order.advancePaid.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between">
              <span className="text-xs font-bold text-[#353935]">
                Balance Due
              </span>
              <span
                className={`text-sm font-bold ${order.balanceDue > 0 ? "text-[#436B95]" : "text-green-600"}`}
              >
                {order.balanceDue > 0
                  ? `₹${order.balanceDue.toLocaleString("en-IN")}`
                  : "Fully Paid ✓"}
              </span>
            </div>
          </div>
        </div>

        {/* Contact */}
        <a
          href="https://wa.me/919365246096"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold text-white shadow-sm"
          style={{ background: "#25D366" }}
          data-ocid="tracker.contact_button"
        >
          <Phone className="h-4 w-4" /> Contact on WhatsApp
        </a>

        {/* T&C */}
        <p className="text-[10px] text-[#8B8589] text-center leading-relaxed px-2">
          T&C: IF THE CUSTOMER IS UNABLE TO RECEIVE THE ORDER, HE/SHE HAVE TO
          PAY THE MAKING COST DEPENDING ON THE ORDER
        </p>

        {/* Footer */}
        <p className="text-[10px] text-[#8B8589] text-center">
          📞 +91 93652 46096 · Basugaon · Kokrajhar · Bongaigaon · Barpeta Road
        </p>
        <p className="text-[10px] text-[#8B8589] text-center">
          © {new Date().getFullYear()} {businessName}
        </p>
      </div>
    </div>
  );
}
