import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Check,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSuppliers } from "../hooks/useSuppliers";
import type { Supplier, SupplierTransaction } from "../hooks/useSuppliers";

function calcBalance(supplier: Supplier) {
  const purchases = supplier.transactions
    .filter((t) => t.type === "purchase")
    .reduce((s, t) => s + t.amount, 0);
  const payments = supplier.transactions
    .filter((t) => t.type === "payment")
    .reduce((s, t) => s + t.amount, 0);
  return { purchases, payments, outstanding: purchases - payments };
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AddSupplierForm({
  onAdd,
}: { onAdd: (name: string, phone?: string) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), phone.trim() || undefined);
    setName("");
    setPhone("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Supplier name (e.g. Glass Dealer)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-background border-border"
          data-ocid="supplier.input"
        />
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="+91 XXXXX XXXXX (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="flex-1 bg-background border-border"
          data-ocid="supplier.input"
        />
        <Button
          type="submit"
          className="bg-[#436B95] hover:bg-[#355578] text-white"
          data-ocid="supplier.submit_button"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </form>
  );
}

function AddTransactionForm({
  type,
  onAdd,
  onCancel,
}: {
  type: "purchase" | "payment";
  onAdd: (tx: Omit<SupplierTransaction, "id">) => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number.parseFloat(amount);
    if (!description.trim() || !amt || amt <= 0) {
      toast.error("Please fill in description and a valid amount");
      return;
    }
    onAdd({
      type,
      description: description.trim(),
      amount: amt,
      date: Date.now(),
    });
    setDescription("");
    setAmount("");
  };

  const accent = type === "purchase" ? "text-red-600" : "text-green-600";
  const label = type === "purchase" ? "New Purchase" : "New Payment";

  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onSubmit={handleSubmit}
      className="bg-muted/30 border border-border rounded-xl p-4 space-y-3"
    >
      <p className={`text-sm font-semibold ${accent}`}>{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Description</Label>
          <Input
            placeholder="e.g. 10 sheets clear glass"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-background border-border h-9 text-sm"
            data-ocid="supplier.input"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Amount (₹)</Label>
          <Input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-background border-border h-9 text-sm"
            data-ocid="supplier.input"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          className="bg-[#436B95] hover:bg-[#355578] text-white"
          data-ocid="supplier.confirm_button"
        >
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCancel}
          data-ocid="supplier.cancel_button"
        >
          Cancel
        </Button>
      </div>
    </motion.form>
  );
}

