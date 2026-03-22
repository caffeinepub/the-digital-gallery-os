import { useCallback, useState } from "react";

export interface Product {
  id: string;
  name: string;
  thickness: string;
  price: number;
}

const LS_KEY = "dg_products";

const DEFAULT_PRODUCTS: Product[] = [
  { id: "1", name: "4x6 Inch Frame", thickness: "1 Inch", price: 149 },
  { id: "2", name: "4x6 Inch Frame", thickness: "1.5 Inch", price: 179 },
  { id: "3", name: "5x7 Inch Frame", thickness: "1 Inch", price: 199 },
  { id: "4", name: "5x7 Inch Frame", thickness: "1.5 Inch", price: 219 },
  { id: "5", name: "6x8 Inch Frame", thickness: "1 Inch", price: 249 },
  { id: "6", name: "6x8 Inch Frame", thickness: "1.5 Inch", price: 279 },
  { id: "7", name: "A4 Frame", thickness: "1 Inch", price: 299 },
  { id: "8", name: "A4 Frame", thickness: "1.5 Inch", price: 349 },
  { id: "9", name: "A4 Frame (Mount)", thickness: "1 Inch", price: 499 },
  { id: "10", name: "A4 Frame (Mount)", thickness: "1.5 Inch", price: 599 },
  { id: "11", name: "12x16 Inch Frame", thickness: "1 Inch", price: 899 },
  { id: "12", name: "12x16 Inch Frame", thickness: "1.5 Inch", price: 1099 },
  { id: "13", name: "12x18 Inch Frame", thickness: "1 Inch", price: 1199 },
  { id: "14", name: "12x18 Inch Frame", thickness: "1.5 Inch", price: 1299 },
  {
    id: "15",
    name: "12x18 Inch Frame (Mount)",
    thickness: "1 Inch",
    price: 1399,
  },
  {
    id: "16",
    name: "12x18 Inch Frame (Mount)",
    thickness: "1.5 Inch",
    price: 1599,
  },
  { id: "17", name: "18x24 Inch Frame", thickness: "1 Inch", price: 1899 },
  { id: "18", name: "18x24 Inch Frame", thickness: "1.5 Inch", price: 2199 },
  {
    id: "19",
    name: "18x24 Inch Frame (Mount)",
    thickness: "1 Inch",
    price: 2299,
  },
  {
    id: "20",
    name: "18x24 Inch Frame (Mount)",
    thickness: "1.5 Inch",
    price: 2599,
  },
];

function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Product[];
  } catch {
    // ignore
  }
  localStorage.setItem(LS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
  return DEFAULT_PRODUCTS;
}

function saveProducts(products: Product[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(products));
  } catch {
    // ignore
  }
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => loadProducts());

  const persist = useCallback((next: Product[]) => {
    saveProducts(next);
    setProducts(next);
  }, []);

  const addProduct = useCallback(
    (product: Omit<Product, "id">) => {
      const newProduct: Product = { ...product, id: `prod-${Date.now()}` };
      persist([...products, newProduct]);
      return newProduct;
    },
    [products, persist],
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<Omit<Product, "id">>) => {
      persist(products.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    },
    [products, persist],
  );

  const deleteProduct = useCallback(
    (id: string) => {
      persist(products.filter((p) => p.id !== id));
    },
    [products, persist],
  );

  const resetToDefault = useCallback(() => {
    persist(DEFAULT_PRODUCTS);
  }, [persist]);

  return { products, addProduct, updateProduct, deleteProduct, resetToDefault };
}
