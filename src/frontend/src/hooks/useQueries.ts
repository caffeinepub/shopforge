import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Store,
  StoreAnalytics,
  UserProfile,
} from "../backend.d.ts";
import { useActor } from "./useActor";

// ── Store Queries ─────────────────────────────────────────────

export function useMyStore() {
  const { actor, isFetching } = useActor();
  return useQuery<Store | null>({
    queryKey: ["myStore"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getMyStore();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useAllStores() {
  const { actor, isFetching } = useActor();
  return useQuery<Store[]>({
    queryKey: ["allStores"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllStores();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStoreBySlug(slug: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Store | null>({
    queryKey: ["store", slug],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getStoreBySlug(slug);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!slug,
  });
}

// ── Product Queries ───────────────────────────────────────────

export function useActiveProductsByStore(storeId: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products", "active", storeId?.toString()],
    queryFn: async () => {
      if (!actor || storeId === undefined) return [];
      return actor.listActiveProductsByStore(storeId);
    },
    enabled: !!actor && !isFetching && storeId !== undefined,
  });
}

export function useProductsByStore(storeId: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products", "all", storeId?.toString()],
    queryFn: async () => {
      if (!actor || storeId === undefined) return [];
      return actor.listProductsByStore(storeId);
    },
    enabled: !!actor && !isFetching && storeId !== undefined,
  });
}

// ── Order Queries ─────────────────────────────────────────────

export function useOrdersByStore(storeId: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["orders", storeId?.toString()],
    queryFn: async () => {
      if (!actor || storeId === undefined) return [];
      return actor.listOrdersByStore(storeId);
    },
    enabled: !!actor && !isFetching && storeId !== undefined,
  });
}

export function useMyOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["myOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Analytics ─────────────────────────────────────────────────

export function useStoreAnalytics(storeId: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<StoreAnalytics | null>({
    queryKey: ["analytics", storeId?.toString()],
    queryFn: async () => {
      if (!actor || storeId === undefined) return null;
      return actor.getStoreAnalytics(storeId);
    },
    enabled: !!actor && !isFetching && storeId !== undefined,
  });
}

// ── User Profile ──────────────────────────────────────────────

export function useMyProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["myProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Mutations ─────────────────────────────────────────────────

export function useCreateStore() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      slug,
      description,
    }: {
      name: string;
      slug: string;
      description: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createStore(name, slug, description);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myStore"] });
      qc.invalidateQueries({ queryKey: ["allStores"] });
    },
  });
}

export function useUpdateStore() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      storeId,
      name,
      description,
    }: {
      storeId: bigint;
      name: string;
      description: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateStore(storeId, name, description);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myStore"] });
      qc.invalidateQueries({ queryKey: ["allStores"] });
    },
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      storeId,
      name,
      description,
      price,
      stock,
      category,
    }: {
      storeId: bigint;
      name: string;
      description: string;
      price: bigint;
      stock: bigint;
      category: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addProduct(
        storeId,
        name,
        description,
        price,
        stock,
        category,
      );
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ["products", "all", vars.storeId.toString()],
      });
      qc.invalidateQueries({
        queryKey: ["products", "active", vars.storeId.toString()],
      });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      name,
      description,
      price,
      stock,
    }: {
      productId: bigint;
      storeId: bigint;
      name: string;
      description: string;
      price: bigint;
      stock: bigint;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateProduct(productId, name, description, price, stock);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ["products", "all", vars.storeId.toString()],
      });
      qc.invalidateQueries({
        queryKey: ["products", "active", vars.storeId.toString()],
      });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
    }: { productId: bigint; storeId: bigint }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteProduct(productId);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ["products", "all", vars.storeId.toString()],
      });
      qc.invalidateQueries({
        queryKey: ["products", "active", vars.storeId.toString()],
      });
    },
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      storeId,
      buyerName,
      buyerEmail,
      items,
    }: {
      storeId: bigint;
      buyerName: string;
      buyerEmail: string;
      items: OrderItem[];
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.placeOrder(storeId, buyerName, buyerEmail, items);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["orders", vars.storeId.toString()] });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: bigint;
      status: OrderStatus;
      storeId: bigint;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateOrderStatus(orderId, status);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["orders", vars.storeId.toString()] });
    },
  });
}

export function useAiAssist() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      context,
      prompt,
    }: {
      context: string;
      prompt: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.aiAssist(context, prompt);
    },
  });
}
