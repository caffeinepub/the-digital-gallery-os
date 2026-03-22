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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useProducts } from "../hooks/useProducts";
import type { Product } from "../hooks/useProducts";
import { useSuppliers } from "../hooks/useSuppliers";
import type { Supplier } from "../hooks/useSuppliers";
import {
  exportAllData,
  getBusinessProfile,
  importAllData,
  saveBusinessProfile,
} from "../utils/localStorage";

function calcOutstanding(supplier: Supplier) {
  const purchases = supplier.transactions
    .filter((t) => t.type === "purchase")
    .reduce((s, t) => s + t.amount, 0);
  const payments = supplier.transactions
    .filter((t) => t.type === "payment")
    .reduce((s, t) => s + t.amount, 0);
  return purchases - payments;
}

export default function Settings() {
  const { products, addProduct, updateProduct, deleteProduct, resetToDefault } =
    useProducts();
  const { suppliers, addSupplier, renameSupplier, deleteSupplier } =
    useSuppliers();

  // ---- Product editing state ----
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editThickness, setEditThickness] = useState("");
  const [editPrice, setEditPrice] = useState("");

  // ---- New product form state ----
  const [newName, setNewName] = useState("");
  const [newThickness, setNewThickness] = useState("");
  const [newPrice, setNewPrice] = useState("");

  // ---- Supplier editing state ----
  const [renamingSupplierId, setRenamingSupplierId] = useState<string | null>(
    null,
  );
  const [supplierRenameValue, setSupplierRenameValue] = useState("");

  // ---- New supplier form state ----
  const [newSupplierName, setNewSupplierName] = useState("");
  const [showAddSupplier, setShowAddSupplier] = useState(false);

  // ---- Business Profile state ----
  const existingProfile = getBusinessProfile();
  const [profileName, setProfileName] = useState(existingProfile.businessName);
  const [profilePhone, setProfilePhone] = useState(existingProfile.phone);
  const [profileGst, setProfileGst] = useState(existingProfile.gst);
  const [profilePickup, setProfilePickup] = useState(
    existingProfile.pickupLocations,
  );
  const [profileLogo, setProfileLogo] = useState(existingProfile.logoBase64);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ---- Import ref ----
  const importInputRef = useRef<HTMLInputElement>(null);

  // ---- Product handlers ----
  const handleStartEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setEditName(p.name);
    setEditThickness(p.thickness);
    setEditPrice(String(p.price));
  };

  const handleSaveProduct = (id: string) => {
    const price = Number.parseFloat(editPrice);
    if (!editName.trim() || !editThickness.trim() || !price || price <= 0) {
      toast.error("Please fill all fields with valid values");
      return;
    }
    updateProduct(id, {
      name: editName.trim(),
      thickness: editThickness.trim(),
      price,
    });
    setEditingProductId(null);
    toast.success("Product updated");
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number.parseFloat(newPrice);
    if (!newName.trim() || !newThickness.trim() || !price || price <= 0) {
      toast.error("Please fill all fields with valid values");
      return;
    }
    addProduct({ name: newName.trim(), thickness: newThickness.trim(), price });
    setNewName("");
    setNewThickness("");
    setNewPrice("");
    toast.success("Product added");
  };

  // ---- Supplier handlers ----
  const handleStartRenameSupplier = (s: Supplier) => {
    setRenamingSupplierId(s.id);
    setSupplierRenameValue(s.name);
  };

  const handleConfirmRenameSupplier = () => {
    if (!renamingSupplierId || !supplierRenameValue.trim()) return;
    renameSupplier(renamingSupplierId, supplierRenameValue.trim());
    setRenamingSupplierId(null);
    toast.success("Supplier renamed");
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;
    addSupplier(newSupplierName.trim());
    setNewSupplierName("");
    setShowAddSupplier(false);
    toast.success("Supplier added");
  };

  const handleDeleteSupplier = (id: string) => {
    deleteSupplier(id);
    toast.success("Supplier removed");
  };

  // ---- Profile handlers ----
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfileLogo(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    saveBusinessProfile({
      businessName: profileName,
      phone: profilePhone,
      gst: profileGst,
      pickupLocations: profilePickup,
      logoBase64: profileLogo,
    });
    toast.success("Profile saved!");
  };

  // ---- Import handler ----
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      importAllData(text);
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
      data-ocid="settings.section"
    >
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your products, profile and data
        </p>
      </div>

      <Tabs defaultValue="products" data-ocid="settings.tab">
        <TabsList className="w-full justify-start gap-1 bg-muted/40 border border-border rounded-lg p-1 h-auto flex-wrap">
          <TabsTrigger
            value="products"
            className="text-xs px-3 py-1.5"
            data-ocid="settings.tab"
          >
            Products
          </TabsTrigger>
          <TabsTrigger
            value="suppliers"
            className="text-xs px-3 py-1.5"
            data-ocid="settings.tab"
          >
            Suppliers
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="text-xs px-3 py-1.5"
            data-ocid="settings.tab"
          >
            Business Profile
          </TabsTrigger>
          <TabsTrigger
            value="backup"
            className="text-xs px-3 py-1.5"
            data-ocid="settings.tab"
          >
            Backup &amp; Restore
          </TabsTrigger>
        </TabsList>

        {/* ─── PRODUCT MANAGEMENT ─── */}
        <TabsContent value="products" className="space-y-4 mt-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Product Management
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {products.length} products · used in billing
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#8B8589]/50 text-muted-foreground hover:text-foreground gap-1.5"
                  data-ocid="settings.secondary_button"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset to Default
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="settings.dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Reset to Default Products?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will replace your current product list with the
                    original 20 items. Any custom products or price changes will
                    be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="settings.cancel_button">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      resetToDefault();
                      toast.success("Product list reset to defaults");
                    }}
                    className="bg-[#353935] hover:bg-[#1e211e] text-white"
                    data-ocid="settings.confirm_button"
                  >
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#8B8589]/10 border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                      Thickness
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">
                      Price
                    </th>
                    <th className="py-3 px-4 text-right font-semibold text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => {
                    const isEditing = editingProductId === p.id;
                    return (
                      <tr
                        key={p.id}
                        className={`border-b border-border last:border-0 transition-colors ${
                          isEditing
                            ? "bg-[#436B95]/5"
                            : i % 2 === 0
                              ? ""
                              : "bg-muted/20"
                        }`}
                        data-ocid={`settings.row.${i + 1}`}
                      >
                        <td className="py-2.5 px-4">
                          {isEditing ? (
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8 text-sm bg-background border-border w-full"
                              data-ocid="settings.input"
                            />
                          ) : (
                            <span className="font-medium text-foreground">
                              {p.name}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {isEditing ? (
                            <Input
                              value={editThickness}
                              onChange={(e) => setEditThickness(e.target.value)}
                              className="h-8 text-sm bg-background border-border w-28"
                              data-ocid="settings.input"
                            />
                          ) : (
                            <span className="text-muted-foreground">
                              {p.thickness}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="h-8 text-sm bg-background border-border w-24 text-right ml-auto"
                              data-ocid="settings.input"
                            />
                          ) : (
                            <span className="font-medium text-foreground">
                              ₹{p.price.toLocaleString("en-IN")}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex justify-end gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveProduct(p.id)}
                                  className="p-1.5 rounded hover:bg-green-50 text-green-600 transition-colors"
                                  data-ocid="settings.save_button"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingProductId(null)}
                                  className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
                                  data-ocid="settings.cancel_button"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditProduct(p)}
                                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  data-ocid="settings.edit_button"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteProduct(p.id);
                                    toast.success("Product deleted");
                                  }}
                                  className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                                  data-ocid="settings.delete_button"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Add New Product
            </h4>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Product Name</Label>
                  <Input
                    placeholder="e.g. 8x10 Inch Frame"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-background border-border h-9 text-sm"
                    data-ocid="settings.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Thickness</Label>
                  <Input
                    placeholder="e.g. 1 Inch"
                    value={newThickness}
                    onChange={(e) => setNewThickness(e.target.value)}
                    className="bg-background border-border h-9 text-sm"
                    data-ocid="settings.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Price (₹)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="bg-background border-border h-9 text-sm"
                    data-ocid="settings.input"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="bg-[#436B95] hover:bg-[#355578] text-white"
                data-ocid="settings.primary_button"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Product
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* ─── SUPPLIER MANAGEMENT ─── */}
        <TabsContent value="suppliers" className="space-y-4 mt-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Supplier Management
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {suppliers.length} suppliers
              </p>
            </div>
            {!showAddSupplier && (
              <Button
                size="sm"
                onClick={() => setShowAddSupplier(true)}
                className="bg-[#436B95] hover:bg-[#355578] text-white gap-1.5"
                data-ocid="settings.open_modal_button"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Supplier
              </Button>
            )}
          </div>

          {showAddSupplier && (
            <form onSubmit={handleAddSupplier} className="flex gap-2">
              <Input
                placeholder="Supplier name"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                className="flex-1 bg-background border-border"
                autoFocus
                data-ocid="settings.input"
              />
              <Button
                type="submit"
                className="bg-[#436B95] hover:bg-[#355578] text-white"
                data-ocid="settings.submit_button"
              >
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddSupplier(false);
                  setNewSupplierName("");
                }}
                data-ocid="settings.cancel_button"
              >
                Cancel
              </Button>
            </form>
          )}

          {suppliers.length === 0 ? (
            <div
              className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground"
              data-ocid="settings.empty_state"
            >
              No suppliers yet. Add your first supplier above.
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#8B8589]/10 border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                      Supplier Name
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">
                      Outstanding Balance
                    </th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s, i) => {
                    const outstanding = calcOutstanding(s);
                    const isRenaming = renamingSupplierId === s.id;
                    return (
                      <tr
                        key={s.id}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                        data-ocid={`settings.row.${i + 1}`}
                      >
                        <td className="py-3 px-4">
                          {isRenaming ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={supplierRenameValue}
                                onChange={(e) =>
                                  setSupplierRenameValue(e.target.value)
                                }
                                className="h-7 text-sm bg-background border-border w-48"
                                data-ocid="settings.input"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleConfirmRenameSupplier();
                                  if (e.key === "Escape")
                                    setRenamingSupplierId(null);
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleConfirmRenameSupplier}
                                className="p-1 rounded hover:bg-green-50 text-green-600"
                                data-ocid="settings.save_button"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRenamingSupplierId(null)}
                                className="p-1 rounded hover:bg-muted"
                                data-ocid="settings.cancel_button"
                              >
                                <X className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-medium text-foreground">
                              {s.name}
                            </span>
                          )}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-semibold ${outstanding > 0 ? "text-[#436B95]" : "text-muted-foreground"}`}
                        >
                          ₹{outstanding.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartRenameSupplier(s)}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              data-ocid="settings.edit_button"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSupplier(s.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                              data-ocid="settings.delete_button"
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
          )}
          <p className="text-xs text-muted-foreground">
            💡 Manage transaction history from the{" "}
            <span className="font-medium text-foreground">Supplier Ledger</span>{" "}
            tab.
          </p>
        </TabsContent>

        {/* ─── BUSINESS PROFILE ─── */}
        <TabsContent value="profile" className="space-y-5 mt-5">
          <h3 className="font-serif text-lg font-bold text-foreground">
            Business Profile
          </h3>

          {/* Logo Upload */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              Business Logo
            </Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-[#8B8589]/50 bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                {profileLogo ? (
                  <img
                    src={profileLogo}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground text-center px-1">
                    No logo
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  data-ocid="settings.upload_button"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  className="border-[#436B95] text-[#436B95] hover:bg-[#436B95]/10"
                  data-ocid="settings.upload_button"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  {profileLogo ? "Change Logo" : "Upload Logo"}
                </Button>
                {profileLogo && (
                  <button
                    type="button"
                    onClick={() => setProfileLogo("")}
                    className="block text-xs text-red-500 hover:underline"
                  >
                    Remove logo
                  </button>
                )}
                <p className="text-xs text-muted-foreground">
                  Used in PDF receipts as header &amp; stamp
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Business Name
              </Label>
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="bg-background border-border"
                data-ocid="settings.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Phone Number
              </Label>
              <Input
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="bg-background border-border"
                data-ocid="settings.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                GST / Trade License{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                placeholder="e.g. 22AAAAA0000A1Z5"
                value={profileGst}
                onChange={(e) => setProfileGst(e.target.value)}
                className="bg-background border-border"
                data-ocid="settings.input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Pickup Locations
            </Label>
            <Textarea
              placeholder="e.g. Basugaon, Kokrajhar, Bongaigaon"
              value={profilePickup}
              onChange={(e) => setProfilePickup(e.target.value)}
              className="bg-background border-border resize-none"
              rows={2}
              data-ocid="settings.textarea"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated. Shown on PDF receipts.
            </p>
          </div>

          <Button
            onClick={handleSaveProfile}
            className="bg-[#436B95] hover:bg-[#355578] text-white"
            data-ocid="settings.save_button"
          >
            Save Profile
          </Button>
        </TabsContent>

        {/* ─── BACKUP & RESTORE ─── */}
        <TabsContent value="backup" className="space-y-5 mt-5">
          <h3 className="font-serif text-lg font-bold text-foreground">
            Backup &amp; Restore
          </h3>

          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">
                Export All Data
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Download all your orders, products, suppliers, investments, and
                profile as a JSON file.
              </p>
              <Button
                onClick={exportAllData}
                variant="outline"
                className="border-[#436B95] text-[#436B95] hover:bg-[#436B95]/10"
                data-ocid="settings.primary_button"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All Data
              </Button>
            </div>

            <div className="h-px bg-border" />

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">
                Import Data
              </h4>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <p className="text-xs text-amber-700 font-medium">
                  ⚠️ Warning: Importing will overwrite all current data. This
                  cannot be undone.
                </p>
              </div>
              <input
                ref={importInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => importInputRef.current?.click()}
                className="border-[#8B8589]/50 text-muted-foreground hover:text-foreground"
                data-ocid="settings.upload_button"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import from JSON
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
