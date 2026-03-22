import { Minus, Package, Plus } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  useDecrementStock,
  useGetAllInventory,
  useIncrementStock,
} from "../hooks/useQueries";

const FRAME_SIZES = [
  '4x6"',
  '5x7"',
  '6x8"',
  "A4",
  '12x16"',
  '12x18"',
  '18x24"',
];

const SIZE_DESCRIPTIONS: Record<string, string> = {
  '4x6"': "Small portrait / wallet",
  '5x7"': "Standard photo size",
  '6x8"': "Small display frame",
  A4: "A4 document / print",
  '12x16"': "Medium display",
  '12x18"': "Large portrait",
  '18x24"': "Poster size",
};

export default function Inventory() {
  const { data: inventory = {}, isLoading } = useGetAllInventory();
  const increment = useIncrementStock();
  const decrement = useDecrementStock();

  const totalPieces = FRAME_SIZES.reduce(
    (sum, s) => sum + (inventory[s] ?? 0),
    0,
  );
  const lowStockCount = FRAME_SIZES.filter(
    (s) => (inventory[s] ?? 0) <= 3,
  ).length;

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

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl shadow-card p-4">
          <p className="text-xs text-muted-foreground">Total Pieces</p>
          <p className="text-xl font-bold text-foreground font-serif mt-0.5">
            {totalPieces}
          </p>
        </div>
        <div
          className={`bg-card border rounded-xl shadow-card p-4 ${lowStockCount > 0 ? "border-amber-200" : "border-border"}`}
        >
          <p className="text-xs text-muted-foreground">Low Stock (≤3)</p>
          <p
            className={`text-xl font-bold font-serif mt-0.5 ${lowStockCount > 0 ? "text-amber-600" : "text-foreground"}`}
          >
            {lowStockCount}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        {isLoading ? (
          <div
            className="text-center py-8 text-muted-foreground"
            data-ocid="inventory.loading_state"
          >
            Loading inventory...
          </div>
        ) : (
          <div className="divide-y divide-border">
            {FRAME_SIZES.map((size, i) => {
              const count = inventory[size] ?? 0;
              const isLow = count <= 3;
              return (
                <motion.div
                  key={size}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4"
                  data-ocid={`inventory.item.${i + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${isLow ? "bg-amber-50" : "bg-[#F3E6B8]/50"}`}
                    >
                      <Package
                        className={`h-4 w-4 ${isLow ? "text-amber-500" : "text-[#8A6B12]"}`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {size}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {SIZE_DESCRIPTIONS[size]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isLow && (
                      <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Low
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (count <= 0) return;
                          await decrement.mutateAsync(size);
                          toast.success(`${size} stock updated`);
                        }}
                        disabled={count <= 0 || decrement.isPending}
                        className="w-8 h-8 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        data-ocid="inventory.button"
                      >
                        <Minus className="h-3.5 w-3.5 text-foreground" />
                      </button>
                      <span
                        className={`w-10 text-center text-base font-bold ${isLow ? "text-amber-600" : "text-foreground"}`}
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
                        data-ocid="inventory.button"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