function SupplierDetail({
  supplier,
  onBack,
  onAddTransaction,
  onDeleteTransaction,
  onUpdatePhone,
}: {
  supplier: Supplier;
  onBack: () => void;
  onAddTransaction: (
    supplierId: string,
    tx: Omit<SupplierTransaction, "id">,
  ) => void;
  onDeleteTransaction: (supplierId: string, txId: string) => void;
  onUpdatePhone: (id: string, phone: string) => void;
}) {
  const [activeForm, setActiveForm] = useState<"purchase" | "payment" | null>(
    null,
  );
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState(supplier.phone ?? "");
  const { purchases, payments, outstanding } = calcBalance(supplier);
  const sorted = [...supplier.transactions].sort((a, b) => b.date - a.date);

  const handleAddTx = (tx: Omit<SupplierTransaction, "id">) => {
    onAddTransaction(supplier.id, tx);
    setActiveForm(null);
    toast.success(
      `${tx.type === "purchase" ? "Purchase" : "Payment"} recorded!`,
    );
  };

  const handleDeleteTx = (txId: string) => {
    onDeleteTransaction(supplier.id, txId);
    toast.success("Entry deleted");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          data-ocid="supplier.secondary_button"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <h3 className="font-serif text-xl font-bold text-foreground">
            {supplier.name}
          </h3>
          {editingPhone ? (
            <div className="flex items-center gap-1 mt-1">
              <input
                value={phoneValue}
                onChange={(e) => setPhoneValue(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="text-xs border border-border rounded px-2 py-0.5 bg-background w-40"
              />
              <button
                type="button"
                onClick={() => {
                  onUpdatePhone(supplier.id, phoneValue);
                  setEditingPhone(false);
                  toast.success("Phone updated");
                }}
                className="p-0.5 rounded hover:bg-green-50 text-green-600"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setEditingPhone(false)}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-0.5">
              <p className="text-xs text-muted-foreground">
                {supplier.phone || "Supplier ledger"}
              </p>
              <button
                type="button"
                onClick={() => setEditingPhone(true)}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground"
                title="Edit phone"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
          <p className="text-xs text-red-500 font-medium">Purchases</p>
          <p className="text-base font-bold text-red-700 mt-0.5">
            ₹{purchases.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
          <p className="text-xs text-green-600 font-medium">Payments</p>
          <p className="text-base font-bold text-green-700 mt-0.5">
            ₹{payments.toLocaleString("en-IN")}
          </p>
        </div>
        <div
          className={`rounded-xl p-3 text-center border ${outstanding > 0 ? "bg-[#436B95]/10 border-[#436B95]/20" : "bg-muted/40 border-border"}`}
        >
          <p
            className={`text-xs font-medium ${outstanding > 0 ? "text-[#436B95]" : "text-muted-foreground"}`}
          >
            Outstanding
          </p>
          <p
            className={`text-base font-bold mt-0.5 ${outstanding > 0 ? "text-[#436B95]" : "text-muted-foreground"}`}
          >
            ₹{outstanding.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Add buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() =>
            setActiveForm(activeForm === "purchase" ? null : "purchase")
          }
          className="bg-[#436B95] hover:bg-[#355578] text-white"
          data-ocid="supplier.primary_button"
        >
          <TrendingDown className="h-3.5 w-3.5 mr-1" />+ Purchase
        </Button>
        <Button
          size="sm"
          onClick={() =>
            setActiveForm(activeForm === "payment" ? null : "payment")
          }
          className="bg-[#436B95] hover:bg-[#355578] text-white"
          data-ocid="supplier.primary_button"
        >
          <TrendingUp className="h-3.5 w-3.5 mr-1" />+ Payment
        </Button>
      </div>

      <AnimatePresence>
        {activeForm && (
          <AddTransactionForm
            type={activeForm}
            onAdd={handleAddTx}
            onCancel={() => setActiveForm(null)}
          />
        )}
      </AnimatePresence>

      {sorted.length === 0 ? (
        <div
          className="text-center py-10 text-muted-foreground"
          data-ocid="supplier.empty_state"
        >
          No transactions yet. Add a purchase or payment above.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#8B8589]/10 border-b border-border">
                <th className="text-left py-2.5 px-4 font-semibold text-foreground">
                  Type
                </th>
                <th className="text-left py-2.5 px-4 font-semibold text-foreground">
                  Description
                </th>
                <th className="text-left py-2.5 px-4 font-semibold text-foreground">
                  Date
                </th>
                <th className="text-right py-2.5 px-4 font-semibold text-foreground">
                  Amount
                </th>
                <th className="py-2.5 px-4" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((tx, i) => (
                <tr
                  key={tx.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20"
                  data-ocid={`supplier.row.${i + 1}`}
                >
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                        tx.type === "purchase"
                          ? "bg-red-50 text-red-600 border-red-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }`}
                    >
                      {tx.type === "purchase" ? "Purchase" : "Payment"}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-foreground">
                    {tx.description}
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground">
                    {formatDate(tx.date)}
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right font-semibold ${tx.type === "purchase" ? "text-red-600" : "text-green-700"}`}
                  >
                    {tx.type === "purchase" ? "-" : "+"}₹
                    {tx.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteTx(tx.id)}
                      className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                      data-ocid="supplier.delete_button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

export default function SupplierLedger() {
  const {
    suppliers,
    addSupplier,
    renameSupplier,
    deleteSupplier,
    addTransaction,
    deleteTransaction,
    updateSupplierPhone,
  } = useSuppliers();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const selectedSupplier = suppliers.find((s) => s.id === selectedId) ?? null;

  const handleAddSupplier = (name: string, phone?: string) => {
    addSupplier(name, phone);
    setShowAddForm(false);
    toast.success(`${name} added!`);
  };

  const handleStartRename = (s: Supplier) => {
    setRenamingId(s.id);
    setRenameValue(s.name);
  };

  const handleConfirmRename = () => {
    if (!renamingId || !renameValue.trim()) return;
    renameSupplier(renamingId, renameValue.trim());
    setRenamingId(null);
    toast.success("Supplier renamed");
  };

  const handleDeleteSupplier = (id: string) => {
    const s = suppliers.find((sup) => sup.id === id);
    if (s && s.transactions.length > 0) {
      setConfirmDeleteId(id);
    } else {
      deleteSupplier(id);
      toast.success("Supplier removed");
    }
  };

  const handleForceDelete = () => {
    if (!confirmDeleteId) return;
    deleteSupplier(confirmDeleteId);
    setConfirmDeleteId(null);
    toast.success("Supplier and all transactions removed");
  };

  const totalOutstanding = suppliers.reduce(
    (sum, s) => sum + calcBalance(s).outstanding,
    0,
  );

  if (selectedSupplier) {
    return (
      <div data-ocid="supplier.section">
        <SupplierDetail
          supplier={selectedSupplier}
          onBack={() => setSelectedId(null)}
          onAddTransaction={addTransaction}
          onDeleteTransaction={deleteTransaction}
          onUpdatePhone={updateSupplierPhone}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
      data-ocid="supplier.section"
    >
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Supplier Ledger
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your Udhaar
        </p>
      </div>

      {/* Total outstanding */}
      <div className="bg-[#436B95]/10 border border-[#436B95]/20 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-[#436B95] font-medium">
            Total Outstanding Balance
          </p>
          <p className="text-2xl font-bold text-[#436B95] font-serif mt-0.5">
            ₹{totalOutstanding.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="text-[#436B95]/40">
          <TrendingDown className="h-10 w-10" />
        </div>
      </div>

      {/* Confirm delete dialog */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            data-ocid="supplier.modal"
          >
            <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
              <h3 className="font-serif text-lg font-bold text-foreground mb-2">
                Delete Supplier?
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                This supplier has existing transactions. Deleting will
                permanently remove all transaction history. This action cannot
                be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleForceDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  data-ocid="supplier.confirm_button"
                >
                  Delete Anyway
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1"
                  data-ocid="supplier.cancel_button"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add supplier */}
      {showAddForm ? (
        <div className="space-y-2">
          <AddSupplierForm onAdd={handleAddSupplier} />
          <button
            type="button"
            onClick={() => setShowAddForm(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
            data-ocid="supplier.cancel_button"
          >
            Cancel
          </button>
        </div>
      ) : (
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-[#436B95] hover:bg-[#355578] text-white"
          data-ocid="supplier.open_modal_button"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Supplier
        </Button>
      )}

      {/* Supplier list */}
      {suppliers.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="supplier.empty_state"
        >
          <p>No suppliers yet.</p>
          <p className="text-sm mt-1">
            Add your first supplier to start tracking Udhaar.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#8B8589]/10 border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Supplier
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">
                    Purchases
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">
                    Payments
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">
                    Outstanding
                  </th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, i) => {
                  const bal = calcBalance(s);
                  const isRenaming = renamingId === s.id;
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                      data-ocid={`supplier.row.${i + 1}`}
                    >
                      <td className="py-3 px-4">
                        {isRenaming ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className="h-7 text-sm bg-background border-border w-40"
                              data-ocid="supplier.input"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleConfirmRename();
                                if (e.key === "Escape") setRenamingId(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleConfirmRename}
                              className="p-1 rounded hover:bg-green-50 text-green-600"
                              data-ocid="supplier.confirm_button"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRenamingId(null)}
                              className="p-1 rounded hover:bg-muted"
                              data-ocid="supplier.cancel_button"
                            >
                              <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <span className="font-medium text-foreground">
                              {s.name}
                            </span>
                            {s.phone && (
                              <p className="text-xs text-muted-foreground">
                                {s.phone}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-red-600 font-medium">
                        ₹{bal.purchases.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-right text-green-700 font-medium">
                        ₹{bal.payments.toLocaleString("en-IN")}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold ${bal.outstanding > 0 ? "text-[#436B95]" : "text-muted-foreground"}`}
                      >
                        ₹{bal.outstanding.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => setSelectedId(s.id)}
                            className="h-7 text-xs bg-[#436B95] hover:bg-[#355578] text-white px-2.5"
                            data-ocid="supplier.secondary_button"
                          >
                            View
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleStartRename(s)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            data-ocid="supplier.edit_button"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSupplier(s.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                            data-ocid="supplier.delete_button"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {suppliers.map((s, i) => {
              const bal = calcBalance(s);
              const isRenaming = renamingId === s.id;
              return (
                <div
                  key={s.id}
                  className="bg-card border border-border rounded-xl p-4 space-y-3"
                  data-ocid={`supplier.item.${i + 1}`}
                >
                  <div className="flex items-center justify-between">
                    {isRenaming ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="h-7 text-sm bg-background border-border flex-1"
                          data-ocid="supplier.input"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleConfirmRename();
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleConfirmRename}
                          className="p-1 rounded hover:bg-green-50 text-green-600"
                          data-ocid="supplier.confirm_button"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenamingId(null)}
                          className="p-1 rounded hover:bg-muted"
                          data-ocid="supplier.cancel_button"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-foreground">
                          {s.name}
                        </p>
                        {s.phone && (
                          <p className="text-xs text-muted-foreground">
                            {s.phone}
                          </p>
                        )}
                      </>
                    )}
                    {!isRenaming && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartRename(s)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground"
                          data-ocid="supplier.edit_button"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(s.id)}
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                          data-ocid="supplier.delete_button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-red-50 rounded-lg py-2">
                      <p className="text-xs text-red-500">Purchases</p>
                      <p className="text-sm font-bold text-red-700">
                        ₹{bal.purchases.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg py-2">
                      <p className="text-xs text-green-600">Payments</p>
                      <p className="text-sm font-bold text-green-700">
                        ₹{bal.payments.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div
                      className={`rounded-lg py-2 ${bal.outstanding > 0 ? "bg-[#436B95]/10" : "bg-muted/40"}`}
                    >
                      <p
                        className={`text-xs ${bal.outstanding > 0 ? "text-[#436B95]" : "text-muted-foreground"}`}
                      >
                        Udhaar
                      </p>
                      <p
                        className={`text-sm font-bold ${bal.outstanding > 0 ? "text-[#436B95]" : "text-muted-foreground"}`}
                      >
                        ₹{bal.outstanding.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setSelectedId(s.id)}
                    className="w-full bg-[#436B95] hover:bg-[#355578] text-white h-8 text-xs"
                    data-ocid="supplier.secondary_button"
                  >
                    View Transactions
                  </Button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}
