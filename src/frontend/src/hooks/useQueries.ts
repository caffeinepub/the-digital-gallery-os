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
  saveLocalOrders,
  setLocalStock,
  settleLocalBalance,
  updateLocalOrderStatus,
} from "../utils/localStorage";
import { useActor } from "./useActor";

export function useGetAllOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<CustomerOrder[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      try {
        if (!actor) return getLocalOrders();
        const orders = await actor.getAllOrders();
        if (orders.length > 0) {
          const sorted = [...orders].sort(
            (a, b) => Number(b.orderDate) - Number(a.orderDate),
          );
          saveLocalOrders(sorted);
          return sorted;
        }
        return getLocalOrders();
      } catch {
        return getLocalOrders();
      }
    },
    enabled: !isFetching,
    initialData: getLocalOrders,
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
    }) => {
      let id: bigint;
      try {
        id = await actor!.createOrder(
          data.customerName,
          data.items,
          data.totalAmount,
          data.advancePaid,
        );
      } catch {
        id = BigInt(Date.now());
      }
      const newOrder: CustomerOrder = {
        id,
        customerName: data.customerName,
        status: OrderStatus.pending,
        orderDate: BigInt(Date.now()) * BigInt(1_000_000),
        totalAmount: data.totalAmount,
        advancePaid: data.advancePaid,
        balanceDue: data.totalAmount - data.advancePaid,
        items: data.items,
      };
      addLocalOrder(newOrder);
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
      qc.setQueryData(
        ["orders"],
        (old: (CustomerOrder & { customerPhone?: string })[] | undefined) =>
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
        /* local updated */
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
        /* local updated */
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
        for (const [size, count] of raw) {
          inv[size] = Number(count);
        }
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
        /* local updated */
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
        /* local updated */
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useSetStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ size, value }: { size: string; value: number }) => {
      setLocalStock(size, value);
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
        /* local handled */
      }
    },
  });
}
