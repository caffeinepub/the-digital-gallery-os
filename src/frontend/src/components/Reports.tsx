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
import { Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  addLocalInvestment,
  deleteLocalInvestment,
  getLocalInvestments,
  getLocalOrders,
} from "../utils/localStorage";

function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function getLast12Months(): string[] {
  const result: string[] = [];
  const now = new Date();
  const startDate = new Date(2026, 0, 1); // Business started Jan 2026
  let d = new Date(now.getFullYear(), now.getMonth(), 1);
  while (d >= startDate) {
    result.push(formatMonthKey(d));
    d = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  }
  return result;
}

export default function Reports() {
  const months = getLast12Months();
  const [selectedMonth, setSelectedMonth] = useState(months[0]);

  // Investment form state
  const [invDesc, setInvDesc] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [invDate, setInvDate] = useState(today);

  // Force re-render after mutations
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const orders = useMemo(() => {
    void tick;
    return getLocalOrders();
  }, [tick]);

  const investments = useMemo(() => {
    void tick;
    return getLocalInvestments();
  }, [tick]);

  const [selYear, selMonth] = selectedMonth.split("-").map(Number);

  const monthOrders = useMemo(
    () =>
      orders.filter((o) => {
        const d = new Date(Number(o.orderDate) / 1_000_000);
        return d.getFullYear() === selYear && d.getMonth() + 1 === selMonth;
      }),
    [orders, selYear, selMonth],
  );

  const monthInvestments = useMemo(
    () =>
      investments.filter((inv) => {
        const d = new Date(inv.date);
        return d.getFullYear() === selYear && d.getMonth() + 1 === selMonth;
      }),
    [investments, selYear, selMonth],
  );

  const totalSales = monthOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalAdvance = monthOrders.reduce((s, o) => s + o.advancePaid, 0);
  const totalBalance = monthOrders.reduce((s, o) => s + o.balanceDue, 0);
  const totalInvested = monthInvestments.reduce((s, i) => s + i.amount, 0);
  const netProfit = totalAdvance - totalInvested;

  const handleAddInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseFloat(invAmount);
    if (!invDesc.trim() || !amount || amount <= 0) {
      toast.error("Please fill in description and a valid amount");
      return;
    }
    const dateTs = invDate ? new Date(invDate).getTime() : Date.now();
    addLocalInvestment(invDesc.trim(), amount, dateTs);
    setInvDesc("");
    setInvAmount("");
    setInvDate(today);
    refresh();
    toast.success("Investment added");
  };

  const handleDeleteInvestment = (id: string) => {
    deleteLocalInvestment(id);
    refresh();
    toast.success("Investment deleted");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
      data-ocid="reports.section"
    >
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Monthly Reports
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track sales, investments, and profit
        </p>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium text-foreground shrink-0">
          Month
        </Label>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger
            className="w-52 bg-background border-border"
            data-ocid="reports.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {monthLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sales Tracker */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-serif text-lg font-bold text-foreground">
          Sales Tracker
        </h3>
        {monthOrders.length === 0 ? (
          <p
            className="text-sm text-muted-foreground"
            data-ocid="reports.empty_state"
          >
            No orders found for {monthLabel(selectedMonth)}.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#8B8589]/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {monthOrders.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total Bills
              </p>
            </div>
            <div className="bg-[#436B95]/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-[#436B95]">
                ₹{totalSales.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total Amount
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                ₹{totalAdvance.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Advance Collected
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">
                ₹{totalBalance.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Balance Pending
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Investment Tracker */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-serif text-lg font-bold text-foreground">
          Investment Tracker
        </h3>

        <form onSubmit={handleAddInvestment} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-xs">Description</Label>
              <Input
                placeholder="e.g. Bought 20 frames"
                value={invDesc}
                onChange={(e) => setInvDesc(e.target.value)}
                className="bg-background border-border h-9 text-sm"
                data-ocid="reports.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount (₹)</Label>
              <Input
                type="number"
                placeholder="0"
                value={invAmount}
                onChange={(e) => setInvAmount(e.target.value)}
                className="bg-background border-border h-9 text-sm"
                data-ocid="reports.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={invDate}
                onChange={(e) => setInvDate(e.target.value)}
                className="bg-background border-border h-9 text-sm"
                data-ocid="reports.input"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="bg-[#436B95] hover:bg-[#355578] text-white"
            data-ocid="reports.submit_button"
          >
            Add Investment
          </Button>
        </form>

        {monthInvestments.length === 0 ? (
          <p
            className="text-sm text-muted-foreground"
            data-ocid="reports.empty_state"
          >
            No investments logged for {monthLabel(selectedMonth)}.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {monthInvestments.map((inv, i) => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-2.5"
                data-ocid={`reports.item.${i + 1}`}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {inv.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(inv.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground">
                    ₹{inv.amount.toLocaleString("en-IN")}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteInvestment(inv.id)}
                    className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                    data-ocid="reports.delete_button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Net Profit */}
      <div
        className={`bg-card border rounded-xl p-5 space-y-3 ${
          netProfit >= 0 ? "border-green-200" : "border-red-200"
        }`}
      >
        <h3 className="font-serif text-lg font-bold text-foreground">
          Net Profit
        </h3>
        <p className="text-sm text-muted-foreground">
          ₹{totalAdvance.toLocaleString("en-IN")} collected − ₹
          {totalInvested.toLocaleString("en-IN")} invested ={" "}
          <span
            className={`font-bold ${
              netProfit >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            ₹{netProfit.toLocaleString("en-IN")}
          </span>
        </p>
        <div
          className={`text-4xl font-bold ${
            netProfit >= 0 ? "text-green-600" : "text-red-500"
          }`}
        >
          {netProfit >= 0 ? "+" : ""}₹{netProfit.toLocaleString("en-IN")}
        </div>
      </div>
    </motion.div>
  );
}
