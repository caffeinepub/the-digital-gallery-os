import type { CustomerOrder } from "../backend";
import { OrderStatus } from "../backend";

const KEYS = {
  orders: "gallery_orders",
  inventory: "gallery_inventory",
  notes: "gallery_notes",
  suppliers: "gallery_suppliers",
  investments: "gallery_investments",
  profile: "gallery_profile",
  products: "dg_products",
  inventoryPhotos: "gallery_inventory_photos",
  inventorySizes: "gallery_inventory_sizes",
  appPin: "dg_app_pin",
  lowStockThreshold: "dg_low_stock_threshold",
  billCounter: "dg_bill_counter",
};

export const DEFAULT_PLAIN_SIZES = [
  '4x6"',
  '5x7"',
  '6x8"',
  "A4",
  '12x16"',
  '12x18"',
  '18x24"',
];

export const DEFAULT_MOUNT_SIZES = [
  '4x6" (Mount)',
  '5x7" (Mount)',
  '6x8" (Mount)',
  "A4 (Mount)",
  '12x16" (Mount)',
  '12x18" (Mount)',
  '18x24" (Mount)',
];

export const DEFAULT_FRAME_SIZES = [
  ...DEFAULT_PLAIN_SIZES,
  ...DEFAULT_MOUNT_SIZES,
];

// ---- Bill Counter (sequential bill numbers) ----
export function getNextBillNumber(): number {
  try {
    const raw = localStorage.getItem(KEYS.billCounter);
    const current = raw ? Number.parseInt(raw, 10) : 0;
    const next = current + 1;
    localStorage.setItem(KEYS.billCounter, String(next));
    return next;
  } catch {
    return Date.now() % 9999;
  }
}

export function getCurrentBillNumber(): number {
  try {
    const raw = localStorage.getItem(KEYS.billCounter);
    return raw ? Number.parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

// ---- Inventory Sizes ----
export function getInventorySizes(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.inventorySizes);
    if (raw) return JSON.parse(raw) as string[];
  } catch {}
  return [...DEFAULT_FRAME_SIZES];
}

export function saveInventorySizes(sizes: string[]) {
  try {
    localStorage.setItem(KEYS.inventorySizes, JSON.stringify(sizes));
  } catch {}
}

export function addInventorySize(size: string) {
  const sizes = getInventorySizes();
  if (!sizes.includes(size)) {
    sizes.push(size);
    saveInventorySizes(sizes);
  }
}

export function removeInventorySize(size: string) {
  const sizes = getInventorySizes().filter((s) => s !== size);
  saveInventorySizes(sizes);
  const inv = getLocalInventory();
  delete inv[size];
  saveLocalInventory(inv);
  removeInventoryPhoto(size);
}

export function renameInventorySize(oldName: string, newName: string) {
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) return;
  const sizes = getInventorySizes();
  const idx = sizes.indexOf(oldName);
  if (idx === -1) return;
  sizes[idx] = trimmed;
  saveInventorySizes(sizes);
  const inv = getLocalInventory();
  if (oldName in inv) {
    inv[trimmed] = inv[oldName];
    delete inv[oldName];
    saveLocalInventory(inv);
  }
  const photos = getInventoryPhotos();
  if (oldName in photos) {
    photos[trimmed] = photos[oldName];
    delete photos[oldName];
    saveInventoryPhotos(photos);
  }
}

// ---- App PIN ----
export function getAppPin(): string {
  try {
    return localStorage.getItem(KEYS.appPin) ?? "";
  } catch {
    return "";
  }
}

export function saveAppPin(pin: string) {
  try {
    if (pin) {
      localStorage.setItem(KEYS.appPin, pin);
    } else {
      localStorage.removeItem(KEYS.appPin);
    }
  } catch {}
}

export function isSessionUnlocked(): boolean {
  try {
    return sessionStorage.getItem("dg_unlocked") === "1";
  } catch {
    return true;
  }
}

export function setSessionUnlocked(value: boolean) {
  try {
    if (value) {
      sessionStorage.setItem("dg_unlocked", "1");
    } else {
      sessionStorage.removeItem("dg_unlocked");
    }
  } catch {}
}

// ---- Low Stock Threshold ----
export function getLowStockThreshold(): number {
  try {
    const raw = localStorage.getItem(KEYS.lowStockThreshold);
    if (raw) return Number(raw);
  } catch {}
  return 0;
}

export function saveLowStockThreshold(n: number) {
  try {
    localStorage.setItem(KEYS.lowStockThreshold, String(n));
  } catch {}
}

