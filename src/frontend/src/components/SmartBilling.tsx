import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Receipt } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { OrderStatus } from "../backend";
import { useProducts } from "../hooks/useProducts";
import { useCreateOrder } from "../hooks/useQueries";
import { adjustLocalStock } from "../utils/localStorage";
import ThermalBill from "./ThermalBill";

interface ThermalOrder {
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

export default function SmartBilling() {
  const { products } = useProducts();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+91 ");
  const [selectedThickness, setSelectedThickness] = useState("1 Inch");
  const [selectedProductId, setSelectedProductId] = useState(
    () =>
      products.find((p) => p.thickness === "1 Inch")?.id ??
      products[0]?.id ??
      "",
  );
  const [quantity, setQuantity] = useState(1);
  const [advancePaid, setAdvancePaid] = useState("");
  const [discount, setDiscount] = useState("");
  const [thermalOrder, setThermalOrder] = useState<ThermalOrder | null>(null);

  const createOrder = useCreateOrder();

  const filteredProducts = useMemo(
    () => products.filter((p) => p.thickness === selectedThickness),
    [products, selectedThickness],
  );

  const selectedProduct = useMemo(
    () =>
      filteredProducts.find((p) => p.id === selectedProductId) ??
      filteredProducts[0],
    [filteredProducts, selectedProductId],
  );

  const unitPrice = selectedProduct?.price ?? 0;
  const totalAmount = unitPrice * quantity;
  const discountAmt = Number.parseFloat(discount) || 0;
  const netAmount = Math.max(0, totalAmount - discountAmt);
  const advance = Number.parseFloat(advancePaid) || 0;
  const balanceDue = Math.max(0, netAmount - advance);

  const handleThicknessChange = (val: string) => {
    setSelectedThickness(val);
    const first = products.find((p) => p.thickness === val);
    if (first) setSelectedProductId(first.id);
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("+91 ");
    setSelectedThickness("1 Inch");
    setSelectedProductId(
      products.find((p) => p.thickness === "1 Inch")?.id ??
        products[0]?.id ??
        "",
    );
    setQuantity(1);
    setAdvancePaid("");
    setDiscount("");
  };

  const handleCreateBill = async () => {
    if (!customerName.trim()) {
      toast.error("Please enter customer name");
      return;
    }
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }

    const orderResult = await createOrder.mutateAsync({
      customerName: customerName.trim(),
      items: [
        {
          size: `${selectedProduct.name} — ${selectedProduct.thickness}`,
          thickness: 1,
          quantity: BigInt(quantity),
          unitPrice: netAmount / quantity,
        },
      ],
      totalAmount: netAmount,
      advancePaid: advance,
    });

    adjustLocalStock(selectedProduct.name, -quantity);
    toast.success(`Bill created for ${customerName}!`);

    const orderId =
      typeof orderResult === "bigint" ? orderResult : BigInt(Date.now());
    const order: ThermalOrder = {
      id: orderId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      totalAmount: netAmount,
      advancePaid: advance,
      balanceDue,
      orderDate: BigInt(Date.now()) * BigInt(1_000_000),
      items: [
        {
          size: `${selectedProduct.name} — ${selectedProduct.thickness}`,
          thickness: 1,
          quantity: BigInt(quantity),
          unitPrice,
        },
      ],
    };
    setThermalOrder(order);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
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

      <div className="bg-card border border-border rounded-xl shadow-card p-5 md:p-6 space-y-5">
        {/* Customer Name */}
        <div className="space-y-1.5">
          <Label
            htmlFor="customer-name"
            className="text-sm font-medium text-foreground"
          >
            Customer Name
          </Label>
          <Input
            id="customer-name"
            placeholder="e.g. Priya Sharma"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="bg-background border-border focus:ring-ring"
            data-ocid="billing.input"
          />
        </div>

        {/* Customer Phone */}
        <div className="space-y-1.5">
          <Label
            htmlFor="customer-phone"
            className="text-sm font-medium text-foreground"
          >
            Customer Phone{" "}
            <span className="text-muted-foreground font-normal">
              (for WhatsApp)
            </span>
          </Label>
          <Input
            id="customer-phone"
            placeholder="98765 43210"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="bg-background border-border"
            data-ocid="billing.input"
          />
        </div>

        {/* Thickness Selector */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">
            Thickness
          </Label>
          <Select
            value={selectedThickness}
            onValueChange={handleThicknessChange}
          >
            <SelectTrigger
              className="bg-background border-border"
              data-ocid="billing.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1 Inch">1 Inch</SelectItem>
              <SelectItem value="1.5 Inch">1.5 Inch</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Product dropdown */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">Product</Label>
          <Select
            value={selectedProduct?.id ?? ""}
            onValueChange={setSelectedProductId}
          >
            <SelectTrigger
              className="bg-background border-border"
              data-ocid="billing.select"
            >
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {filteredProducts.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quantity */}
        <div className="space-y-1.5">
          <Label
            htmlFor="quantity"
            className="text-sm font-medium text-foreground"
          >
            Quantity
          </Label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center text-lg font-semibold transition-colors"
            >
              −
            </button>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))
              }
              className="text-center w-20 bg-background border-border"
              data-ocid="billing.input"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center text-lg font-semibold transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Discount */}
        <div className="space-y-1.5">
          <Label
            htmlFor="discount"
            className="text-sm font-medium text-foreground"
          >
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

        {/* Advance */}
        <div className="space-y-1.5">
          <Label
            htmlFor="advance"
            className="text-sm font-medium text-foreground"
          >
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

        {/* Summary */}
        <div className="bg-[#8B8589]/10 border border-[#8B8589]/30 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Unit Price</span>
            <span className="text-sm font-semibold text-foreground">
              ₹{unitPrice.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Amount</span>
            <span className="text-sm font-semibold text-foreground">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
          {discountAmt > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Discount</span>
              <span className="text-sm font-semibold text-red-500">
                −₹{discountAmt.toLocaleString("en-IN")}
              </span>
            </div>
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
          <div className="h-px bg-[#8B8589]/30" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-foreground">
              Balance Due
            </span>
            <span className="text-lg font-bold text-[#436B95]">
              ₹{balanceDue.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button
            onClick={handleCreateBill}
            disabled={createOrder.isPending}
            className="flex-1 bg-[#353935] hover:bg-[#1e211e] text-white font-medium rounded-lg h-10"
            data-ocid="billing.primary_button"
          >
            <Receipt className="mr-2 h-4 w-4" />
            {createOrder.isPending ? "Creating..." : "Create Bill"}
          </Button>
        </div>
      </div>

      {/* Price Reference */}
      <div className="bg-card border border-border rounded-xl shadow-card p-5">
        <h3 className="font-serif text-base font-semibold text-foreground mb-3">
          Price Reference
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#8B8589]/10">
                <th className="text-left py-2 px-3 text-foreground font-semibold">
                  Product
                </th>
                <th className="text-left py-2 px-3 text-foreground font-semibold">
                  Thickness
                </th>
                <th className="text-right py-2 px-3 text-foreground font-semibold">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} className={i % 2 === 0 ? "" : "bg-muted/30"}>
                  <td className="py-1.5 px-3 font-medium text-foreground">
                    {p.name}
                  </td>
                  <td className="py-1.5 px-3 text-muted-foreground">
                    {p.thickness}
                  </td>
                  <td className="py-1.5 px-3 text-right text-muted-foreground">
                    ₹{p.price.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {thermalOrder && (
        <ThermalBill
          order={thermalOrder}
          discount={discountAmt}
          onClose={() => {
            setThermalOrder(null);
            resetForm();
          }}
        />
      )}
    </motion.div>
  );
}
