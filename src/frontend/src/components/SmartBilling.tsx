import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Plus, Receipt, Trash2, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useProducts } from "../hooks/useProducts";
import { useCreateOrder, useGetAllOrders } from "../hooks/useQueries";
import { adjustLocalStock, getNextBillNumber } from "../utils/localStorage";
import ThermalBill from "./ThermalBill";

interface ThermalOrder {
  id: bigint;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  orderDate: bigint;
  trackingToken?: string;
  items: Array<{
    size: string;
    thickness: number;
    quantity: bigint;
    unitPrice: number;
  }>;
}

interface BillLineItem {
  id: string;
  thickness: string;
  productId: string;
  quantity: number;
  customPrice: string;
}

const emptyItem = (): BillLineItem => ({
  id: `item-${Date.now()}-${Math.random()}`,
  thickness: "1 Inch",
  productId: "__nil__",
  quantity: 1,
  customPrice: "",
});

export default function SmartBilling() {
  const { products } = useProducts();
  const createOrder = useCreateOrder();
  const { data: allOrders = [] } = useGetAllOrders();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+91 ");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const [lineItems, setLineItems] = useState<BillLineItem[]>([emptyItem()]);

  const [discount, setDiscount] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");

  const [thermalOrder, setThermalOrder] = useState<ThermalOrder | null>(null);
  const [currentBillNumber, setCurrentBillNumber] = useState<
    number | undefined
  >(undefined);
  const [replayOrder, setReplayOrder] = useState<ThermalOrder | null>(null);
  const [replayBillNumber, setReplayBillNumber] = useState<number | undefined>(
    undefined,
  );

  const pastCustomers = useMemo(() => {
    const seen = new Map<
      string,
      { name: string; phone?: string; address?: string }
    >();
    for (const o of allOrders) {
      const key = o.customerName.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, {
          name: o.customerName,
          phone: (o as { customerPhone?: string }).customerPhone,
          address: (o as { deliveryAddress?: string }).deliveryAddress,
        });
      }
    }
    return Array.from(seen.values());
  }, [allOrders]);

  const suggestions = useMemo(() => {
    if (!customerName.trim() || customerName.length < 2) return [];
    const q = customerName.toLowerCase();
    return pastCustomers
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [customerName, pastCustomers]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        nameRef.current &&
        !nameRef.current
          .closest(".name-autocomplete")
          ?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const updateItem = (id: string, patch: Partial<BillLineItem>) => {
    setLineItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );
  };

  const addItem = () => setLineItems((prev) => [...prev, emptyItem()]);

  const removeItem = (id: string) => {
    setLineItems((prev) =>
      prev.length > 1 ? prev.filter((it) => it.id !== id) : prev,
    );
  };

  const getItemUnitPrice = (item: BillLineItem): number => {
    if (item.customPrice !== "") return Number(item.customPrice) || 0;
    if (item.productId === "__nil__") return 0;
    const filtered = products.filter((p) => p.thickness === item.thickness);
    const prod = filtered.find((p) => p.id === item.productId);
    return prod?.price ?? 0;
  };

  const getItemLabel = (item: BillLineItem): string => {
    if (item.productId === "__nil__") return "NIL";
    const filtered = products.filter((p) => p.thickness === item.thickness);
    const prod = filtered.find((p) => p.id === item.productId);
    if (!prod) return "NIL";
    return `${prod.name} — ${prod.thickness}`;
  };

  const itemsSubtotal = lineItems.reduce(
    (sum, it) => sum + getItemUnitPrice(it) * it.quantity,
    0,
  );
  const discountAmt = Number.parseFloat(discount) || 0;
  const netAmount = Math.max(0, itemsSubtotal - discountAmt);
  const advance = Number.parseFloat(advancePaid) || 0;
  const balanceDue = Math.max(0, netAmount - advance);

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("+91 ");
    setDeliveryAddress("");
    setLineItems([emptyItem()]);
    setDiscount("");
    setAdvancePaid("");
  };

  const handleCreateBill = async () => {
    if (!customerName.trim()) {
      toast.error("Please enter customer name");
      return;
    }

    const billNum = getNextBillNumber();
    setCurrentBillNumber(billNum);

    const trackingToken = crypto.randomUUID();

    const billItems = lineItems.map((it) => ({
      size: getItemLabel(it),
      thickness: it.thickness === "1.5 Inch" ? 1.5 : 1,
      quantity: BigInt(it.quantity),
      unitPrice: getItemUnitPrice(it),
    }));

    const orderResult = await createOrder.mutateAsync({
      customerName: customerName.trim(),
      items: billItems,
      totalAmount: netAmount,
      advancePaid: advance,
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim() || undefined,
      billNumber: billNum,
      trackingToken,
    });

    for (const it of lineItems) {
      if (it.productId !== "__nil__") {
        const filtered = products.filter((p) => p.thickness === it.thickness);
        const prod = filtered.find((p) => p.id === it.productId);
        if (prod) adjustLocalStock(prod.name, -it.quantity);
      }
    }

    toast.success(`Bill #${String(billNum).padStart(4, "0")} created!`);

    const orderId =
      typeof orderResult.id === "bigint" ? orderResult.id : BigInt(Date.now());
    setThermalOrder({
      id: orderId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      deliveryAddress: deliveryAddress.trim() || undefined,
      totalAmount: netAmount,
      advancePaid: advance,
      balanceDue,
      orderDate: BigInt(Date.now()) * BigInt(1_000_000),
      trackingToken,
      items: billItems,
    });
  };

  const recentOrders = useMemo(() => [...allOrders].slice(0, 8), [allOrders]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
      data-ocid="billing.section"
    >
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Smart Billing
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create a new framing order
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 md:p-6 space-y-5">
        {/* Customer */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#436B95] mb-3">
            Customer
          </p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="customer-name" className="text-sm font-medium">
                Customer Name
              </Label>
              <div className="relative name-autocomplete">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    ref={nameRef}
                    id="customer-name"
                    placeholder="e.g. Priya Sharma"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    autoComplete="off"
                    className="w-full h-10 pl-9 pr-8 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#436B95]"
                    data-ocid="billing.input"
                  />
                  {customerName && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerName("");
                        setCustomerPhone("+91 ");
                        setDeliveryAddress("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
                    >
                      {suggestions.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => {
                            setCustomerName(c.name);
                            if (c.phone) setCustomerPhone(c.phone);
                            if (c.address) setDeliveryAddress(c.address);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2.5 hover:bg-[#436B95]/8 flex items-center gap-2 border-b border-border last:border-0"
                        >
                          <User className="h-3.5 w-3.5 text-[#436B95] shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {c.name}
                            </p>
                            {c.phone && (
                              <p className="text-xs text-muted-foreground">
                                {c.phone}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer-phone" className="text-sm font-medium">
                Phone{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  (for WhatsApp)
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="customer-phone"
                  placeholder="98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="bg-background border-border pr-8"
                  data-ocid="billing.input"
                />
                {customerPhone && customerPhone !== "+91 " && (
                  <button
                    type="button"
                    onClick={() => setCustomerPhone("+91 ")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="delivery-address" className="text-sm font-medium">
                Delivery Address{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  (optional)
                </span>
              </Label>
              <div className="relative">
                <Textarea
                  id="delivery-address"
                  placeholder="e.g. House No. 12, Main Road, Basugaon"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="bg-background border-border resize-none text-sm pr-8"
                  rows={2}
                  data-ocid="billing.textarea"
                />
                {deliveryAddress && (
                  <button
                    type="button"
                    onClick={() => setDeliveryAddress("")}
                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#436B95]">
              Order Items
            </p>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#436B95] hover:text-[#355578] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {lineItems.map((item, idx) => (
                <LineItemRow
                  key={item.id}
                  item={item}
                  index={idx}
                  products={products}
                  unitPrice={getItemUnitPrice(item)}
                  canRemove={lineItems.length > 1}
                  onUpdate={(patch) => updateItem(item.id, patch)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </AnimatePresence>
          </div>

          {lineItems.length > 1 && (
            <div className="mt-3 pt-3 border-t border-dashed border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items subtotal</span>
                <span className="font-semibold">
                  ₹{itemsSubtotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* Payment */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#436B95] mb-3">
            Payment
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="discount" className="text-sm font-medium">
                Discount (₹)
              </Label>
              <Input
                id="discount"
                type="number"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="bg-background border-border"
                data-ocid="billing.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="advance" className="text-sm font-medium">
                Advance Paid (₹)
              </Label>
              <Input
                id="advance"
                type="number"
                placeholder="0"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
                className="bg-background border-border"
                data-ocid="billing.input"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-[#353935]/5 border border-[#353935]/15 rounded-xl p-4 space-y-2">
          {discountAmt > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm font-medium">
                  ₹{itemsSubtotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Discount</span>
                <span className="text-sm font-semibold text-red-500">
                  −₹{discountAmt.toLocaleString("en-IN")}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">
              Net Amount
            </span>
            <span className="text-base font-bold text-foreground">
              ₹{netAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Advance Paid</span>
            <span className="text-sm font-semibold text-green-600">
              ₹{advance.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="h-px bg-[#353935]/15" />
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-foreground">
              Balance Due
            </span>
            <span className="text-xl font-bold text-[#436B95]">
              ₹{balanceDue.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <Button
          onClick={handleCreateBill}
          disabled={createOrder.isPending}
          className="w-full h-12 bg-[#353935] hover:bg-[#1e211e] text-white font-semibold rounded-xl text-base"
          data-ocid="billing.primary_button"
        >
          <Receipt className="mr-2 h-5 w-5" />
          {createOrder.isPending ? "Creating..." : "Generate Bill"}
        </Button>
      </div>

      {/* Recent Bills */}
      {recentOrders.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-[#436B95]" />
            <h3 className="font-semibold text-sm text-foreground">
              Recent Bills
            </h3>
          </div>
          <div className="space-y-2">
            {recentOrders.map((o) => {
              const bn = (o as { billNumber?: number }).billNumber;
              const billLabel = bn
                ? `#${String(bn).padStart(4, "0")}`
                : `#${String(o.id).slice(-4)}`;
              const date = new Date(
                Number(o.orderDate) / 1_000_000,
              ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
              });
              return (
                <button
                  key={String(o.id)}
                  type="button"
                  onClick={() => {
                    setReplayBillNumber(bn);
                    setReplayOrder({
                      id: o.id,
                      customerName: o.customerName,
                      customerPhone: (o as { customerPhone?: string })
                        .customerPhone,
                      deliveryAddress: (o as { deliveryAddress?: string })
                        .deliveryAddress,
                      totalAmount: o.totalAmount,
                      advancePaid: o.advancePaid,
                      balanceDue: o.balanceDue,
                      orderDate: o.orderDate,
                      trackingToken: (o as { trackingToken?: string })
                        .trackingToken,
                      items: o.items.map((it) => ({
                        size: it.size,
                        thickness:
                          typeof it.thickness === "number" ? it.thickness : 1,
                        quantity: it.quantity,
                        unitPrice: it.unitPrice,
                      })),
                    });
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-[#436B95] w-12 shrink-0">
                      {billLabel}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {o.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">{date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      ₹{o.totalAmount.toLocaleString("en-IN")}
                    </p>
                    {o.balanceDue > 0 && (
                      <p className="text-xs text-orange-500 font-medium">
                        ₹{o.balanceDue.toLocaleString("en-IN")} due
                      </p>
                    )}
                    {o.balanceDue === 0 && (
                      <p className="text-xs text-green-600 font-medium">Paid</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {thermalOrder && (
        <ThermalBill
          order={thermalOrder}
          discount={discountAmt}
          billNumber={currentBillNumber}
          onClose={() => {
            setThermalOrder(null);
            resetForm();
          }}
        />
      )}
      {replayOrder && (
        <ThermalBill
          order={replayOrder}
          billNumber={replayBillNumber}
          onClose={() => setReplayOrder(null)}
        />
      )}
    </motion.div>
  );
}

interface LineItemRowProps {
  item: BillLineItem;
  index: number;
  products: Array<{
    id: string;
    name: string;
    thickness: string;
    price: number;
  }>;
  unitPrice: number;
  canRemove: boolean;
  onUpdate: (patch: Partial<BillLineItem>) => void;
  onRemove: () => void;
}

function LineItemRow({
  item,
  index,
  products,
  unitPrice,
  canRemove,
  onUpdate,
  onRemove,
}: LineItemRowProps) {
  const filteredProducts = products.filter(
    (p) => p.thickness === item.thickness,
  );
  const plainProducts = filteredProducts.filter(
    (p) => !p.name.includes("(Mount)"),
  );
  const mountProducts = filteredProducts.filter((p) =>
    p.name.includes("(Mount)"),
  );
  const lineTotal = unitPrice * item.quantity;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className="bg-muted/30 border border-border rounded-xl p-3 space-y-2.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          Item {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        <div className="col-span-2">
          <Select
            value={item.thickness}
            onValueChange={(v) =>
              onUpdate({ thickness: v, productId: "__nil__" })
            }
          >
            <SelectTrigger className="h-9 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1 Inch">1 Inch</SelectItem>
              <SelectItem value="1.5 Inch">1.5 Inch</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-3">
          <Select
            value={item.productId}
            onValueChange={(v) => onUpdate({ productId: v, customPrice: "" })}
          >
            <SelectTrigger className="h-9 text-xs bg-background">
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__nil__">— NIL —</SelectItem>
              {plainProducts.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Plain Frames</SelectLabel>
                  {plainProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
              {mountProducts.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Mount Frames</SelectLabel>
                  {mountProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name.replace(" (Mount)", "")}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 items-end">
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">Qty</p>
          <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden h-9">
            <button
              type="button"
              onClick={() =>
                onUpdate({ quantity: Math.max(1, item.quantity - 1) })
              }
              className="px-2.5 h-full text-muted-foreground hover:bg-muted transition-colors font-semibold text-sm"
            >
              −
            </button>
            <span className="flex-1 text-center text-sm font-semibold text-foreground">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdate({ quantity: item.quantity + 1 })}
              className="px-2.5 h-full text-muted-foreground hover:bg-muted transition-colors font-semibold text-sm"
            >
              +
            </button>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">
            Unit Price (₹)
          </p>
          <Input
            type="number"
            value={
              item.customPrice !== ""
                ? item.customPrice
                : item.productId === "__nil__"
                  ? ""
                  : String(unitPrice)
            }
            onChange={(e) => onUpdate({ customPrice: e.target.value })}
            placeholder={String(unitPrice || 0)}
            className="h-9 text-xs bg-background"
          />
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground mb-1">Total</p>
          <p className="text-sm font-bold text-foreground h-9 flex items-center justify-end">
            ₹{lineTotal.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
