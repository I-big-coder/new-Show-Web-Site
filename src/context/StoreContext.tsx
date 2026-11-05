import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type {
  Address,
  CartItem,
  Category,
  Coupon,
  Order,
  Product,
  Review,
  User,
} from '../types';
import { calculateCartTotals, CartTotals } from '../utils/ecommerceLogic';

export type ActivePage =
  | 'home'
  | 'catalog'
  | 'product'
  | 'cart'
  | 'wishlist'
  | 'checkout'
  | 'auth'
  | 'dashboard'
  | 'track-order'
  | 'admin';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface StoreContextType {
  // Navigation
  activePage: ActivePage;
  selectedProductId: string | null;
  selectedOrderId: string | null;
  catalogCategoryFilter: string;
  catalogGenderFilter: string;
  catalogSearchQuery: string;
  navigateTo: (
    page: ActivePage,
    options?: {
      productId?: string;
      orderId?: string;
      category?: string;
      gender?: string;
      search?: string;
    }
  ) => void;

  // Data
  products: Product[];
  categories: Category[];
  coupons: Coupon[];
  reviews: Review[];
  isLoading: boolean;
  refreshCatalog: () => Promise<void>;

  // Auth
  user: User | null;
  token: string | null;
  loginWithCredentials: (identifier: string, password: string) => Promise<boolean>;
  registerAccount: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (updates: {
    name?: string;
    phone?: string;
    addresses?: Address[];
  }) => Promise<boolean>;

  // Cart & Drawer
  cart: CartItem[];
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  addToCart: (
    product: Product,
    size: number,
    color: string,
    quantity?: number,
    openDrawer?: boolean
  ) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  applyCouponCode: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  cartTotals: CartTotals;

  // Wishlist
  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  moveWishlistToCart: (product: Product) => void;

  // Orders
  myOrders: Order[];
  fetchMyOrders: () => Promise<void>;
  placeOrder: (payload: {
    shippingAddress: Address;
    paymentMethod: 'Razorpay' | 'COD';
    paymentDetails?: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    };
  }) => Promise<Order | null>;
  cancelCustomerOrder: (orderId: string, reason?: string) => Promise<boolean>;

  // Search history
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TOKEN: 'stepzone_auth_token',
  USER: 'stepzone_auth_user',
  CART: 'stepzone_cart_items',
  WISHLIST: 'stepzone_wishlist_ids',
  COUPON: 'stepzone_applied_coupon',
  RECENT_SEARCHES: 'stepzone_recent_searches',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>('prod-1');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('All');
  const [catalogGenderFilter, setCatalogGenderFilter] = useState<string>('All');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>('');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEYS.TOKEN)
  );
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COUPON);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WISHLIST);
      return saved ? JSON.parse(saved) : ['prod-1', 'prod-7'];
    } catch {
      return ['prod-1', 'prod-7'];
    }
  });

  const [myOrders, setMyOrders] = useState<Order[]>([]);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
      return saved
        ? JSON.parse(saved)
        : ['AirFlex Runner', 'Running Shoes', 'Limited Edition', 'Formal Oxford'];
    } catch {
      return ['AirFlex Runner', 'Running Shoes'];
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshCatalog = async () => {
    try {
      const [prodRes, catRes, coupRes, revRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/coupons'),
        fetch('/api/reviews'),
      ]);
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data.products || []);
      }
      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(data.categories || []);
      }
      if (coupRes.ok) {
        const data = await coupRes.json();
        setCoupons(data.coupons || []);
      }
      if (revRes.ok) {
        const data = await revRes.json();
        setReviews(data.reviews || []);
      }
    } catch {
      // Keep existing state if offline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    if (token) {
      fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: cart }),
      }).catch(() => {});
    }
  }, [cart, token]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem(STORAGE_KEYS.COUPON, JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem(STORAGE_KEYS.COUPON);
    }
  }, [appliedCoupon]);

  const fetchMyOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyOrders(data.orders || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyOrders();
    } else {
      setMyOrders([]);
    }
  }, [token]);

  const navigateTo = (
    page: ActivePage,
    options?: {
      productId?: string;
      orderId?: string;
      category?: string;
      gender?: string;
      search?: string;
    }
  ) => {
    if (options?.productId) setSelectedProductId(options.productId);
    if (options?.orderId !== undefined) setSelectedOrderId(options.orderId);
    if (options?.category !== undefined) setCatalogCategoryFilter(options.category);
    if (options?.gender !== undefined) setCatalogGenderFilter(options.gender);
    if (options?.search !== undefined) setCatalogSearchQuery(options.search);
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loginWithCredentials = async (
    identifier: string,
    password: string
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Login failed.', 'error');
        return false;
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
      showToast(`Welcome back, ${data.user.name.split(' ')[0]}!`, 'success');
      return true;
    } catch {
      showToast('Network error while signing in.', 'error');
      return false;
    }
  };

  const registerAccount = async (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Registration failed.', 'error');
        return false;
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
      showToast(`Account created! Welcome to STEPZONE, ${data.user.name}.`, 'success');
      return true;
    } catch {
      showToast('Network error while creating account.', 'error');
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    showToast('Signed out of your STEPZONE account.', 'info');
    setActivePage('home');
  };

  const updateUserProfile = async (updates: {
    name?: string;
    phone?: string;
    addresses?: Address[];
  }): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        showToast('Profile and saved addresses updated.', 'success');
        return true;
      }
      showToast(data.error || 'Failed to update profile.', 'error');
      return false;
    } catch {
      showToast('Unable to save profile changes.', 'error');
      return false;
    }
  };

  const addToCart = (
    product: Product,
    size: number,
    color: string,
    quantity = 1,
    openDrawer = true
  ) => {
    const sizeRecord = product.sizes.find((s) => s.size === size);
    const availableStock = sizeRecord ? sizeRecord.stock : product.stock;
    if (availableStock <= 0) {
      showToast(`Size UK ${size} is currently out of stock.`, 'error');
      return;
    }

    const itemId = `${product.id}-${size}-${color}`;
    const colorVariant = product.colors.find((c) => c.name === color);
    const itemImage = colorVariant?.image || product.images[0];

    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing) {
        const nextQty = Math.min(availableStock, existing.quantity + quantity);
        if (nextQty === existing.quantity) {
          showToast(`Maximum available stock (${availableStock}) reached for UK ${size}.`, 'info');
          return prev;
        }
        return prev.map((i) => (i.id === itemId ? { ...i, quantity: nextQty } : i));
      }
      return [
        ...prev,
        {
          id: itemId,
          productId: product.id,
          name: product.name,
          slug: product.slug,
          brand: product.brand,
          image: itemImage,
          price: product.price,
          originalPrice: product.originalPrice,
          discount: product.discount,
          size,
          color,
          quantity: Math.min(availableStock, quantity),
          maxStock: availableStock,
        },
      ];
    });

    showToast(`Added ${product.name} (UK ${size}) to your bag.`, 'success');
    if (openDrawer) {
      setIsCartDrawerOpen(true);
    }
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (quantity > item.maxStock) {
          showToast(`Only ${item.maxStock} pairs available in Size UK ${item.size}.`, 'info');
          return { ...item, quantity: item.maxStock };
        }
        return { ...item, quantity };
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
    showToast('Item removed from your shopping bag.', 'info');
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const cartTotals = useMemo(
    () => calculateCartTotals(cart, appliedCoupon),
    [cart, appliedCoupon]
  );

  const applyCouponCode = async (code: string): Promise<boolean> => {
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) {
      showToast('Please enter a coupon code.', 'error');
      return false;
    }
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleaned, subtotal: cartTotals.subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Invalid coupon code.', 'error');
        return false;
      }
      setAppliedCoupon(data.coupon);
      showToast(
        `Coupon ${data.coupon.code} applied! You saved ₹${data.discountAmount.toLocaleString('en-IN')}.`,
        'success'
      );
      return true;
    } catch {
      showToast('Error validating coupon code.', 'error');
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed.', 'info');
  };

  const toggleWishlist = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(
        exists
          ? `Removed ${prod?.name || 'shoe'} from wishlist.`
          : `Saved ${prod?.name || 'shoe'} to your wishlist.`,
        'info'
      );
      return next;
    });
    if (token) {
      fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      }).catch(() => {});
    }
  };

  const moveWishlistToCart = (product: Product) => {
    const firstAvailableSize =
      product.sizes.find((s) => s.stock > 0)?.size || product.sizes[0]?.size || 8;
    const defaultColor = product.colors[0]?.name || 'Standard';
    addToCart(product, firstAvailableSize, defaultColor, 1, true);
    setWishlistIds((prev) => prev.filter((id) => id !== product.id));
  };

  const placeOrder = async (payload: {
    shippingAddress: Address;
    paymentMethod: 'Razorpay' | 'COD';
    paymentDetails?: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    };
  }): Promise<Order | null> => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: cart,
          shippingAddress: payload.shippingAddress,
          paymentMethod: payload.paymentMethod,
          paymentDetails: payload.paymentDetails,
          couponCode: appliedCoupon?.code,
          userId: user?.id || 'user-cust-1',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Could not place order.', 'error');
        return null;
      }
      clearCart();
      await refreshCatalog();
      await fetchMyOrders();
      showToast(`Order ${data.order.orderNumber} confirmed!`, 'success');
      return data.order as Order;
    } catch {
      showToast('Network error while placing your order.', 'error');
      return null;
    }
  };

  const cancelCustomerOrder = async (
    orderId: string,
    reason = 'Customer requested cancellation before dispatch'
  ): Promise<boolean> => {
    if (!token) {
      showToast('Please sign in to manage your orders.', 'error');
      return false;
    }
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Order cannot be cancelled.', 'error');
        return false;
      }
      await fetchMyOrders();
      await refreshCatalog();
      showToast(`Order ${data.order.orderNumber} has been cancelled.`, 'info');
      return true;
    } catch {
      showToast('Unable to cancel order right now.', 'error');
      return false;
    }
  };

  const addRecentSearch = (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    setRecentSearches((prev) => {
      const next = [
        cleaned,
        ...prev.filter((item) => item.toLowerCase() !== cleaned.toLowerCase()),
      ].slice(0, 6);
      localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(next));
      return next;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
  };

  return (
    <StoreContext.Provider
      value={{
        activePage,
        selectedProductId,
        selectedOrderId,
        catalogCategoryFilter,
        catalogGenderFilter,
        catalogSearchQuery,
        navigateTo,
        products,
        categories,
        coupons,
        reviews,
        isLoading,
        refreshCatalog,
        user,
        token,
        loginWithCredentials,
        registerAccount,
        logout,
        updateUserProfile,
        cart,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        appliedCoupon,
        applyCouponCode,
        removeCoupon,
        cartTotals,
        wishlistIds,
        toggleWishlist,
        moveWishlistToCart,
        myOrders,
        fetchMyOrders,
        placeOrder,
        cancelCustomerOrder,
        recentSearches,
        addRecentSearch,
        clearRecentSearches,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
