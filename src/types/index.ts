export type UserRole = 'customer' | 'admin';

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  pinCode: string;
  state: string;
  city: string;
  fullAddress: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  addresses: Address[];
  isActive: boolean;
  createdAt: string;
}

export interface SizeStock {
  size: number; // UK 6, 7, 8, 9, 10, 11, 12
  stock: number;
}

export interface ColorVariant {
  name: string;
  hex: string;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  category: string;
  gender: 'Men' | 'Women' | 'Unisex';
  images: string[];
  price: number;
  originalPrice: number;
  discount: number;
  sizes: SizeStock[];
  colors: ColorVariant[];
  stock: number;
  rating: number;
  numReviews: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller?: boolean;
  isDemoData?: boolean;
  specifications?: {
    upperMaterial: string;
    soleMaterial: string;
    closure: string;
    weight: string;
    cushioning: string;
    warranty: string;
  };
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  productCount?: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  brand: string;
  image: string;
  price: number;
  originalPrice: number;
  discount: number;
  size: number;
  color: string;
  quantity: number;
  maxStock: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumPurchase: number;
  maxDiscount?: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  description?: string;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Order Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  originalPrice: number;
  size: number;
  color: string;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: 'Razorpay' | 'COD';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  paymentDetails?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    verifiedAt?: string;
  };
  couponCode?: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  trackingNumber: string;
  timeline: OrderTimelineEvent[];
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface ProductFilterState {
  search: string;
  category: string;
  gender: string;
  brand: string;
  size: number | null;
  color: string;
  minPrice: number;
  maxPrice: number;
  minDiscount: number;
  minRating: number;
  inStockOnly: boolean;
  sortBy:
    | 'recommended'
    | 'newest'
    | 'price_asc'
    | 'price_desc'
    | 'best_selling'
    | 'top_rated'
    | 'popularity';
}
