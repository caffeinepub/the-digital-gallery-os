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
import { useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Check,
  Minus,
  Package,
  Pencil,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  useDecrementStock,
  useGetAllInventory,
  useIncrementStock,
  useSetStock,
} from "../hooks/useQueries";
import {
  addInventorySize,
  getInventoryPhotos,
  getInventorySizes,
  getLowStockThreshold,
  removeInventoryPhoto,
  removeInventorySize,
  renameInventorySize,
  saveLowStockThreshold,
  setInventoryPhoto,
} from "../utils/localStorage";

export default function Inventory() {
  const { data: inventory = {}, isLoading } = useGetAllInventory();
  const increment = useIncrementStock();
  const decrement = useDecrementStock();
  const setStock = useSetStock();
  const qc = useQueryClient();

  const [sizes, setSizes] = useState<string[]>(() => getInventorySizes());
  const [threshold, setThreshold] = useState(() => getLowStockThreshold());
  const [thresholdInput, setThresholdInput] = useState(() =>
    String(getLowStockThreshold()),
  );
  const [editingSize, setEditingSize] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [renamingSize, setRenamingSize] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [photos, setPhotos] = useState<Record<string, string>>(() =>
    getInventoryPhotos(),
  );
  const [previewPhoto, setPreviewPhoto] = useState<{
    size: string;
    src: string;
  } | null>(null);
  const [newSizeName, setNewSizeName] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoTargetSize, setPhotoTargetSize] = useState<string | null>(null);

  const plainSizes = sizes.filter((s) => !s.includes("(Mount)"));
  const mountSizes = sizes.filter((s) => s.includes("(Mount)"));

  const totalPieces = sizes.reduce((sum, s) => sum + (inventory[s] ?? 0), 0);
  const lowStockCount =
    threshold > 0
      ? sizes.filter(
          (s) => (inventory[s] ?? 0) <= threshold && (inventory[s] ?? 0) > 0,
        ).length
      : 0;

  const handleStartEdit = (size: string, count: number) => {
    setEditingSize(size);
    setEditValue(String(count));
  };

  const handleSaveEdit = async (size: string) => {
    const val = Number.parseInt(editValue, 10);
    if (Number.isNaN(val) || val < 0) {
      toast.error("Please enter a valid number");
      return;
    }
    await setStock.mutateAsync({ size, value: val });
    setEditingSize(null);
    toast.success(`${size} stock set to ${val}`);
  };

  const handleStartRename = (size: string) => {
    setRenamingSize(size);
    setRenameValue(size);
    // Close stock editor if open
    setEditingSize(null);
  };

  const handleSaveRename = (oldName: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      toast.error("Size name cannot be empty");
      return;
    }
    if (trimmed !== oldName && sizes.includes(trimmed)) {
      toast.error("A size with this name already exists");
      return;
    }
    renameInventorySize(oldName, trimmed);
    setSizes(getInventorySizes());
    // Also update photos local state key if needed
    if (trimmed !== oldName) {
      setPhotos((prev) => {
        if (!(oldName in prev)) return prev;
        const next = { ...prev };
        next[trimmed] = next[oldName];
        delete next[oldName];
        return next;
      });
    }
    qc.invalidateQueries({ queryKey: ["inventory"] });
    setRenamingSize(null);
    toast.success(`Renamed to "${trimmed}"`);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoTargetSize) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setInventoryPhoto(photoTargetSize, base64);
      setPhotos((prev) => ({ ...prev, [photoTargetSize]: base64 }));
      toast.success(`Photo added for ${photoTargetSize}`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemovePhoto = (size: string) => {
    removeInventoryPhoto(size);
    setPhotos((prev) => {
      const updated = { ...prev };
      delete updated[size];
      return updated;
    });
    toast.success("Photo removed");
  };

  const handleAddSize = () => {
    const trimmed = newSizeName.trim();
    if (!trimmed) {
      toast.error("Please enter a size name");
      return;
    }
    if (sizes.includes(trimmed)) {
      toast.error("This size already exists");
      return;
    }
    addInventorySize(trimmed);
    setSizes(getInventorySizes());
    setNewSizeName("");
    qc.invalidateQueries({ queryKey: ["inventory"] });
    toast.success(`${trimmed} added to inventory`);
  };

  const handleRemoveSize = (size: string) => {
    removeInventorySize(size);
    setSizes(getInventorySizes());
    qc.invalidateQueries({ queryKey: ["inventory"] });
    toast.success(`${size} removed from inventory`);
  };

  const handleSaveThreshold = () => {
    const val = Number.parseInt(thresholdInput, 10);
    const n = Number.isNaN(val) ? 0 : Math.max(0, val);
    saveLowStockThreshold(n);
    setThreshold(n);
    toast.success(
      n === 0
        ? "Low stock warnings disabled"
        : `Low stock warning set at \u2264${n} pieces`,
    );
  };

  const renderSizeRow = (size: string, i: number) => {
    const count = inventory[size] ?? 0;
    const isLow = threshold > 0 && count <= threshold;
    const photo = photos[size];
    const isEditing = editingSize === size;
    const isRenaming = renamingSize === size;

    return (
      <motion.div
        key={size}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.03 }}
        className="p-4"
        data-ocid={`inventory.item.${i + 1}`}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Left: photo thumbnail + info / rename input */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => {
                if (isRenaming) return;
                if (photo) {
                  setPreviewPhoto({ size, src: photo });
                } else {
                  setPhotoTargetSize(size);
                  photoInputRef.current?.click();
                }
              }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border transition-colors ${
                photo
                  ? "border-[#436B95]/30 bg-transparent"
                  : isLow
                    ? "bg-amber-50 border-amber-200 hover:bg-amber-100"
                    : "bg-[#F3E6B8]/50 border-[#D4AF37]/30 hover:bg-[#F3E6B8]"
              }`}
              title={photo ? `View ${size} photo` : `Add photo for ${size}`}
            >
              {photo ? (
                <img
                  src={photo}
                  alt={size}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package
                  className={`h-4 w-4 ${isLow ? "text-amber-500" : "text-[#8A6B12]"}`}
                />
              )}
            </button>

            {isRenaming ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="flex-1 h-8 px-2 text-sm font-semibold border border-[#436B95] rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-[#436B95]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveRename(size);
                  if (e.key === "Escape") setRenamingSize(null);
                }}
                data-ocid={"inventory.input"}
              />
            ) : (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {size}
                </p>
              </div>
            )}
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isRenaming ? (
              // Rename mode: show only save/cancel
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSaveRename(size)}
                  className="w-8 h-8 rounded-lg bg-[#436B95] text-white flex items-center justify-center hover:bg-[#355578]"
                  title="Save rename"
                  data-ocid={"inventory.save_button"}
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRenamingSize(null)}
                  className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted"
                  title="Cancel rename"
                  data-ocid={"inventory.cancel_button"}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                {isLow && !isEditing && (
                  <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Low
                  </span>
                )}

                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-16 h-8 text-center text-sm font-bold border border-[#436B95] rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-[#436B95]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(size);
                        if (e.key === "Escape") setEditingSize(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(size)}
                      className="w-8 h-8 rounded-lg bg-[#436B95] text-white flex items-center justify-center hover:bg-[#355578]"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSize(null)}
                      className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        if (count <= 0) return;
                        await decrement.mutateAsync(size);
                        toast.success(`${size} stock updated`);
                      }}
                      disabled={count <= 0 || decrement.isPending}
                      className="w-8 h-8 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-3.5 w-3.5 text-foreground" />
                    </button>
                    <span
                      className={`w-10 text-center text-base font-bold ${
                        isLow ? "text-amber-600" : "text-foreground"
                      }`}
                    >
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await increment.mutateAsync(size);
                        toast.success(`${size} stock updated`);
                      }}
                      disabled={increment.isPending}
                      className="w-8 h-8 rounded-lg bg-[#D4AF37] hover:bg-[#b8962e] text-white flex items-center justify-center transition-colors disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(size, count)}
                      className="w-8 h-8 rounded-lg border border-border bg-background hover:bg-[#436B95]/10 hover:text-[#436B95] hover:border-[#436B95]/30 flex items-center justify-center transition-colors"
                      title="Edit stock count"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartRename(size)}
                      className="w-8 h-8 rounded-lg border border-border bg-background hover:bg-[#436B95]/10 hover:text-[#436B95] hover:border-[#436B95]/30 flex items-center justify-center transition-colors"
                      title="Rename this size"
                      data-ocid={`inventory.edit_button.${i + 1}`}
                    >
                      <Tag className="h-3.5 w-3.5" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-lg border border-red-200 bg-background hover:bg-red-50 hover:text-red-600 text-red-400 flex items-center justify-center transition-colors"
                          title="Remove this size"
                          data-ocid={`inventory.delete_button.${i + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove "{size}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this size from
                            inventory and delete any stock data. This cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-ocid="inventory.cancel_button">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveSize(size)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            data-ocid="inventory.confirm_button"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Photo actions shown below when photo exists */}
        {photo && !isRenaming && (
          <div className="mt-2 flex items-center gap-2 pl-13">
            <button
              type="button"
              onClick={() => {
                setPhotoTargetSize(size);
                photoInputRef.current?.click();
              }}
              className="text-xs text-[#436B95] hover:underline flex items-center gap-1"
            >
              <Camera className="h-3 w-3" /> Change photo
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              type="button"
              onClick={() => handleRemovePhoto(size)}
              className="text-xs text-red-400 hover:underline flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
      data-ocid="inventory.section"
    >
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Inventory
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Frame stock by pieces
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl shadow-card p-4">
          <p className="text-xs text-muted-foreground">Total Pieces</p>
          <p className="text-xl font-bold text-foreground font-serif mt-0.5">
            {totalPieces}
          </p>
        </div>
        <div
          className={`bg-card border rounded-xl shadow-card p-4 ${
            threshold > 0 && lowStockCount > 0
              ? "border-amber-200"
              : "border-border"
          }`}
        >
          <p className="text-xs text-muted-foreground">
            {threshold > 0 ? `Low Stock (\u2264${threshold})` : "Low Stock"}
          </p>
          <p
            className={`text-xl font-bold font-serif mt-0.5 ${
              threshold > 0 && lowStockCount > 0
                ? "text-amber-600"
                : "text-muted-foreground"
            }`}
          >
            {threshold > 0 ? lowStockCount : "\u2014"}
          </p>
        </div>
      </div>

      {/* Low stock threshold setting */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-foreground mb-2">
          \u26a0\ufe0f Low Stock Warning Threshold
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={thresholdInput}
            onChange={(e) => setThresholdInput(e.target.value)}
            className="w-20 h-8 text-center text-sm font-bold border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-[#436B95]"
            placeholder="0"
            data-ocid="inventory.input"
          />
          <span className="text-sm text-muted-foreground">pieces</span>
          <button
            type="button"
            onClick={handleSaveThreshold}
            className="h-8 px-3 rounded-lg bg-[#436B95] text-white text-xs font-semibold hover:bg-[#355578] transition-colors"
            data-ocid="inventory.save_button"
          >
            Save
          </button>
          <span className="text-xs text-muted-foreground">
            {threshold === 0 ? "(disabled)" : `warn when \u2264${threshold}`}
          </span>
        </div>
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Plain Frames Section */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">
            \ud83d\uddbc Plain Frames
          </h3>
          <p className="text-xs text-muted-foreground">
            {plainSizes.length} sizes
          </p>
        </div>
        {isLoading ? (
          <div
            className="text-center py-8 text-muted-foreground"
            data-ocid="inventory.loading_state"
          >
            Loading inventory...
          </div>
        ) : plainSizes.length === 0 ? (
          <div
            className="text-center py-8 text-muted-foreground"
            data-ocid="inventory.empty_state"
          >
            No plain frame sizes
          </div>
        ) : (
          <div className="divide-y divide-border">
            {plainSizes.map((size, i) => renderSizeRow(size, i))}
          </div>
        )}
      </div>

      {/* Mount Frames Section */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">
            \ud83d\uddc2 Mount Frames
          </h3>
          <p className="text-xs text-muted-foreground">
            {mountSizes.length} sizes
          </p>
        </div>
        {mountSizes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No mount frame sizes
          </div>
        ) : (
          <div className="divide-y divide-border">
            {mountSizes.map((size, i) =>
              renderSizeRow(size, plainSizes.length + i),
            )}
          </div>
        )}
      </div>

      {/* Add new size */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Add Custom Frame Size
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            e.g. <span className="font-mono">20x24"</span> for plain,{" "}
            <span className="font-mono">20x24" (Mount)</span> for mount
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSizeName}
            onChange={(e) => setNewSizeName(e.target.value)}
            placeholder='e.g. 20x24" or 20x24" (Mount)'
            className="flex-1 h-9 px-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-[#436B95]"
            onKeyDown={(e) => e.key === "Enter" && handleAddSize()}
            data-ocid="inventory.search_input"
          />
          <button
            type="button"
            onClick={handleAddSize}
            className="h-9 px-4 rounded-lg bg-[#353935] text-white text-sm font-semibold hover:bg-[#252725] transition-colors flex items-center gap-1.5"
            data-ocid="inventory.primary_button"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      {/* Photo preview modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={() => setPreviewPhoto(null)}
          onKeyDown={(e) => e.key === "Escape" && setPreviewPhoto(null)}
          role="presentation"
        >
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={() => {}}
          >
            <img
              src={previewPhoto.src}
              alt={previewPhoto.size}
              className="max-w-xs max-h-80 rounded-xl object-contain shadow-2xl"
            />
            <div className="text-center text-white mt-2 text-sm font-medium">
              {previewPhoto.size}
            </div>
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-3 -right-3 bg-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg text-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
