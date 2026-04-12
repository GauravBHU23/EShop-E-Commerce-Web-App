// ===== API Response Wrapper =====
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ===== Enums =====
export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentMode = "COD" | "ONLINE" | "WALLET" | "UPI";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
export type DiscountType = "PERCENTAGE" | "FLAT";

// ===== Auth =====
export interface JwtResponse {
  token: string;
  type: string;
  refreshToken: string;
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  roles: string[];
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ===== User =====
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  profileImage?: string;
  isActive: boolean;
  roles: string[];
  createdAt: string;
}

export interface UpdateProfileRequest {
  name: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface EmailOtpVerificationRequest {
  otp: string;
}

// ===== Address =====
export interface AddressResponse {
  id: number;
  fullName: string;
  phone: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface AddressRequest {
  fullName: string;
  phone: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

// ===== Category =====
export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  subCategories: CategoryResponse[];
}

// ===== Product =====
export interface ProductImageResponse {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  stockQty: number;
  brand?: string;
  avgRating: number;
  totalReviews: number;
  isActive: boolean;
  category: CategoryResponse;
  images: ProductImageResponse[];
  createdAt: string;
}

export interface ProductRequest {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  stockQty: number;
  brand?: string;
  categoryId: number;
}

// ===== Cart =====
export interface CartItemResponse {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CartResponse {
  id: number;
  items: CartItemResponse[];
  totalItems: number;
  totalAmount: number;
}

export interface CartItemRequest {
  productId: number;
  quantity: number;
}

// ===== Order =====
export interface OrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PaymentResponse {
  id: number;
  paymentMode: PaymentMode;
  status: PaymentStatus;
  amount: number;
  transactionId?: string;
  paidAt?: string;
}

export interface PaymentInitiationResponse {
  orderId: number;
  orderNumber: string;
  paymentRequestId: string;
  paymentUrl: string;
  paymentStatus: PaymentStatus;
}

export interface PaymentVerificationResponse {
  orderId: number;
  orderNumber: string;
  paymentRequestId: string;
  paymentId: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  verified: boolean;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  items: OrderItemResponse[];
  shippingName: string;
  shippingPhone: string;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMode: PaymentMode;
  couponCode?: string;
  payment?: PaymentResponse;
  placedAt: string;
}

export interface OrderRequest {
  addressId: number;
  paymentMode: PaymentMode;
  couponCode?: string;
  notes?: string;
}

// ===== Review =====
export interface ReviewResponse {
  id: number;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface ReviewRequest {
  rating: number;
  comment?: string;
}

// ===== Coupon =====
export interface CouponResponse {
  id: number;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  expiryDate: string;
  isActive: boolean;
}

// ===== Dashboard =====
export interface DashboardResponse {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
  topSellingProducts: ProductResponse[];
}

// ===== Search Params =====
export interface ProductSearchParams {
  keyword?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}
