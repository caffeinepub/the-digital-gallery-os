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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  Download,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RotateCcw,
  Shield,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useFeatureFlags } from "../hooks/useFeatureFlags";
import { useProducts } from "../hooks/useProducts";
import type { Product } from "../hooks/useProducts";
import { useSuppliers } from "../hooks/useSuppliers";
import type { Supplier } from "../hooks/useSuppliers";
import {
  exportAllData,
  getAppPin,
  getBusinessProfile,
  importAllData,
  saveAppPin,
  saveBusinessProfile,
  setSessionUnlocked,
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

interface SettingsProps {
  onProfileSaved?: () => void;
}

function SecurityTab({ onProfileSaved }: { onProfileSaved?: () => void }) {
  const [currentPin, setCurrentPin] = useState(() => getAppPin());
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState("");

  const handleSetPin = () => {
    if (newPin.length < 4) {
      setPinError("PIN must be at least 4 characters");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("PINs do not match");
      return;
    }
    saveAppPin(newPin);
    setSessionUnlocked(true);
    setCurrentPin(newPin);
    setNewPin("");
    setConfirmPin("");
    setPinError("");
    toast.success("PIN set successfully! You are now the owner.");
    onProfileSaved?.();
  };

  const handleRemovePin = () => {
    saveAppPin("");
    setSessionUnlocked(true);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setPinError("");
    toast.success("PIN removed. App is now open access.");
    onProfileSaved?.();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#436B95]" />
          <div>
            <h3 className="font-semibold text-foreground">PIN Protection</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set a PIN so only you can access this app. Others will see a lock
              screen.
            </p>
          </div>
        </div>

        {currentPin && (
          <div className="flex items-center gap-2 py-2 px-3 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-green-700 text-sm font-semibold">
              🔒 PIN is active
            </span>
            <span className="text-green-600 text-xs ml-auto">
              App is protected
            </span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-foreground">
              {currentPin ? "New PIN" : "Set PIN"}
            </Label>
            <div className="relative mt-1">
              <input
                type={showPin ? "text" : "password"}
                value={newPin}
                onChange={(e) => {
                  setNewPin(e.target.value);
                  setPinError("");
                }}
                placeholder="Minimum 4 characters"
                className="w-full h-10 px-3 pr-10 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#436B95]"
                data-ocid="security.input"
              />
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground">
              Confirm PIN
            </Label>
            <input
              type={showPin ? "text" : "password"}
              value={confirmPin}
              onChange={(e) => {
                setConfirmPin(e.target.value);
                setPinError("");
              }}
              placeholder="Re-enter PIN"
              className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#436B95] mt-1"
              data-ocid="security.textarea"
            />
          </div>

          {pinError && (
            <p
              className="text-sm text-red-500"
              data-ocid="security.error_state"
            >
              {pinError}
            </p>
          )}

          <button
            type="button"
            onClick={handleSetPin}
            disabled={!newPin || !confirmPin}
            className="w-full h-10 rounded-lg bg-[#436B95] text-white font-semibold text-sm hover:bg-[#355578] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-ocid="security.submit_button"
          >
            {currentPin ? "Change PIN" : "Set PIN"}
          </button>
        </div>
      </div>

      {currentPin && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="w-full h-10 rounded-lg border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
              data-ocid="security.delete_button"
            >
              Remove PIN Protection
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove PIN Protection?</AlertDialogTitle>
              <AlertDialogDescription>
                This will allow anyone to access the app without a PIN. You can
                always set a new PIN later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="security.cancel_button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemovePin}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-ocid="security.confirm_button"
              >
                Remove PIN
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Once set, the PIN is stored only on this device. The owner (you) stays
        logged in during the session.
      </p>
    </div>
  );
}

export default function Settings({ onProfileSaved }: SettingsProps) {
  const { products, addProduct, updateProduct, deleteProduct, resetToDefault } =
    useProducts();
  const { suppliers, addSupplier, renameSupplier, deleteSupplier } =
    useSuppliers();
  const { flags, updateFlag } = useFeatureFlags();

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
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
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
    if (!editName.trim() || Number.isNaN(price)) {
      toast.error("Please fill in all fields correctly");
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

  const handleAddProduct = () => {
    const price = Number.parseFloat(newPrice);
    if (!newName.trim() || Number.isNaN(price)) {
      toast.error("Please fill in name and price");
      return;
    }
    addProduct({
      name: newName.trim(),
      thickness: newThickness.trim(),
      price,
    });
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

  const handleSaveRenameSupplier = (id: string) => {
    if (!supplierRenameValue.trim()) return;
    renameSupplier(id, supplierRenameValue.trim());
    setRenamingSupplierId(null);
    toast.success("Supplier renamed");
  };

  const handleAddSupplier = () => {
    if (!newSupplierName.trim()) return;
    addSupplier(newSupplierName.trim(), newSupplierPhone.trim() || undefined);
    setNewSupplierName("");
    setNewSupplierPhone("");
    setShowAddSupplier(false);
    toast.success("Supplier added");
  };

  // ---- Logo upload handler ----
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setProfileLogo(base64);
    };
    reader.readAsDataURL(file);
  };

  // ---- Save profile ----
  const handleSaveProfile = () => {
    saveBusinessProfile({
      businessName: profileName,
      phone: profilePhone,
      gst: profileGst,
      pickupLocations: profilePickup,
      logoBase64: profileLogo,
    });
    toast.success("Profile saved! Logo updated everywhere.");
    onProfileSaved?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
      data-ocid="settings.section"
    >
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage products, suppliers, profile & data
        </p>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="w-full grid grid-cols-6 mb-4">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="visibility">Visibility</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* ── PRODUCTS TAB ── */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {products.length} products
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  data-ocid="settings.reset_button"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset to Default
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Reset to Default Products?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will replace all products with the default frame list.
                    Current products will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      resetToDefault();
                      toast.success("Products reset to default");
                    }}
                    className="bg-[#436B95] hover:bg-[#355578]"
                  >
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {products.map((p) => (
                <div key={p.id} className="p-3">
                  {editingProductId === p.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Name"
                          className="h-8 text-xs col-span-2"
                          data-ocid="settings.input"
                        />
                        <Input
                          value={editThickness}
                          onChange={(e) => setEditThickness(e.target.value)}
                          placeholder='Thickness (e.g. 1")'
                          className="h-8 text-xs"
                          data-ocid="settings.input"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder="Price (₹)"
                          type="number"
                          className="h-8 text-xs flex-1"
                          data-ocid="settings.input"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveProduct(p.id)}
                          className="h-8 px-3 bg-[#436B95] hover:bg-[#355578] text-white"
                          data-ocid="settings.save_button"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingProductId(null)}
                          className="h-8 px-3"
                          data-ocid="settings.cancel_button"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {p.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.thickness && `${p.thickness} · `}₹
                          {p.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEditProduct(p)}
                          className="h-7 w-7 p-0 hover:bg-[#436B95]/10 hover:text-[#436B95]"
                          data-ocid="settings.edit_button"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-500"
                              data-ocid="settings.delete_button"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Product?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Delete "{p.name}"? This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  deleteProduct(p.id);
                                  toast.success("Product deleted");
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
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add new product */}
          <div className="bg-[#436B95]/5 border border-[#436B95]/20 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-[#436B95]">
              Add New Product
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder='e.g. 20x24"'
                className="h-8 text-xs col-span-2"
                data-ocid="settings.input"
              />
              <Input
                value={newThickness}
                onChange={(e) => setNewThickness(e.target.value)}
                placeholder='e.g. 1"'
                className="h-8 text-xs"
                data-ocid="settings.input"
              />
            </div>
            <div className="flex gap-2">
              <Input
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Price (₹)"
                type="number"
                className="h-8 text-xs flex-1"
                data-ocid="settings.input"
              />
              <Button
                size="sm"
                onClick={handleAddProduct}
                className="h-8 px-4 bg-[#436B95] hover:bg-[#355578] text-white text-xs gap-1.5"
                data-ocid="settings.add_button"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── SUPPLIERS TAB ── */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {suppliers.length} suppliers
            </p>
            <Button
              size="sm"
              onClick={() => setShowAddSupplier(!showAddSupplier)}
              className="h-8 text-xs gap-1.5 bg-[#436B95] hover:bg-[#355578] text-white"
              data-ocid="settings.add_supplier_button"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Supplier
            </Button>
          </div>

          {showAddSupplier && (
            <div className="bg-[#436B95]/5 border border-[#436B95]/20 rounded-xl p-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Supplier name"
                  className="h-8 text-xs flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleAddSupplier()}
                  autoFocus
                  data-ocid="settings.input"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX (optional)"
                  className="h-8 text-xs flex-1"
                  data-ocid="settings.input"
                />
                <Button
                  size="sm"
                  onClick={handleAddSupplier}
                  className="h-8 px-3 bg-[#436B95] hover:bg-[#355578] text-white"
                  data-ocid="settings.confirm_button"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddSupplier(false)}
                  className="h-8 px-3"
                  data-ocid="settings.cancel_button"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {suppliers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No suppliers yet
                </p>
              )}
              {suppliers.map((s) => {
                const outstanding = calcOutstanding(s);
                return (
                  <div key={s.id} className="p-3">
                    {renamingSupplierId === s.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={supplierRenameValue}
                          onChange={(e) =>
                            setSupplierRenameValue(e.target.value)
                          }
                          className="h-8 text-xs flex-1"
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSaveRenameSupplier(s.id)
                          }
                          autoFocus
                          data-ocid="settings.input"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveRenameSupplier(s.id)}
                          className="h-8 px-3 bg-[#436B95] hover:bg-[#355578] text-white"
                          data-ocid="settings.save_button"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRenamingSupplierId(null)}
                          className="h-8 px-3"
                          data-ocid="settings.cancel_button"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {s.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.transactions.length} transactions ·{" "}
                            {outstanding > 0 ? (
                              <span className="text-[#436B95] font-medium">
                                ₹{outstanding.toLocaleString("en-IN")} due
                              </span>
                            ) : (
                              <span className="text-green-600">Cleared</span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartRenameSupplier(s)}
                            className="h-7 w-7 p-0 hover:bg-[#436B95]/10 hover:text-[#436B95]"
                            data-ocid="settings.edit_button"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-500"
                                data-ocid="settings.delete_button"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Supplier?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Delete "{s.name}" and all their{" "}
                                  {s.transactions.length} transactions? This
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    deleteSupplier(s.id);
                                    toast.success("Supplier deleted");
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
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ── PROFILE TAB ── */}
        <TabsContent value="profile" className="space-y-4">
          {/* Logo upload */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <Label className="text-sm font-semibold text-foreground">
              Business Logo
            </Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                {profileLogo ? (
                  <img
                    src={profileLogo}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  className="h-8 text-xs gap-1.5"
                  data-ocid="settings.upload_button"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {profileLogo ? "Change Logo" : "Upload Logo"}
                </Button>
                {profileLogo && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setProfileLogo("")}
                    className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                    data-ocid="settings.remove_button"
                  >
                    Remove
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  Shows in app header & on all bills
                </p>
              </div>
            </div>
          </div>

          {/* Business details */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <Label className="text-sm font-semibold text-foreground">
              Business Details
            </Label>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Business Name
                </Label>
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="The Digital Gallery by Emon"
                  className="h-9 text-sm"
                  data-ocid="settings.input"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Phone Number
                </Label>
                <Input
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="h-9 text-sm"
                  data-ocid="settings.input"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  GST / Trade License (optional)
                </Label>
                <Input
                  value={profileGst}
                  onChange={(e) => setProfileGst(e.target.value)}
                  placeholder="GSTIN or License No."
                  className="h-9 text-sm"
                  data-ocid="settings.input"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Pickup Locations
                </Label>
                <Textarea
                  value={profilePickup}
                  onChange={(e) => setProfilePickup(e.target.value)}
                  placeholder="Basugaon, Kokrajhar, Bongaigaon, Barpeta Road"
                  className="text-sm resize-none"
                  rows={2}
                  data-ocid="settings.input"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            className="w-full h-10 bg-[#436B95] hover:bg-[#355578] text-white font-semibold"
            data-ocid="settings.save_profile_button"
          >
            Save Profile
          </Button>
        </TabsContent>

        {/* ── DATA TAB ── */}
        <TabsContent value="data" className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Backup & Restore
            </p>
            <p className="text-xs text-muted-foreground">
              All your data (orders, inventory, suppliers, profile) is saved in
              this browser. Export a backup file to keep it safe.
            </p>

            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  exportAllData();
                  toast.success("Backup downloaded!");
                }}
                className="w-full h-9 text-sm gap-2"
                data-ocid="settings.export_button"
              >
                <Download className="h-4 w-4" />
                Download Backup (JSON)
              </Button>

              <input
                ref={importInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const text = ev.target?.result as string;
                    importAllData(text);
                  };
                  reader.readAsText(file);
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => importInputRef.current?.click()}
                className="w-full h-9 text-sm gap-2"
                data-ocid="settings.import_button"
              >
                <Upload className="h-4 w-4" />
                Import Backup
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── VISIBILITY TAB ── */}
        <TabsContent value="visibility" className="space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground">
                Module Visibility
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Turn off tabs you do not use. Billing is always on.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { key: "khatabook" as const, label: "Khatabook" },
                { key: "inventory" as const, label: "Inventory" },
                { key: "suppliers" as const, label: "Suppliers" },
                { key: "reports" as const, label: "Reports" },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-1"
                >
                  <span className="font-semibold text-sm text-foreground">
                    {label}
                  </span>
                  <Switch
                    checked={flags[key]}
                    onCheckedChange={(val) => updateFlag(key, val)}
                    data-ocid={`visibility.${key}.switch`}
                  />
                </div>
              ))}
              <div className="flex items-center justify-between py-1 opacity-50">
                <span className="font-semibold text-sm text-foreground">
                  Billing{" "}
                  <span className="text-muted-foreground font-normal">
                    (always on)
                  </span>
                </span>
                <Switch checked={true} disabled />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── SECURITY TAB ── */}
        <TabsContent value="security" className="space-y-4">
          <SecurityTab onProfileSaved={onProfileSaved} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
