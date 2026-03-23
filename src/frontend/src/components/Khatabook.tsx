import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Receipt,
  Share2,
  Trash2,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type CustomerOrder, OrderStatus } from "../backend";
import {
  useDeleteOrder,
  useGetAllOrders,
  useSettleBalance,
  useUpdateOrderStatus,
} from "../hooks/useQueries";
import ThermalBill from "./ThermalBill";

type LocalOrder = CustomerOrder & {
  customerPhone?: string;
  deliveryAddress?: string;
  billNumber?: number;
  trackingToken?: string;
};

const STATUS_CONFIG = {
  [OrderStatus.pending]: {
    label: "Pending",
    icon: Clock,
    className: "bg-[#8B8589]/15 text-[#353935] border-[#8B8589]/30",
  },
  [OrderStatus.ready]: {
    label: "Ready",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700 border-green-200",
  },
  [OrderStatus.delivered]: {
    label: "Delivered",
    icon: Truck,
    className: "bg-muted text-muted-foreground border-border",
  },
};

const STATUS_LABEL = {
  [OrderStatus.pending]: "Pending",
  [OrderStatus.ready]: "Ready for Pickup",
  [OrderStatus.delivered]: "Delivered",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function shareStatusViaWhatsApp(order: LocalOrder) {
  const trackingUrl = `${window.location.origin}/#/track/${order.trackingToken}`;
  const statusLabel = STATUS_LABEL[order.status];
  const msg = `Hi ${order.customerName}, your order status has been updated to *${statusLabel}*.\n🔗 Track your order here: ${trackingUrl}\n— The Digital Gallery by Emon`;
  const phone = (order.customerPhone || "").replace(/\D/g, "");
  if (phone) {
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  } else {
    // No phone — open WhatsApp without pre-filled number
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }
}

function OrderCard({
  order,
  onShowBill,
}: { order: LocalOrder; onShowBill: (o: LocalOrder) => void }) {
  const updateStatus = useUpdateOrderStatus();
  const settleBalance = useSettleBalance();
  const deleteOrder = useDeleteOrder();

  const dateStr = new Date(
    Number(order.orderDate) / 1_000_000,
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const billLabel = order.billNumber
    ? `#${String(order.billNumber).padStart(4, "0")}`
    : `#${String(order.id).slice(-4)}`;

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 space-y-3"
      data-ocid="khatabook.card"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#436B95]">
              {billLabel}
            </span>
            <p className="font-semibold text-foreground text-sm">
              {order.customerName}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
          {order.customerPhone && (
            <p className="text-xs text-muted-foreground">
              📞 {order.customerPhone}
            </p>
          )}
          {order.deliveryAddress && (
            <p className="text-xs text-muted-foreground">
              📍 {order.deliveryAddress}
            </p>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="text-xs text-muted-foreground">
        {order.items.map((i) => i.size).join(", ")}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/40 rounded-lg py-2">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-sm font-bold text-foreground">
            ₹{order.totalAmount.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg py-2">
          <p className="text-xs text-green-600">Advance</p>
          <p className="text-sm font-bold text-green-700">
            ₹{order.advancePaid.toLocaleString("en-IN")}
          </p>
        </div>
        <div
          className={`rounded-lg py-2 ${order.balanceDue > 0 ? "bg-[#436B95]/10" : "bg-muted/40"}`}
        >
          <p
            className={`text-xs ${order.balanceDue > 0 ? "text-[#436B95]" : "text-muted-foreground"}`}
          >
            Balance
          </p>
          <p
            className={`text-sm font-bold ${order.balanceDue > 0 ? "text-[#436B95]" : "text-muted-foreground"}`}
          >
            ₹{order.balanceDue.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select
          value={order.status}
          onValueChange={async (val) => {
            await updateStatus.mutateAsync({
              id: order.id,
              status: val as OrderStatus,
            });
            toast.success("Status updated");
          }}
          disabled={updateStatus.isPending}
        >
          <SelectTrigger
            className="flex-1 h-8 text-xs bg-background border-border"
            data-ocid="khatabook.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={OrderStatus.pending}>Pending</SelectItem>
            <SelectItem value={OrderStatus.ready}>Ready</SelectItem>
            <SelectItem value={OrderStatus.delivered}>Delivered</SelectItem>
          </SelectContent>
        </Select>

        {order.balanceDue > 0 && (
          <Button
            size="sm"
            onClick={async () => {
              await settleBalance.mutateAsync({
                id: order.id,
                totalAmount: order.totalAmount,
              });
              toast.success("Balance settled");
            }}
            disabled={settleBalance.isPending}
            className="h-8 text-xs bg-[#436B95] hover:bg-[#355578] text-white px-3"
            data-ocid="khatabook.confirm_button"
          >
            <CreditCard className="h-3 w-3 mr-1" /> Settle
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => onShowBill(order)}
          className="h-8 text-xs border-border hover:bg-muted px-3"
          data-ocid="khatabook.secondary_button"
        >
          <Receipt className="h-3 w-3 mr-1" /> Bill
        </Button>

        {order.trackingToken && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => shareStatusViaWhatsApp(order)}
            className="h-8 text-xs border-[#436B95] text-[#436B95] hover:bg-[#436B95]/10 px-3"
            data-ocid="khatabook.secondary_button"
          >
            <Share2 className="h-3 w-3 mr-1" /> Share Status
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500"
              data-ocid="khatabook.delete_button"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this record?</AlertDialogTitle>
              <AlertDialogDescription>
                Remove {order.customerName}'s order permanently?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await deleteOrder.mutateAsync(order.id);
                  toast.success(`${order.customerName}'s record deleted`);
                }}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function Khatabook() {
  const { data: orders = [], isLoading } = useGetAllOrders();
  const [thermalOrder, setThermalOrder] = useState<LocalOrder | null>(null);

  const totalBalance = orders.reduce((sum, o) => sum + o.balanceDue, 0);
  const pendingCount = orders.filter(
    (o) => o.status === OrderStatus.pending,
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 w-full"
      data-ocid="khatabook.section"
    >
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Khatabook
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Customer order ledger
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#436B95]/10 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total Balance Due</p>
          <p className="text-xl font-bold text-[#436B95] font-serif mt-0.5">
            ₹{totalBalance.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Pending Orders</p>
          <p className="text-xl font-bold text-foreground font-serif mt-0.5">
            {pendingCount}
          </p>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              {[
                "Bill",
                "Customer",
                "Date",
                "Items",
                "Status",
                "Total",
                "Advance",
                "Balance",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className={`py-3 px-3 font-semibold text-foreground ${
                    h === "Total" ||
                    h === "Advance" ||
                    h === "Balance" ||
                    h === "Actions"
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <p className="text-muted-foreground">No orders yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create your first bill in Smart Billing
                  </p>
                </td>
              </tr>
            ) : (
              orders.map((order, i) => (
                <DesktopRow
                  key={String(order.id)}
                  order={order}
                  index={i + 1}
                  onShowBill={setThermalOrder}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No orders yet
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={String(order.id)}
              order={order}
              onShowBill={setThermalOrder}
            />
          ))
        )}
      </div>

      {thermalOrder && (
        <ThermalBill
          order={thermalOrder}
          billNumber={thermalOrder.billNumber}
          onClose={() => setThermalOrder(null)}
        />
      )}
    </motion.div>
  );
}

function DesktopRow({
  order,
  index,
  onShowBill,
}: { order: LocalOrder; index: number; onShowBill: (o: LocalOrder) => void }) {
  const updateStatus = useUpdateOrderStatus();
  const settleBalance = useSettleBalance();
  const deleteOrder = useDeleteOrder();

  const dateStr = new Date(
    Number(order.orderDate) / 1_000_000,
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
  const billLabel = order.billNumber
    ? `#${String(order.billNumber).padStart(4, "0")}`
    : `#${String(order.id).slice(-4)}`;

  return (
    <tr
      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
      data-ocid={`khatabook.row.${index}`}
    >
      <td className="py-3 px-3 font-mono text-xs font-bold text-[#436B95]">
        {billLabel}
      </td>
      <td className="py-3 px-3 font-medium text-foreground">
        <div>{order.customerName}</div>
        {order.customerPhone && (
          <div className="text-xs text-muted-foreground">
            {order.customerPhone}
          </div>
        )}
      </td>
      <td className="py-3 px-3 text-muted-foreground text-xs">{dateStr}</td>
      <td className="py-3 px-3 text-muted-foreground text-xs max-w-[120px] truncate">
        {order.items.map((i) => i.size).join(", ")}
      </td>
      <td className="py-3 px-3 whitespace-nowrap">
        <Select
          value={order.status}
          onValueChange={async (val) => {
            await updateStatus.mutateAsync({
              id: order.id,
              status: val as OrderStatus,
            });
            toast.success("Status updated");
          }}
        >
          <SelectTrigger
            className="h-7 text-xs w-28 bg-background border-border"
            data-ocid="khatabook.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={OrderStatus.pending}>Pending</SelectItem>
            <SelectItem value={OrderStatus.ready}>Ready</SelectItem>
            <SelectItem value={OrderStatus.delivered}>Delivered</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="py-3 px-3 text-right font-medium">
        ₹{order.totalAmount.toLocaleString("en-IN")}
      </td>
      <td className="py-3 px-3 text-right text-green-600 font-medium">
        ₹{order.advancePaid.toLocaleString("en-IN")}
      </td>
      <td
        className={`py-3 px-3 text-right font-bold ${order.balanceDue > 0 ? "text-[#436B95]" : "text-muted-foreground"}`}
      >
        ₹{order.balanceDue.toLocaleString("en-IN")}
      </td>
      <td className="py-3 px-3 whitespace-nowrap">
        <div className="flex justify-end gap-1.5">
          {order.balanceDue > 0 && (
            <Button
              size="sm"
              onClick={async () => {
                await settleBalance.mutateAsync({
                  id: order.id,
                  totalAmount: order.totalAmount,
                });
                toast.success("Balance settled");
              }}
              className="h-7 text-xs bg-[#436B95] hover:bg-[#355578] text-white px-2"
              data-ocid="khatabook.confirm_button"
            >
              Settle
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onShowBill(order)}
            className="h-7 text-xs px-2"
            data-ocid="khatabook.secondary_button"
          >
            <Receipt className="h-3 w-3 mr-1" /> Bill
          </Button>
          {order.trackingToken && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => shareStatusViaWhatsApp(order)}
              className="h-7 text-xs border-[#436B95] text-[#436B95] hover:bg-[#436B95]/10 px-2"
              data-ocid="khatabook.secondary_button"
            >
              <Share2 className="h-3 w-3" />
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-500"
                data-ocid="khatabook.delete_button"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                <AlertDialogDescription>
                  Remove {order.customerName}'s order permanently?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    await deleteOrder.mutateAsync(order.id);
                    toast.success(`${order.customerName}'s record deleted`);
                  }}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
}
