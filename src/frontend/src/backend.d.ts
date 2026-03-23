import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CustomerOrder {
    id: bigint;
    customerName: string;
    status: OrderStatus;
    orderDate: Time;
    trackingToken: string;
    totalAmount: number;
    advancePaid: number;
    balanceDue: number;
    items: Array<FramingItem>;
}
export type Time = bigint;
export interface SupplierNote {
    text: string;
    timestamp: Time;
}
export interface FramingItem {
    size: string;
    thickness: number;
    quantity: bigint;
    unitPrice: number;
}
export enum OrderStatus {
    pending = "pending",
    delivered = "delivered",
    ready = "ready"
}
export interface backendInterface {
    addSupplierNote(text: string): Promise<void>;
    createOrder(customerName: string, items: Array<FramingItem>, totalAmount: number, advancePaid: number, trackingToken: string): Promise<bigint>;
    decrementStock(size: string, amount: bigint): Promise<void>;
    deleteOrder(id: bigint): Promise<void>;
    getAllInventory(): Promise<Array<[string, bigint]>>;
    getAllOrders(): Promise<Array<CustomerOrder>>;
    getAllSupplierNotes(): Promise<Array<SupplierNote>>;
    getOrder(id: bigint): Promise<CustomerOrder>;
    getOrderByToken(token: string): Promise<CustomerOrder | null>;
    getStockCount(size: string): Promise<bigint>;
    incrementStock(size: string, amount: bigint): Promise<void>;
    settleBalance(id: bigint, amountPaid: number): Promise<void>;
    updateInventorySize(size: string, quantity: bigint): Promise<void>;
    updateOrderStatus(id: bigint, status: OrderStatus): Promise<void>;
}
