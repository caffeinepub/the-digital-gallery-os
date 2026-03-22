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
};

const FRAME_SIZES = [
  '4x6"',
  '5x7"',
  '6x8"',
  "A4",
  '12x16"',
  '12x18"',
  '18x24"',
];

// ---- Orders ----
export function getLocalOrders(): (CustomerOrder & {
  customerPhone?: string;
})[] {
  try {
    const raw = localStorage.getItem(KEYS.orders);
    if (raw) {
      const parsed = JSON.parse(raw) as (CustomerOrder & {
        customerPhone?: string;
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
  const seeds = getSeedOrders();
  saveLocalOrders(seeds);
  return seeds;
}

export function saveLocalOrders(
  orders: (CustomerOrder & { customerPhone?: string })[],
) {
  try {
    localStorage.setItem(KEYS.orders, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

export function addLocalOrder(order: CustomerOrder, customerPhone?: string) {
  const orders = getLocalOrders();
  orders.unshift({ ...order, customerPhone });
  saveLocalOrders(orders);
}

export function updateLocalOrderStatus(id: bigint, status: OrderStatus) {
  const orders = getLocalOrders();
  const updated = orders.map((o) => (o.id === id ? { ...o, status } : o));
  saveLocalOrders(updated);
}

export function settleLocalBalance(id: bigint) {
  const orders = getLocalOrders();
  const updated = orders.map((o) =>
    o.id === id
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
    if (raw) return JSON.parse(raw) as Record<string, number>;
  } catch {
    // ignore
  }
  const defaults: Record<string, number> = {};
  for (const s of FRAME_SIZES) {
    defaults[s] = 10;
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
  transactions: SupplierTransaction[];
  createdAt: number;
}

function getSeedSuppliers(): Supplier[] {
  return [
    {
      id: "supplier-1",
      name: "Glass Dealer",
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      transactions: [
        {
          id: "tx-1",
          type: "purchase",
          description: "10 sheets clear glass 2mm",
          amount: 1800,
          date: Date.now() - 12 * 24 * 60 * 60 * 1000,
        },
        {
          id: "tx-2",
          type: "payment",
          description: "Partial payment",
          amount: 1000,
          date: Date.now() - 7 * 24 * 60 * 60 * 1000,
        },
      ],
    },
    {
      id: "supplier-2",
      name: "Wood Frame Wholesaler",
      createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
      transactions: [
        {
          id: "tx-3",
          type: "purchase",
          description: "20 moulding strips (oak finish)",
          amount: 3500,
          date: Date.now() - 15 * 24 * 60 * 60 * 1000,
        },
      ],
    },
  ];
}

export function getLocalSuppliers(): Supplier[] {
  try {
    const raw = localStorage.getItem(KEYS.suppliers);
    if (raw) return JSON.parse(raw) as Supplier[];
  } catch {
    // ignore
  }
  const seeds = getSeedSuppliers();
  saveLocalSuppliers(seeds);
  return seeds;
}

export function saveLocalSuppliers(suppliers: Supplier[]) {
  try {
    localStorage.setItem(KEYS.suppliers, JSON.stringify(suppliers));
  } catch {
    // ignore
  }
}

export function addLocalSupplier(name: string): Supplier {
  const supplier: Supplier = {
    id: `supplier-${Date.now()}`,
    name,
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

function getSeedOrders(): CustomerOrder[] {
  const now = BigInt(Date.now()) * BigInt(1_000_000);
  const day = BigInt(86400) * BigInt(1_000_000_000);
  return [
    {
      id: BigInt(1),
      customerName: "Priya Sharma",
      status: OrderStatus.pending,
      orderDate: now - day * BigInt(2),
      totalAmount: 650,
      advancePaid: 300,
      balanceDue: 350,
      items: [
        { size: '12x18"', thickness: 1.5, quantity: BigInt(1), unitPrice: 650 },
      ],
    },
    {
      id: BigInt(2),
      customerName: "Rohan Das",
      status: OrderStatus.ready,
      orderDate: now - day * BigInt(5),
      totalAmount: 900,
      advancePaid: 500,
      balanceDue: 400,
      items: [
        { size: "A4", thickness: 1, quantity: BigInt(1), unitPrice: 300 },
        { size: '12x16"', thickness: 1, quantity: BigInt(1), unitPrice: 450 },
        { size: '4x6"', thickness: 1, quantity: BigInt(1), unitPrice: 150 },
      ],
    },
    {
      id: BigInt(3),
      customerName: "Anita Borah",
      status: OrderStatus.delivered,
      orderDate: now - day * BigInt(10),
      totalAmount: 950,
      advancePaid: 950,
      balanceDue: 0,
      items: [
        { size: '18x24"', thickness: 1.5, quantity: BigInt(1), unitPrice: 950 },
      ],
    },
    {
      id: BigInt(4),
      customerName: "Bijit Narzary",
      status: OrderStatus.pending,
      orderDate: now - day * BigInt(1),
      totalAmount: 400,
      advancePaid: 200,
      balanceDue: 200,
      items: [
        { size: '5x7"', thickness: 1, quantity: BigInt(2), unitPrice: 200 },
      ],
    },
  ];
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
