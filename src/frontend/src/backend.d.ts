import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Store {
    id: bigint;
    ownerId: Principal;
    name: string;
    createdAt: Time;
    slug: string;
    description: string;
    isActive: boolean;
    bannerImageId?: Uint8Array;
}
export interface Product {
    id: bigint;
    storeId: bigint;
    name: string;
    createdAt: Time;
    description: string;
    isActive: boolean;
    stock: bigint;
    category: string;
    imageId?: Uint8Array;
    price: bigint;
}
export type Time = bigint;
export interface OrderItem {
    productId: bigint;
    productName: string;
    quantity: bigint;
    unitPrice: bigint;
}
export interface StoreAnalytics {
    totalOrders: bigint;
    topProducts: Array<[bigint, string, bigint]>;
    totalRevenue: bigint;
}
export interface Order {
    id: bigint;
    status: OrderStatus;
    buyerEmail: string;
    storeId: bigint;
    createdAt: Time;
    buyerPrincipal?: Principal;
    items: Array<OrderItem>;
    buyerName: string;
    totalPrice: bigint;
}
export interface UserProfile {
    name: string;
}
export enum OrderStatus {
    cancelled = "cancelled",
    pending = "pending",
    fulfilled = "fulfilled"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(storeId: bigint, name: string, description: string, price: bigint, stock: bigint, category: string): Promise<bigint>;
    aiAssist(context: string, userPrompt: string): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createStore(name: string, slug: string, description: string): Promise<bigint>;
    deleteProduct(productId: bigint): Promise<void>;
    deleteStore(storeId: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyStore(): Promise<Store>;
    getOrder(orderId: bigint): Promise<Order>;
    getProduct(productId: bigint): Promise<Product>;
    getStore(storeId: bigint): Promise<Store>;
    getStoreAnalytics(storeId: bigint): Promise<StoreAnalytics>;
    getStoreBySlug(slug: string): Promise<Store>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listActiveProductsByStore(storeId: bigint): Promise<Array<Product>>;
    listAllStores(): Promise<Array<Store>>;
    listMyOrders(): Promise<Array<Order>>;
    listOrdersByStore(storeId: bigint): Promise<Array<Order>>;
    listProductsByStore(storeId: bigint): Promise<Array<Product>>;
    placeOrder(storeId: bigint, buyerName: string, buyerEmail: string, items: Array<OrderItem>): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateOrderStatus(orderId: bigint, status: OrderStatus): Promise<void>;
    updateProduct(productId: bigint, name: string, description: string, price: bigint, stock: bigint): Promise<void>;
    updateStore(storeId: bigint, name: string, description: string): Promise<void>;
}
