import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomerOrder, FramingItem } from "../backend";
import { OrderStatus } from "../backend";
import {
  addLocalOrder,
  adjustLocalStock,
  deleteLocalOrder,
  getLocalInventory,
  getLocalOrders,
  saveLocalInventory,
  setLocalStock,
  settleLocalBalance,
  updateLocalOrderStatus,
} from "../utils/localStorage";
import { useActor } from "./useActor";

type LocalOrder = CustomerOrder & {
  customerPhone?: string;
  deliveryAddress?: string;
  billNumber?: number;
  trackingToken?: string;
};

// Always use localStorage as source of truth.
// Backend sync is write-only (we push to backend but never let it overwrite local).
export function useGetAllOrders() {
  return useQuery<LocalOrder[]>({
    queryKey: ["orders"],
    queryFn: () => getLocalOrders() as LocalOrder[],
    staleTime: 0,
    initialData: () => getLocalOrders() as LocalOrder[],
  });
}

export function useCreateOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      customerName: string;
      items: FramingItem[];
      totalAmount: number;
      advancePaid: number;
      customerPhone?: string;
      deliveryAddress?: string;
      billNumber?: number;
      trackingToken?: string;
    }) => {
      const trackingToken = data.trackingToken ?? "";
      let id: bigint;
      try {
        id = await actor!.createOrder(
          data.customerName,
          data.items,
          data.totalAmount,
          data.advancePaid,
          trackingToken,
        );
      } catch {
        id = BigInt(Date.now());
      }
      const newOrder: LocalOrder = {
        id,
        customerName: data.customerName,
        status: OrderStatus.pending,
        orderDate: BigInt(Date.now()) * BigInt(1_000_000),
        totalAmount: data.totalAmount,
        advancePaid: data.advancePaid,
        balanceDue: data.totalAmount - data.advancePaid,
        items: data.items,
        customerPhone: data.customerPhone,
        deliveryAddress: data.deliveryAddress,
        billNumber: data.billNumber,
        trackingToken,
      };
      addLocalOrder(newOrder, data.customerPhone, data.deliveryAddress);
      return newOrder;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      deleteLocalOrder(id);
    },
    onSuccess: (_data, id) => {
      qc.setQueryData(["orders"], (old: LocalOrder[] | undefined) =>
        old ? old.filter((o) => String(o.id) !== String(id)) : [],
      );
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: bigint; status: OrderStatus }) => {
      updateLocalOrderStatus(id, status);
      try {
        await actor?.updateOrderStatus(id, status);
      } catch {
        /* ok */
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useSettleBalance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      totalAmount,
    }: { id: bigint; totalAmount: number }) => {
      settleLocalBalance(id);
      try {
        await actor?.settleBalance(id, totalAmount);
      } catch {
        /* ok */
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useGetAllInventory() {
  const { actor, isFetching } = useActor();
  return useQuery<Record<string, number>>({
    queryKey: ["inventory"],
    queryFn: async () => {
      try {
        if (!actor) return getLocalInventory();
        const raw = await actor.getAllInventory();
        const inv: Record<string, number> = {};
        for (const [size, count] of raw) inv[size] = Number(count);
        const merged = { ...getLocalInventory(), ...inv };
        saveLocalInventory(merged);
        return merged;
      } catch {
        return getLocalInventory();
      }
    },
    enabled: !isFetching,
    initialData: getLocalInventory,
  });
}

export function useIncrementStock() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (size: string) => {
      adjustLocalStock(size, 1);
      try {
        await actor?.incrementStock(size, BigInt(1));
      } catch {
        /* ok */
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useDecrementStock() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (size: string) => {
      adjustLocalStock(size, -1);
      try {
        await actor?.decrementStock(size, BigInt(1));
      } catch {
        /* ok */
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useSetStock() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      size,
      quantity,
      value,
    }: { size: string; quantity?: number; value?: number }) => {
      const qty = quantity ?? value ?? 0;
      setLocalStock(size, qty);
      try {
        await actor?.updateInventorySize(size, BigInt(qty));
      } catch {
        /* ok */
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useAddSupplierNote() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (text: string) => {
      try {
        await actor?.addSupplierNote(text);
      } catch {
        /* ok — note already saved to localStorage by caller */
      }
    },
  });
}
