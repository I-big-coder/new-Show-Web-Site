import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  FolderKanban,
  Layers,
  MessageSquare,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
  Users,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductImage } from '../components/ProductCard';
import { formatINR } from '../utils/ecommerceLogic';
import type { Order, OrderStatus } from '../types';

const ALL_ORDER_STATUSES: OrderStatus[] = [
  'Order Placed',
  'Order Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned',
];

const PRESET_PRODUCT_IMAGES = [
  {
    label: 'AirFlex Runner (White/Orange)',
    url: '/src/assets/images/sneaker_airflex_runner_1793887767170.jpg',
  },
  {
    label: 'Arc-Zero Carbon Hero (Black/Orange)',
    url: '/src/assets/images/hero_sneaker_banner_1793887766132.jpg',
  },
  {
    label: 'Urban Street Court (White/Stone)',
    url: '/src/assets/images/sneaker_urban_street_1793887768442.jpg',
  },
  {
    label: 'ProSport Kinetic Trainer (Black/Blue)',
    url: '/src/assets/images/sneaker_prosport_training_1793887768991.jpg',
  },
  {
    label: 'StreetCore High Top (Black/Burnt Orange)',
    url: '/src/assets/images/sneaker_streetcore_hightop_1793887770489.jpg',
  },
  {
    label: 'Arketype Formal Oxford (Espresso)',
    url: '/src/assets/images/sneaker_formal_oxford_1793887771143.jpg',
  },
];