// ---- Orders ----
export function getLocalOrders(): (CustomerOrder & {
  customerPhone?: string;
  deliveryAddress?: string;
  billNumber?: number;
})[] {
  try {
    const raw = localStorage.getItem(KEYS.orders);
    if (raw) {
      const parsed = JSON.parse(raw) as (CustomerOrder & {
        customerPhone?: string;
        deliveryAddress?: string;
        billNumber?: number;
      })[];
      return parsed.map((o) => ({
        ...o,
        id: BigInt(String(o.id)),
        orderDate: BigInt(String(o.orderDate)),
        items: (o.items || []).map((item) => ({
          ...item,
          quantity: BigInt(String(item.quantity)),
        })),
      }));
    }
  } catch {
    // ignore
  }
  saveLocalOrders([]);
  return [];
}

export function saveLocalOrders(
  orders: (CustomerOrder & {
    customerPhone?: string;
    deliveryAddress?: string;
    billNumber?: number;
  })[],
) {
  try {
    localStorage.setItem(
      KEYS.orders,
      JSON.stringify(orders, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );
  } catch {
    // ignore
  }
}

export function addLocalOrder(
  order: CustomerOrder & { billNumber?: number },
  customerPhone?: string,
  deliveryAddress?: string,
) {
  const orders = getLocalOrders();
  orders.unshift({ ...order, customerPhone, deliveryAddress });
  saveLocalOrders(orders);
}

export function deleteLocalOrder(id: bigint) {
  const orders = getLocalOrders().filter((o) => String(o.id) !== String(id));
  saveLocalOrders(orders);
}

export function updateLocalOrderStatus(id: bigint, status: OrderStatus) {
  const orders = getLocalOrders();
  const updated = orders.map((o) =>
    String(o.id) === String(id) ? { ...o, status } : o,
  );
  saveLocalOrders(updated);
}

export function settleLocalBalance(id: bigint) {
  const orders = getLocalOrders();
  const updated = orders.map((o) =>
    String(o.id) === String(id)
      ? {
          ...o,
          advancePaid: o.totalAmount,
          balanceDue: 0,
          status: OrderStatus.delivered,
        }
      : o,
  );
  saveLocalOrders(updated);
}

// ---- Inventory ----
export function getLocalInventory(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEYS.inventory);
    const stored: Record<string, number> = raw
      ? (JSON.parse(raw) as Record<string, number>)
      : {};
    const sizes = getInventorySizes();
    const merged: Record<string, number> = {};
    for (const s of sizes) {
      merged[s] = stored[s] ?? 0;
    }
    for (const k of Object.keys(stored)) {
      if (!(k in merged)) merged[k] = stored[k];
    }
    return merged;
  } catch {
    // ignore
  }
  const defaults: Record<string, number> = {};
  for (const s of DEFAULT_FRAME_SIZES) {
    defaults[s] = 0;
  }
  saveLocalInventory(defaults);
  return defaults;
}

export function saveLocalInventory(inv: Record<string, number>) {
  try {
    localStorage.setItem(KEYS.inventory, JSON.stringify(inv));
  } catch {
    // ignore
  }
}

export function adjustLocalStock(size: string, delta: number) {
  const inv = getLocalInventory();
  inv[size] = Math.max(0, (inv[size] ?? 0) + delta);
  saveLocalInventory(inv);
}

export function setLocalStock(size: string, value: number) {
  const inv = getLocalInventory();
  inv[size] = Math.max(0, value);
  saveLocalInventory(inv);
}

// ---- Inventory Photos ----
export function getInventoryPhotos(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEYS.inventoryPhotos);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {
    // ignore
  }
  return {};
}

export function saveInventoryPhotos(photos: Record<string, string>) {
  try {
    localStorage.setItem(KEYS.inventoryPhotos, JSON.stringify(photos));
  } catch {
    // ignore
  }
}

export function setInventoryPhoto(size: string, base64: string) {
  const photos = getInventoryPhotos();
  photos[size] = base64;
  saveInventoryPhotos(photos);
}

export function removeInventoryPhoto(size: string) {
  const photos = getInventoryPhotos();
  delete photos[size];
  saveInventoryPhotos(photos);
}

// ---- Supplier Notes (legacy) ----
export interface LocalNote {
  id: string;
  text: string;
  timestamp: number;
}

export function getLocalNotes(): LocalNote[] {
  try {
    const raw = localStorage.getItem(KEYS.notes);
    if (raw) return JSON.parse(raw) as LocalNote[];
  } catch {
    // ignore
  }
  return [];
}

export function saveLocalNotes(notes: LocalNote[]) {
  try {
    localStorage.setItem(KEYS.notes, JSON.stringify(notes));
  } catch {
    // ignore
  }
}

export function addLocalNote(text: string): LocalNote {
  const note: LocalNote = {
    id: `note-${Date.now()}`,
    text,
    timestamp: Date.now(),
  };
  const notes = getLocalNotes();
  notes.unshift(note);
  saveLocalNotes(notes);
  return note;
}

