import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi, categoryApi, cartApi, orderApi, reviewApi, userApi, adminApi } from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import type { ProductSearchParams, CartItemRequest, OrderRequest, ReviewRequest, AddressRequest } from "@/types";
import { toast } from "sonner";

// ===== QUERY KEYS =====
export const QUERY_KEYS = {
  products: (params?: ProductSearchParams) => ["products", params],
  product: (id: number) => ["product", id],
  categories: ["categories"],
  cart: ["cart"],
  orders: (page: number) => ["orders", page],
  order: (id: number) => ["order", id],
  reviews: (productId: number, page: number) => ["reviews", productId, page],
  profile: ["profile"],
  addresses: ["addresses"],
  dashboard: ["dashboard"],
  adminOrders: (page: number, status?: string) => ["admin-orders", page, status],
  adminUsers: (page: number) => ["admin-users", page],
};

// ===== PRODUCTS =====
export const useProducts = (params?: ProductSearchParams) =>
  useQuery({
    queryKey: QUERY_KEYS.products(params),
    queryFn: () => productApi.getAll(params).then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

export const useProduct = (id: number) =>
  useQuery({
    queryKey: QUERY_KEYS.product(id),
    queryFn: () => productApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useProductBySlug = (slug: string, enabled = true) =>
  useQuery({
    queryKey: ["product-slug", slug],
    queryFn: () => productApi.getBySlug(slug).then((r) => r.data.data),
    enabled: enabled && !!slug,
  });

export const useSearchProducts = (params: ProductSearchParams, enabled = true) =>
  useQuery({
    queryKey: ["search", params],
    queryFn: () => productApi.search(params).then((r) => r.data.data),
    enabled,
    staleTime: 1000 * 30,
  });

// ===== CATEGORIES =====
export const useCategories = () =>
  useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: () => categoryApi.getAll().then((r) => r.data.data),
    staleTime: 1000 * 60 * 10,
  });

// ===== CART =====
export const useCart = () => {
  const { isAuthenticated } = useAuthStore();
  const { setCart } = useCartStore();

  return useQuery({
    queryKey: QUERY_KEYS.cart,
    queryFn: async () => {
      const res = await cartApi.getCart();
      setCart(res.data.data);
      return res.data.data;
    },
    enabled: isAuthenticated,
    staleTime: 0,
  });
};

export const useAddToCart = () => {
  const qc = useQueryClient();
  const { setCart } = useCartStore();

  return useMutation({
    mutationFn: (data: CartItemRequest) => cartApi.addItem(data),
    onSuccess: (res) => {
      setCart(res.data.data);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.cart });
      toast.success("Added to cart!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    },
  });
};

export const useUpdateCartItem = () => {
  const qc = useQueryClient();
  const { setCart } = useCartStore();

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      cartApi.updateItem(productId, quantity),
    onSuccess: (res) => {
      setCart(res.data.data);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.cart });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update cart");
    },
  });
};

export const useRemoveFromCart = () => {
  const qc = useQueryClient();
  const { setCart } = useCartStore();

  return useMutation({
    mutationFn: (productId: number) => cartApi.removeItem(productId),
    onSuccess: (res) => {
      setCart(res.data.data);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.cart });
      toast.success("Item removed");
    },
  });
};

// ===== ORDERS =====
export const useOrders = (page = 0) => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: QUERY_KEYS.orders(page),
    queryFn: () => orderApi.getMyOrders(page).then((r) => r.data.data),
    enabled: isAuthenticated,
  });
};

export const useOrder = (id: number) =>
  useQuery({
    queryKey: QUERY_KEYS.order(id),
    queryFn: () => orderApi.getOrderById(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const usePlaceOrder = () => {
  const qc = useQueryClient();
  const { clearCart } = useCartStore();

  return useMutation({
    mutationFn: (data: OrderRequest) => orderApi.placeOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.cart });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.orders(0) });
      clearCart();
      toast.success("Order placed successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to place order");
    },
  });
};

export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => orderApi.cancelOrder(orderId),
    onSuccess: (_, orderId) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.order(orderId) });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order cancelled");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Cannot cancel this order");
    },
  });
};

export const useHideOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => orderApi.hideOrder(orderId),
    onSuccess: (_, orderId) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.removeQueries({ queryKey: QUERY_KEYS.order(orderId) });
      toast.success("Removed from My Orders");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to remove order");
    },
  });
};

// ===== REVIEWS =====
export const useReviews = (productId: number, page = 0) =>
  useQuery({
    queryKey: QUERY_KEYS.reviews(productId, page),
    queryFn: () => reviewApi.getByProduct(productId, page).then((r) => r.data.data),
    enabled: !!productId,
  });

export const useAddReview = (productId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReviewRequest) => reviewApi.addReview(productId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      qc.invalidateQueries({ queryKey: ["product", productId] });
      qc.invalidateQueries({ queryKey: ["product-slug"] });
      toast.success("Review added!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add review");
    },
  });
};

// ===== USER PROFILE =====
export const useProfile = () => {
  const { isAuthenticated, setUser } = useAuthStore();
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: async () => {
      const res = await userApi.getProfile();
      setUser(res.data.data);
      return res.data.data;
    },
    enabled: isAuthenticated,
  });
};

export const useAddresses = () => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: QUERY_KEYS.addresses,
    queryFn: () => userApi.getAddresses().then((r) => r.data.data),
    enabled: isAuthenticated,
  });
};

export const useAddAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddressRequest) => userApi.addAddress(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.addresses });
      toast.success("Address added!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add address");
    },
  });
};

export const useDeleteAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userApi.deleteAddress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.addresses });
      toast.success("Address deleted");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete address");
    },
  });
};

// ===== ADMIN =====
export const useDashboard = () =>
  useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: () => adminApi.getDashboard().then((r) => r.data.data),
    staleTime: 1000 * 60,
  });

export const useAdminOrders = (page = 0, status?: string) =>
  useQuery({
    queryKey: QUERY_KEYS.adminOrders(page, status),
    queryFn: () => adminApi.getAllOrders(page, 20, status).then((r) => r.data.data),
  });

export const useAdminUsers = (page = 0) =>
  useQuery({
    queryKey: QUERY_KEYS.adminUsers(page),
    queryFn: () => adminApi.getAllUsers(page).then((r) => r.data.data),
  });

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      adminApi.updateOrderStatus(orderId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update status");
    },
  });
};