export const AdminDashboardPage: React.FC = () => {
  const {
    user,
    token,
    loginWithCredentials,
    products,
    categories,
    coupons,
    reviews,
    refreshCatalog,
    showToast,
  } = useStore();

  const [adminTab, setAdminTab] = useState<
    'overview' | 'products' | 'categories' | 'orders' | 'customers' | 'coupons' | 'reviews'
  >('overview');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [customerSearch, setCustomerSearch] = useState<string>('');

  // New Product Form State
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    brand: 'STEPZONE PRO',
    category: 'Running Shoes',
    gender: 'Men' as 'Men' | 'Women' | 'Unisex',
    price: 2999,
    originalPrice: 3999,
    description: '',
    image: PRESET_PRODUCT_IMAGES[0].url,
    isFeatured: true,
    isNewArrival: true,
  });

  // New Category Form
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryDesc, setNewCategoryDesc] = useState<string>('');

  // New Coupon Form
  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 15,
    minimumPurchase: 1999,
    usageLimit: 200,
    description: '',
  });

  const fetchAdminData = async () => {
    if (!token || user?.role !== 'admin') return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [dashRes, ordRes, usrRes] = await Promise.all([
        fetch('/api/admin/dashboard', { headers }),
        fetch('/api/admin/orders', { headers }),
        fetch('/api/admin/users', { headers }),
      ]);
      if (dashRes.ok) setDashboardData(await dashRes.json());
      if (ordRes.ok) {
        const d = await ordRes.json();
        setAdminOrders(d.orders || []);
      }
      if (usrRes.ok) {
        const d = await usrRes.json();
        setAdminUsers(d.users || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token, user]);

  // Role-based access gate with 1-click Admin Demo Login
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl p-8 border border-black/[0.08] text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-[#111111] text-[#FF5A1F] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5A1F]">
              Role-Based Authorization Required
            </p>
            <h1 className="font-display text-3xl font-bold uppercase text-[#111111]">
              STEPZONE Admin Console
            </h1>
            <p className="text-xs text-[#777777]">
              Only authenticated administrators can access inventory, revenue analytics,
              order fulfillment, and coupon management.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loginWithCredentials('admin@stepzone.in', 'Admin@123')}
            className="w-full py-3.5 px-6 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
          >
            Sign In as Demo Administrator (admin@stepzone.in)
          </button>
        </div>
      </div>
    );
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name.trim()) {
      showToast('Product name is required.', 'error');
      return;
    }
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...newProductForm,
        images: [newProductForm.image],
      }),
    });
    if (res.ok) {
      setNewProductForm({
        ...newProductForm,
        name: '',
        description: '',
      });
      await refreshCatalog();
      await fetchAdminData();
      showToast('New footwear product added to catalog!', 'success');
    } else {
      showToast('Failed to add product.', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await refreshCatalog();
      await fetchAdminData();
      showToast('Product removed from catalog.', 'info');
    }
  };

  const handleToggleProductFlag = async (
    id: string,
    field: 'isFeatured' | 'isNewArrival',
    currentValue: boolean
  ) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ [field]: !currentValue }),
    });
    if (res.ok) {
      await refreshCatalog();
      showToast('Product status updated.', 'success');
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    orderStatus: OrderStatus,
    trackingNumber?: string
  ) => {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderStatus, trackingNumber }),
    });
    if (res.ok) {
      await fetchAdminData();
      showToast(`Order status updated to ${orderStatus}.`, 'success');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newCategoryName,
        description: newCategoryDesc,
      }),
    });
    if (res.ok) {
      setNewCategoryName('');
      setNewCategoryDesc('');
      await refreshCatalog();
      showToast('Category added!', 'success');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponForm.code.trim()) return;
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newCouponForm),
    });
    if (res.ok) {
      setNewCouponForm({ ...newCouponForm, code: '', description: '' });
      await refreshCatalog();
      showToast('Coupon created!', 'success');
    }
  };

  const filteredAdminOrders = adminOrders.filter((o) => {
    if (orderStatusFilter !== 'All' && o.orderStatus !== orderStatusFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredAdminUsers = adminUsers.filter((u) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q)
    );
  });

  const stats = dashboardData?.stats || {
    totalRevenue: 1799793,
    totalOrders: 541,
    totalProducts: products.length,
    totalCustomers: 413,
    pendingOrders: 2,
    deliveredOrders: 485,
    lowStockCount: 1,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Top Header & Section Tabs */}
      <div className="bg-[#111111] text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#FF5A1F]">
            <ShieldCheck className="w-4 h-4" />
            <span>STEPZONE Enterprise Operations · Signed in as {user.name}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase mt-1">
            Admin Management Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'products', label: `Products (${products.length})`, icon: Boxes },
            { id: 'categories', label: `Categories (${categories.length})`, icon: Layers },
            { id: 'orders', label: `Orders (${adminOrders.length})`, icon: PackageCheck },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'coupons', label: `Coupons (${coupons.length})`, icon: Tag },
            { id: 'reviews', label: `Reviews (${reviews.length})`, icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAdminTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  adminTab === tab.id
                    ? 'bg-[#FF5A1F] text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. OVERVIEW & ANALYTICS TAB */}
      {adminTab === 'overview' && (
        <div className="space-y-8">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-white p-4 rounded-xl border border-black/[0.08]">
              <span className="text-[11px] font-semibold uppercase text-[#777777]">
                Total Revenue
              </span>
              <p className="font-mono text-lg font-bold text-[#111111] mt-1">
                {formatINR(stats.totalRevenue)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-black/[0.08]">
              <span className="text-[11px] font-semibold uppercase text-[#777777]">
                Total Orders
              </span>
              <p className="font-mono text-lg font-bold text-[#111111] mt-1">
                {stats.totalOrders}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-black/[0.08]">
              <span className="text-[11px] font-semibold uppercase text-[#777777]">
                Total Products
              </span>
              <p className="font-mono text-lg font-bold text-[#111111] mt-1">
                {products.length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-black/[0.08]">
              <span className="text-[11px] font-semibold uppercase text-[#777777]">
                Customers
              </span>
              <p className="font-mono text-lg font-bold text-[#111111] mt-1">
                {stats.totalCustomers}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-black/[0.08]">
              <span className="text-[11px] font-semibold uppercase text-[#777777]">
                Pending Orders
              </span>
              <p className="font-mono text-lg font-bold text-[#FF5A1F] mt-1">
                {stats.pendingOrders}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-black/[0.08]">
              <span className="text-[11px] font-semibold uppercase text-[#777777]">
                Delivered
              </span>
              <p className="font-mono text-lg font-bold text-emerald-700 mt-1">
                {stats.deliveredOrders}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-black/[0.08]">
              <span className="text-[11px] font-semibold uppercase text-[#777777]">
                Low Stock
              </span>
              <p className="font-mono text-lg font-bold text-amber-600 mt-1">
                {stats.lowStockCount}
              </p>
            </div>
          </div>

          {/* Analytics Charts Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Monthly Revenue Trends Chart */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-black/[0.08] space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
                    Monthly Revenue & Order Volume
                  </h2>
                  <p className="text-xs text-[#777777]">
                    6-Month STEPZONE Direct-to-Consumer Performance
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 items-end h-52 pt-6 px-2 border-b border-black/10">
                {(
                  dashboardData?.monthlySales || [
                    { month: 'Jun', revenue: 184500, orders: 54 },
                    { month: 'Jul', revenue: 229000, orders: 68 },
                    { month: 'Aug', revenue: 264800, orders: 79 },
                    { month: 'Sep', revenue: 312400, orders: 94 },
                    { month: 'Oct', revenue: 389200, orders: 118 },
                    { month: 'Nov', revenue: 425000, orders: 128 },
                  ]
                ).map((m: any) => {
                  const heightPct = Math.min(100, Math.round((m.revenue / 450000) * 100));
                  return (
                    <div
                      key={m.month}
                      className="flex flex-col items-center justify-end h-full gap-2"
                    >
                      <span className="text-[10px] font-mono font-bold text-[#111111]">
                        ₹{Math.round(m.revenue / 1000)}k
                      </span>
                      <div
                        className="w-full max-w-[42px] bg-[#111111] hover:bg-[#FF5A1F] rounded-t-lg transition-colors"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-xs font-semibold text-[#555555] pb-2">
                        {m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Performance & Low Stock Alert */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-black/[0.08] space-y-5">
              <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
                Category Performance
              </h2>
              <div className="space-y-3">
                {(dashboardData?.categoryPerformance || []).map((cat: any) => (
                  <div
                    key={cat.category}
                    className="p-3 rounded-xl bg-[#F5F5F5] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#111111]">{cat.category}</p>
                      <p className="text-[#777777]">
                        {cat.products} active styles · {cat.totalReviews} verified reviews
                      </p>
                    </div>
                    <span className="font-mono font-bold text-[#111111]">
                      Avg {formatINR(cat.avgPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {dashboardData?.lowStockProducts?.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Low Inventory Alert (&lt; 35 units)</span>
                  </div>
                  {dashboardData.lowStockProducts.map((lp: any) => (
                    <div
                      key={lp.id}
                      className="flex justify-between text-xs text-amber-950 font-mono"
                    >
                      <span className="font-sans font-medium">{lp.name}</span>
                      <span>{lp.stock} units remaining</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODUCT MANAGEMENT TAB */}
      {adminTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add New Product Form */}
          <form
            onSubmit={handleCreateProduct}
            className="lg:col-span-4 bg-white rounded-2xl p-6 border border-black/[0.08] space-y-4"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#FF5A1F]" />
              <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
                Add New Footwear
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#555555] mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={newProductForm.name}
                onChange={(e) =>
                  setNewProductForm({ ...newProductForm, name: e.target.value })
                }
                placeholder="e.g. HyperPulse Marathon Pro"
                className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={newProductForm.brand}
                  onChange={(e) =>
                    setNewProductForm({ ...newProductForm, brand: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1">
                  Gender
                </label>
                <select
                  value={newProductForm.gender}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      gender: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#555555] mb-1">
                Category
              </label>
              <select
                value={newProductForm.category}
                onChange={(e) =>
                  setNewProductForm({ ...newProductForm, category: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1">
                  Sale Price (INR)
                </label>
                <input
                  type="number"
                  required
                  value={newProductForm.price}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      price: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1">
                  MRP Price (INR)
                </label>
                <input
                  type="number"
                  required
                  value={newProductForm.originalPrice}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      originalPrice: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#555555] mb-1">
                Studio Photography Asset
              </label>
              <select
                value={newProductForm.image}
                onChange={(e) =>
                  setNewProductForm({ ...newProductForm, image: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
              >
                {PRESET_PRODUCT_IMAGES.map((img) => (
                  <option key={img.url} value={img.url}>
                    {img.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#555555] mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={newProductForm.description}
                onChange={(e) =>
                  setNewProductForm({
                    ...newProductForm,
                    description: e.target.value,
                  })
                }
                placeholder="Technical performance highlights..."
                className="w-full p-3 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
            >
              Publish Product to Catalog
            </button>
          </form>

          {/* Existing Products Table */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-black/[0.08] space-y-4">
            <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
              Catalog Inventory ({products.length} Products)
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/10 text-[#777777] uppercase">
                    <th className="py-2.5 pr-3">Product</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">Stock</th>
                    <th className="py-2.5 px-3">Flags</th>
                    <th className="py-2.5 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06]">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-[#F5F5F5]">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          <ProductImage
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-10 h-10 rounded-lg object-cover bg-[#ECECEC] shrink-0"
                          />
                          <div>
                            <p className="font-bold text-[#111111]">{prod.name}</p>
                            <p className="text-[11px] text-[#777777]">{prod.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#555555]">{prod.category}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#111111]">
                        {formatINR(prod.price)}
                      </td>
                      <td className="py-3 px-3 font-mono">{prod.stock}</td>
                      <td className="py-3 px-3 space-x-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleProductFlag(
                              prod.id,
                              'isFeatured',
                              prod.isFeatured
                            )
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            prod.isFeatured
                              ? 'bg-[#111111] text-white'
                              : 'bg-black/5 text-[#777777]'
                          }`}
                        >
                          Featured
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleProductFlag(
                              prod.id,
                              'isNewArrival',
                              prod.isNewArrival
                            )
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            prod.isNewArrival
                              ? 'bg-[#FF5A1F] text-white'
                              : 'bg-black/5 text-[#777777]'
                          }`}
                        >
                          New
                        </button>
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          aria-label={`Delete ${prod.name}`}
                          className="p-1.5 text-[#777777] hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. CATEGORY MANAGEMENT TAB */}
      {adminTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleCreateCategory}
            className="lg:col-span-4 bg-white rounded-2xl p-6 border border-black/[0.08] space-y-4"
          >
            <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
              Add Category
            </h2>
            <input
              type="text"
              required
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category Name (e.g. Marathon Racers)"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
            />
            <textarea
              rows={3}
              value={newCategoryDesc}
              onChange={(e) => setNewCategoryDesc(e.target.value)}
              placeholder="Category description..."
              className="w-full p-3 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-semibold rounded-lg"
            >
              Create Category
            </button>
          </form>

          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-black/[0.08] space-y-4">
            <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
              Active Categories ({categories.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-xl border border-black/10 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-bold text-[#111111]">{cat.name}</p>
                    <p className="text-xs text-[#777777] line-clamp-1">
                      {cat.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/categories/${cat.id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      await refreshCatalog();
                      showToast('Category deleted.', 'info');
                    }}
                    aria-label={`Delete category ${cat.name}`}
                    className="p-1.5 text-[#777777] hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. ORDER MANAGEMENT TAB */}
      {adminTab === 'orders' && (
        <div className="bg-white rounded-2xl p-6 border border-black/[0.08] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
              Order Fulfillment & Status Control ({filteredAdminOrders.length})
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search Order ID or Customer..."
                  className="pl-8 pr-3 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-semibold"
              >
                <option value="All">All Statuses</option>
                {ALL_ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredAdminOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-5 rounded-xl border border-black/10 space-y-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-black/[0.06]">
                  <div>
                    <span className="font-mono font-bold text-sm text-[#111111]">
                      {ord.orderNumber}
                    </span>
                    <span className="text-[#555555] ml-2">
                      · {ord.customerName} ({ord.customerEmail})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-[#111111]">
                      {formatINR(ord.totalAmount)}
                    </span>
                    <span className="text-[#777777]">
                      ({ord.paymentMethod} — {ord.paymentStatus})
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="text-[#555555]">
                    {ord.items.map((i) => `${i.name} (UK ${i.size} x${i.quantity})`).join(', ')}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[#777777] font-semibold">Update Status:</label>
                    <select
                      aria-label={`Update status for order ${ord.orderNumber}`}
                      value={ord.orderStatus}
                      onChange={(e) =>
                        handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)
                      }
                      className="px-3 py-1.5 rounded-lg bg-[#111111] text-white text-xs font-semibold"
                    >
                      {ALL_ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. CUSTOMER MANAGEMENT TAB */}
      {adminTab === 'customers' && (
        <div className="bg-white rounded-2xl p-6 border border-black/[0.08] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
              Registered Customers ({filteredAdminUsers.length})
            </h2>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search customer by name, email, or phone..."
              className="px-3.5 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs w-full sm:w-72"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-black/10 text-[#777777] uppercase">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Email & Phone</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5">Orders</th>
                  <th className="py-2.5">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {filteredAdminUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 font-bold text-[#111111]">{u.name}</td>
                    <td className="py-3 text-[#555555]">
                      {u.email} · <span className="font-mono">{u.phone}</span>
                    </td>
                    <td className="py-3 uppercase font-mono">{u.role}</td>
                    <td className="py-3 font-mono font-bold">{u.orderCount || 0}</td>
                    <td className="py-3">
                      {u.role !== 'admin' ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/admin/users/${u.id}/toggle-active`, {
                              method: 'PUT',
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            await fetchAdminData();
                            showToast('Customer account status updated.', 'info');
                          }}
                          className={`px-3 py-1 rounded-lg font-semibold ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-red-100 text-red-900'
                          }`}
                        >
                          {u.isActive ? 'Active (Click to Deactivate)' : 'Deactivated'}
                        </button>
                      ) : (
                        <span className="text-[#777777]">Protected Admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. COUPON MANAGEMENT TAB */}
      {adminTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleCreateCoupon}
            className="lg:col-span-4 bg-white rounded-2xl p-6 border border-black/[0.08] space-y-4"
          >
            <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
              Create Promo Coupon
            </h2>
            <div>
              <label className="block text-xs font-semibold text-[#555555] mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                required
                value={newCouponForm.code}
                onChange={(e) =>
                  setNewCouponForm({
                    ...newCouponForm,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g. DIWALI25"
                className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-mono uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1">
                  Discount Type
                </label>
                <select
                  value={newCouponForm.discountType}
                  onChange={(e) =>
                    setNewCouponForm({
                      ...newCouponForm,
                      discountType: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed INR (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1">
                  Value
                </label>
                <input
                  type="number"
                  required
                  value={newCouponForm.discountValue}
                  onChange={(e) =>
                    setNewCouponForm({
                      ...newCouponForm,
                      discountValue: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#555555] mb-1">
                Minimum Purchase (INR)
              </label>
              <input
                type="number"
                required
                value={newCouponForm.minimumPurchase}
                onChange={(e) =>
                  setNewCouponForm({
                    ...newCouponForm,
                    minimumPurchase: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-semibold rounded-lg"
            >
              Save Coupon Code
            </button>
          </form>

          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-black/[0.08] space-y-4">
            <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
              Active & Configured Coupons ({coupons.length})
            </h2>
            <div className="space-y-3">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-black/10 flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-sm text-[#111111]">
                      {c.code}
                    </span>
                    <span className="text-[#555555] ml-2">
                      ·{' '}
                      {c.discountType === 'percentage'
                        ? `${c.discountValue}% OFF`
                        : `Flat ${formatINR(c.discountValue)} OFF`}{' '}
                      (Min Order {formatINR(c.minimumPurchase)})
                    </span>
                    <p className="text-[11px] text-[#777777] font-mono mt-0.5">
                      Used {c.usedCount} / {c.usageLimit} times
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/coupons/${c.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ isActive: !c.isActive }),
                      });
                      await refreshCatalog();
                      showToast('Coupon status updated.', 'info');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-semibold ${
                      c.isActive
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. REVIEW MODERATION TAB */}
      {adminTab === 'reviews' && (
        <div className="bg-white rounded-2xl p-6 border border-black/[0.08] space-y-4">
          <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
            Customer Review Moderation ({reviews.length})
          </h2>
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-xl border border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <p className="font-bold text-[#111111]">
                    {rev.userName} on{' '}
                    <span className="text-[#FF5A1F]">{rev.productName}</span> (
                    {rev.rating}★)
                  </p>
                  <p className="text-[#555555]">“{rev.comment}”</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/admin/reviews/${rev.id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      await refreshCatalog();
                      showToast('Review deleted.', 'info');
                    }}
                    className="px-3 py-1.5 border border-red-200 text-red-700 rounded-lg font-semibold hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