export function deleteLocalNote(id: string) {
  const notes = getLocalNotes().filter((n) => n.id !== id);
  saveLocalNotes(notes);
}

// ---- Supplier Ledger ----
export interface SupplierTransaction {
  id: string;
  type: "purchase" | "payment";
  description: string;
  amount: number;
  date: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  transactions: SupplierTransaction[];
  createdAt: number;
}

export function getLocalSuppliers(): Supplier[] {
  try {
    const raw = localStorage.getItem(KEYS.suppliers);
    if (raw) return JSON.parse(raw) as Supplier[];
  } catch {
    // ignore
  }
  saveLocalSuppliers([]);
  return [];
}

export function saveLocalSuppliers(suppliers: Supplier[]) {
  try {
    localStorage.setItem(KEYS.suppliers, JSON.stringify(suppliers));
  } catch {
    // ignore
  }
}

export function addLocalSupplier(name: string, phone?: string): Supplier {
  const supplier: Supplier = {
    id: `supplier-${Date.now()}`,
    name,
    phone,
    transactions: [],
    createdAt: Date.now(),
  };
  const suppliers = getLocalSuppliers();
  suppliers.unshift(supplier);
  saveLocalSuppliers(suppliers);
  return supplier;
}

export function deleteLocalSupplier(id: string) {
  const suppliers = getLocalSuppliers().filter((s) => s.id !== id);
  saveLocalSuppliers(suppliers);
}

export function addSupplierTransaction(
  supplierId: string,
  tx: Omit<SupplierTransaction, "id">,
): SupplierTransaction {
  const newTx: SupplierTransaction = { ...tx, id: `tx-${Date.now()}` };
  const suppliers = getLocalSuppliers();
  const updated = suppliers.map((s) =>
    s.id === supplierId
      ? { ...s, transactions: [newTx, ...s.transactions] }
      : s,
  );
  saveLocalSuppliers(updated);
  return newTx;
}

export function deleteSupplierTransaction(supplierId: string, txId: string) {
  const suppliers = getLocalSuppliers();
  const updated = suppliers.map((s) =>
    s.id === supplierId
      ? { ...s, transactions: s.transactions.filter((t) => t.id !== txId) }
      : s,
  );
  saveLocalSuppliers(updated);
}

// ---- Business Profile ----
export interface BusinessProfile {
  businessName: string;
  phone: string;
  gst: string;
  pickupLocations: string;
  logoBase64: string;
}

const DEFAULT_PROFILE: BusinessProfile = {
  businessName: "The Digital Gallery by Emon",
  phone: "+91 93652 46096",
  gst: "",
  pickupLocations: "Basugaon, Kokrajhar, Bongaigaon, Barpeta Road",
  logoBase64: "",
};

export function getBusinessProfile(): BusinessProfile {
  try {
    const raw = localStorage.getItem(KEYS.profile);
    if (raw)
      return { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as BusinessProfile) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_PROFILE };
}

export function saveBusinessProfile(profile: BusinessProfile): void {
  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

// ---- Investments ----
export interface Investment {
  id: string;
  description: string;
  amount: number;
  date: number;
}

export function getLocalInvestments(): Investment[] {
  try {
    const raw = localStorage.getItem(KEYS.investments);
    if (raw) return JSON.parse(raw) as Investment[];
  } catch {
    // ignore
  }
  return [];
}

export function saveLocalInvestments(investments: Investment[]): void {
  try {
    localStorage.setItem(KEYS.investments, JSON.stringify(investments));
  } catch {
    // ignore
  }
}

export function addLocalInvestment(
  description: string,
  amount: number,
  date: number,
): void {
  const inv: Investment = {
    id: `inv-${Date.now()}`,
    description,
    amount,
    date,
  };
  const list = getLocalInvestments();
  list.unshift(inv);
  saveLocalInvestments(list);
}

export function deleteLocalInvestment(id: string): void {
  const list = getLocalInvestments().filter((i) => i.id !== id);
  saveLocalInvestments(list);
}

// ---- Backup / Restore ----
export function exportAllData(): void {
  const data: Record<string, unknown> = {};
  for (const key of Object.values(KEYS)) {
    const val = localStorage.getItem(key);
    if (val !== null) {
      try {
        data[key] = JSON.parse(val);
      } catch {
        data[key] = val;
      }
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "digital-gallery-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function importAllData(jsonString: string): void {
  try {
    const data = JSON.parse(jsonString) as Record<string, unknown>;
    for (const key of Object.values(KEYS)) {
      if (key in data) {
        localStorage.setItem(key, JSON.stringify(data[key]));
      }
    }
    window.location.reload();
  } catch {
    alert("Invalid backup file. Could not import data.");
  }
}
