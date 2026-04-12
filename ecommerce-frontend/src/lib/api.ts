import api from "./axios";
import type {
  ApiResponse, PagedResponse,
  JwtResponse, LoginRequest, RegisterRequest,
  ForgotPasswordRequest, ResetPasswordRequest,
  UserResponse, UpdateProfileRequest, ChangePasswordRequest,
  EmailOtpVerificationRequest,
  AddressResponse, AddressRequest,
  CategoryResponse,
  ProductResponse, ProductSearchParams,
  CartResponse, CartItemRequest,
  OrderResponse, OrderRequest, PaymentInitiationResponse, PaymentVerificationResponse,
  ReviewResponse, ReviewRequest,
  CouponResponse, DashboardResponse,
} from "@/types";

// ===== AUTH =====
export const authApi = {
  getCsrf: () =>
    api.get<ApiResponse<string>>("/auth/csrf"),

  register: (data: RegisterRequest) =>
    api.post<ApiResponse<JwtResponse>>("/auth/register", data),

  login: (data: LoginRequest) =>
    api.post<ApiResponse<JwtResponse>>("/auth/login", data),

  logout: () =>
    api.post<ApiResponse<null>>("/auth/logout"),

  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post<ApiResponse<null>>("/auth/forgot-password", data),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<ApiResponse<null>>("/auth/reset-password", data),
};

// ===== USER =====
export const userApi = {
  getProfile: () =>
    api.get<ApiResponse<UserResponse>>("/users/me"),

  updateProfile: (data: UpdateProfileRequest) =>
    api.put<ApiResponse<UserResponse>>("/users/me", data),

  changePassword: (data: ChangePasswordRequest) =>
    api.put<ApiResponse<null>>("/users/me/password", data),

  sendEmailVerificationOtp: () =>
    api.post<ApiResponse<null>>("/users/me/email-verification/otp"),

  verifyEmailOtp: (data: EmailOtpVerificationRequest) =>
    api.post<ApiResponse<UserResponse>>("/users/me/email-verification/verify", data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<ApiResponse<UserResponse>>("/users/me/avatar", formData);
  },

  getAddresses: () =>
    api.get<ApiResponse<AddressResponse[]>>("/users/me/addresses"),

  addAddress: (data: AddressRequest) =>
    api.post<ApiResponse<AddressResponse>>("/users/me/addresses", data),

  updateAddress: (id: number, data: AddressRequest) =>
    api.put<ApiResponse<AddressResponse>>(`/users/me/addresses/${id}`, data),

  deleteAddress: (id: number) =>
    api.delete<ApiResponse<null>>(`/users/me/addresses/${id}`),
};

// ===== CATEGORIES =====
export const categoryApi = {
  getAll: () =>
    api.get<ApiResponse<CategoryResponse[]>>("/categories"),

  getById: (id: number) =>
    api.get<ApiResponse<CategoryResponse>>(`/categories/${id}`),

  create: (formData: FormData) =>
    api.post<ApiResponse<CategoryResponse>>("/categories", formData),

  update: (id: number, formData: FormData) =>
    api.put<ApiResponse<CategoryResponse>>(`/categories/${id}`, formData),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/categories/${id}`),
};

// ===== PRODUCTS =====
export const productApi = {
  getAll: (params?: ProductSearchParams) =>
    api.get<ApiResponse<PagedResponse<ProductResponse>>>("/products", { params }),

  getById: (id: number) =>
    api.get<ApiResponse<ProductResponse>>(`/products/${id}`),

  getBySlug: (slug: string) =>
    api.get<ApiResponse<ProductResponse>>(`/products/by-slug/${slug}`),

  search: (params: ProductSearchParams) =>
    api.get<ApiResponse<PagedResponse<ProductResponse>>>("/products/search", { params }),

  getByCategory: (categoryId: number, page = 0, size = 12) =>
    api.get<ApiResponse<PagedResponse<ProductResponse>>>(
      `/products/category/${categoryId}`, { params: { page, size } }
    ),

  // Admin
  create: (formData: FormData) =>
    api.post<ApiResponse<ProductResponse>>("/products", formData),

  update: (id: number, formData: FormData) =>
    api.put<ApiResponse<ProductResponse>>(`/products/${id}`, formData),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/products/${id}`),
};

