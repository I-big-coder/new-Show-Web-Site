import type { CartItem, Coupon, OrderStatus, Product, ProductFilterState } from '../types';

export const FREE_SHIPPING_THRESHOLD = 1999;
export const STANDARD_SHIPPING_COST = 149;
export const GST_RATE = 0.12;

export function formatINR(amount: number): string {
  const rounded = Math.round(amount);
  return `₹${rounded.toLocaleString('en-IN')}`;
}

export interface CartTotals {
  subtotal: number;
  originalSubtotal: number;
  productSavings: number;
  couponDiscount: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  freeShippingRemaining: number;
  couponError?: string;
}

export function calculateCartTotals(
  items: Pick<CartItem, 'price' | 'originalPrice' | 'quantity'>[],
  coupon?: Coupon | null,
  now: Date = new Date()
): CartTotals {
  if (!items || items.length === 0) {
    return {
      subtotal: 0,
      originalSubtotal: 0,
      productSavings: 0,
      couponDiscount: 0,
      shippingCost: 0,
      tax: 0,
      totalAmount: 0,
      freeShippingRemaining: FREE_SHIPPING_THRESHOLD,
    };
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const originalSubtotal = items.reduce(
    (sum, item) => sum + (item.originalPrice || item.price) * item.quantity,
    0
  );
  const productSavings = Math.max(0, originalSubtotal - subtotal);

  let couponDiscount = 0;
  let couponError: string | undefined;

  if (coupon) {
    const expiry = new Date(coupon.expiryDate);
    if (!coupon.isActive) {
      couponError = 'This coupon code is currently inactive.';
    } else if (expiry.getTime() < now.getTime()) {
      couponError = 'This coupon code has expired.';
    } else if (coupon.usedCount >= coupon.usageLimit) {
      couponError = 'This coupon has reached its maximum usage limit.';
    } else if (subtotal < coupon.minimumPurchase) {
      couponError = `Minimum order of ${formatINR(coupon.minimumPurchase)} required for ${coupon.code}.`;
    } else {
      if (coupon.discountType === 'percentage') {
        couponDiscount = Math.round((subtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
          couponDiscount = coupon.maxDiscount;
        }
      } else {
        couponDiscount = coupon.discountValue;
      }
      couponDiscount = Math.min(couponDiscount, subtotal);
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const shippingCost =
    discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
  const tax = Math.round(discountedSubtotal * GST_RATE);
  const totalAmount = discountedSubtotal + shippingCost + tax;
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - discountedSubtotal);

  return {
    subtotal,
    originalSubtotal,
    productSavings,
    couponDiscount,
    shippingCost,
    tax,
    totalAmount,
    freeShippingRemaining,
    couponError,
  };
}

export function filterAndSortProducts(
  products: Product[],
  filters: Partial<ProductFilterState>
): Product[] {
  const {
    search = '',
    category = 'All',
    gender = 'All',
    brand = 'All',
    size = null,
    color = 'All',
    minPrice = 0,
    maxPrice = 50000,
    minDiscount = 0,
    minRating = 0,
    inStockOnly = false,
    sortBy = 'recommended',
  } = filters;

  const normalizedQuery = search.trim().toLowerCase();

  const filtered = products.filter((p) => {
    if (normalizedQuery) {
      const searchable = [
        p.name,
        p.brand,
        p.category,
        p.gender,
        p.description,
        ...p.colors.map((c) => c.name),
      ]
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(normalizedQuery)) return false;
    }

    if (category && category !== 'All') {
      const catMatch =
        p.category.toLowerCase() === category.toLowerCase() ||
        p.category.toLowerCase().includes(category.toLowerCase());
      if (!catMatch) return false;
    }

    if (gender && gender !== 'All') {
      if (p.gender.toLowerCase() !== gender.toLowerCase() && p.gender !== 'Unisex') {
        return false;
      }
    }

    if (brand && brand !== 'All') {
      if (p.brand.toLowerCase() !== brand.toLowerCase()) return false;
    }

    if (size !== null && size !== undefined) {
      const hasSizeInStock = p.sizes.some((s) => s.size === size && s.stock > 0);
      if (!hasSizeInStock) return false;
    }

    if (color && color !== 'All') {
      const hasColor = p.colors.some((c) =>
        c.name.toLowerCase().includes(color.toLowerCase())
      );
      if (!hasColor) return false;
    }

    if (p.price < minPrice || p.price > maxPrice) return false;
    if (p.discount < minDiscount) return false;
    if (p.rating < minRating) return false;
    if (inStockOnly && p.stock <= 0) return false;

    return true;
  });

  const sorted = [...filtered];
  switch (sortBy) {
    case 'price_asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      sorted.sort(
        (a, b) =>
          (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case 'top_rated':
      sorted.sort((a, b) => b.rating - a.rating || b.numReviews - a.numReviews);
      break;
    case 'best_selling':
    case 'popularity':
      sorted.sort(
        (a, b) =>
          (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0) ||
          b.numReviews - a.numReviews
      );
      break;
    case 'recommended':
    default:
      sorted.sort(
        (a, b) =>
          (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) ||
          b.rating - a.rating
      );
      break;
  }

  return sorted;
}

export interface PinDeliveryEstimate {
  valid: boolean;
  serviceable: boolean;
  cityZone?: string;
  estimatedDays?: string;
  estimatedDateText?: string;
  codAvailable?: boolean;
  message: string;
}

export function estimateDeliveryByPin(pinCode: string, fromDate: Date = new Date()): PinDeliveryEstimate {
  const cleaned = pinCode.trim();
  if (!/^[1-9][0-9]{5}$/.test(cleaned)) {
    return {
      valid: false,
      serviceable: false,
      message: 'Please enter a valid 6-digit Indian PIN code (e.g. 400001).',
    };
  }

  const prefix = cleaned.slice(0, 2);
  const metroPrefixes: Record<string, { city: string; days: number }> = {
    '11': { city: 'New Delhi NCR', days: 2 },
    '40': { city: 'Mumbai Metro', days: 2 },
    '56': { city: 'Bengaluru Metro', days: 2 },
    '50': { city: 'Hyderabad Metro', days: 3 },
    '60': { city: 'Chennai Metro', days: 3 },
    '70': { city: 'Kolkata Metro', days: 3 },
    '41': { city: 'Pune Region', days: 2 },
    '38': { city: 'Ahmedabad Region', days: 3 },
  };

  const zone = metroPrefixes[prefix] || { city: 'Standard Express Zone', days: 4 };
  const deliveryDate = new Date(fromDate);
  deliveryDate.setDate(deliveryDate.getDate() + zone.days);

  const formattedDate = deliveryDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return {
    valid: true,
    serviceable: true,
    cityZone: zone.city,
    estimatedDays: `${zone.days}–${zone.days + 1} business days`,
    estimatedDateText: `Estimated delivery by ${formattedDate}`,
    codAvailable: true,
    message: `Express delivery available to ${zone.city} (${cleaned}). Cash on Delivery & 7-day easy size exchange eligible.`,
  };
}

export const ELIGIBLE_CANCEL_STATUSES: OrderStatus[] = [
  'Order Placed',
  'Order Confirmed',
  'Processing',
];

export function canCancelOrder(status: OrderStatus): boolean {
  return ELIGIBLE_CANCEL_STATUSES.includes(status);
}

export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  'Order Placed',
  'Order Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];
