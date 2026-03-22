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

  const addSupplier = useCallback((name: string) => {
    const supplier: Supplier = {
      id: `supplier-${Date.now()}`,
      name,
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

  return {
    suppliers,
    refresh,
    addSupplier,
    renameSupplier,
    deleteSupplier,
    addTransaction,
    deleteTransaction,
  };
}
