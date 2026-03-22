import { useCallback, useState } from "react";
import type { Supplier, SupplierTransaction } from "../utils/localStorage";
import {
  addSupplierTransaction,
  deleteSupplierTransaction,
  getLocalSuppliers,
  saveLocalSuppliers,
} from "../utils/localStorage";

export type { Supplier, SupplierTransaction };

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    getLocalSuppliers(),
  );

  const refresh = useCallback(() => {
    setSuppliers(getLocalSuppliers());
  }, []);

  const addSupplier = useCallback((name: string, phone?: string) => {
    const supplier: Supplier = {
      id: `supplier-${Date.now()}`,
      name,
      phone,
      transactions: [],
      createdAt: Date.now(),
    };
    const next = [supplier, ...getLocalSuppliers()];
    saveLocalSuppliers(next);
    setSuppliers(next);
    return supplier;
  }, []);

  const renameSupplier = useCallback((id: string, name: string) => {
    const next = getLocalSuppliers().map((s) =>
      s.id === id ? { ...s, name } : s,
    );
    saveLocalSuppliers(next);
    setSuppliers(next);
  }, []);

  const deleteSupplier = useCallback((id: string) => {
    const next = getLocalSuppliers().filter((s) => s.id !== id);
    saveLocalSuppliers(next);
    setSuppliers(next);
  }, []);

  const addTransaction = useCallback(
    (supplierId: string, tx: Omit<SupplierTransaction, "id">) => {
      const result = addSupplierTransaction(supplierId, tx);
      refresh();
      return result;
    },
    [refresh],
  );

  const deleteTransaction = useCallback(
    (supplierId: string, txId: string) => {
      deleteSupplierTransaction(supplierId, txId);
      refresh();
    },
    [refresh],
  );

  const updateSupplierPhone = useCallback((id: string, phone: string) => {
    const next = getLocalSuppliers().map((s) =>
      s.id === id ? { ...s, phone } : s,
    );
    saveLocalSuppliers(next);
    setSuppliers(next);
  }, []);

  return {
    suppliers,
    refresh,
    addSupplier,
    updateSupplierPhone,
    renameSupplier,
    deleteSupplier,
    addTransaction,
    deleteTransaction,
  };
}