// ===== CART =====
export const cartApi = {
  getCart: () =>
    api.get<ApiResponse<CartResponse>>("/cart"),

  addItem: (data: CartItemRequest) =>
    api.post<ApiResponse<CartResponse>>("/cart/items", data),

  updateItem: (productId: number, quantity: number) =>
    api.put<ApiResponse<CartResponse>>(`/cart/items/${productId}`, null, {
      params: { quantity },
    }),

  removeItem: (productId: number) =>
    api.delete<ApiResponse<CartResponse>>(`/cart/items/${productId}`),
};

// ===== ORDERS =====
export const orderApi = {
  placeOrder: (data: OrderRequest) =>
    api.post<ApiResponse<OrderResponse>>("/orders", data),

  getMyOrders: (page = 0, size = 10) =>
    api.get<ApiResponse<PagedResponse<OrderResponse>>>("/orders", {
      params: { page, size },
    }),

  getOrderById: (id: number) =>
    api.get<ApiResponse<OrderResponse>>(`/orders/${id}`),

  cancelOrder: (id: number) =>
    api.post<ApiResponse<OrderResponse>>(`/orders/${id}/cancel`),

  hideOrder: (id: number) =>
    api.post<ApiResponse<null>>(`/orders/${id}/hide`),
};

export const paymentApi = {
  startInstamojo: (data: OrderRequest) =>
    api.post<ApiResponse<PaymentInitiationResponse>>("/payments/instamojo/start", data),

  verifyInstamojo: (paymentRequestId: string, paymentId: string) =>
    api.get<ApiResponse<PaymentVerificationResponse>>("/payments/instamojo/verify", {
      params: {
        payment_request_id: paymentRequestId,
        payment_id: paymentId,
      },
    }),
};

// ===== REVIEWS =====
export const reviewApi = {
  getByProduct: (productId: number, page = 0, size = 10) =>
    api.get<ApiResponse<PagedResponse<ReviewResponse>>>(
      `/products/${productId}/reviews`, { params: { page, size } }
    ),

  addReview: (productId: number, data: ReviewRequest) =>
    api.post<ApiResponse<ReviewResponse>>(`/products/${productId}/reviews`, data),

  updateReview: (productId: number, reviewId: number, data: ReviewRequest) =>
    api.put<ApiResponse<ReviewResponse>>(
      `/products/${productId}/reviews/${reviewId}`, data
    ),

  deleteReview: (productId: number, reviewId: number) =>
    api.delete<ApiResponse<null>>(`/products/${productId}/reviews/${reviewId}`),
};

// ===== ADMIN =====
export const adminApi = {
  getDashboard: () =>
    api.get<ApiResponse<DashboardResponse>>("/admin/dashboard"),

  getAllUsers: (page = 0, size = 20) =>
    api.get<ApiResponse<PagedResponse<UserResponse>>>("/admin/users", {
      params: { page, size },
    }),

  toggleUserStatus: (userId: string) =>
    api.patch<ApiResponse<UserResponse>>(`/admin/users/${userId}/toggle-status`),

  getAllOrders: (page = 0, size = 20, status?: string) =>
    api.get<ApiResponse<PagedResponse<OrderResponse>>>("/admin/orders", {
      params: { page, size, status },
    }),

  updateOrderStatus: (orderId: number, status: string) =>
    api.patch<ApiResponse<OrderResponse>>(`/admin/orders/${orderId}/status`, { status }),

  getLowStock: () =>
    api.get<ApiResponse<ProductResponse[]>>("/admin/inventory/low-stock"),

  restockProduct: (productId: number, quantity: number) =>
    api.patch<ApiResponse<ProductResponse>>(
      `/admin/inventory/products/${productId}/restock`, { quantity }
    ),

  getCoupons: () =>
    api.get<ApiResponse<CouponResponse[]>>("/admin/coupons"),

  createCoupon: (data: unknown) =>
    api.post<ApiResponse<CouponResponse>>("/admin/coupons", data),

  toggleCoupon: (id: number) =>
    api.patch<ApiResponse<null>>(`/admin/coupons/${id}/toggle`),
};
