import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  LogOut,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  User as UserIcon,
  XCircle,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductImage } from '../components/ProductCard';
import {
  canCancelOrder,
  formatINR,
  ORDER_STATUS_SEQUENCE,
} from '../utils/ecommerceLogic';
import type { Order } from '../types';

export const AuthAndDashboardPage: React.FC<{ initialTab?: 'orders' | 'track' }> = ({
  initialTab,
}) => {
  const {
    user,
    loginWithCredentials,
    registerAccount,
    logout,
    updateUserProfile,
    myOrders,
    fetchMyOrders,
    cancelCustomerOrder,
    selectedOrderId,
    navigateTo,
    wishlistIds,
    products,
    showToast,
  } = useStore();

  // Auth mode state
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginIdentifier, setLoginIdentifier] = useState<string>('arjun@stepzone.in');
  const [loginPassword, setLoginPassword] = useState<string>('Customer@123');

  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState<string>('arjun@stepzone.in');
  const [generatedResetToken, setGeneratedResetToken] = useState<string>('');
  const [resetTokenInput, setResetTokenInput] = useState<string>('');
  const [resetNewPassword, setResetNewPassword] = useState<string>('');

  // Customer Dashboard Tab state
  const [dashTab, setDashTab] = useState<
    'profile' | 'orders' | 'tracking' | 'addresses' | 'password'
  >(initialTab === 'track' ? 'tracking' : 'orders');

  const [trackingQuery, setTrackingQuery] = useState<string>(
    selectedOrderId || 'SZ-2026-8841'
  );
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackingError, setTrackingError] = useState<string>('');

  const [profileName, setProfileName] = useState<string>(user?.name || '');
  const [profilePhone, setProfilePhone] = useState<string>(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [token] = useState<string | null>(() =>
    localStorage.getItem('stepzone_auth_token')
  );

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone);
      fetchMyOrders();
    }
  }, [user]);

  useEffect(() => {
    if (initialTab === 'track') {
      setDashTab('tracking');
      handleLookupOrder(selectedOrderId || trackingQuery);
    }
  }, [initialTab, selectedOrderId]);

  const handleLookupOrder = async (queryId: string) => {
    const q = queryId.trim();
    if (!q) return;
    setTrackingError('');
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setTrackedOrder(null);
        setTrackingError(data.error || 'Order not found.');
        return;
      }
      setTrackedOrder(data.order);
    } catch {
      setTrackingError('Unable to fetch order tracking details.');
    }
  };

  // Standalone Track Order View when user clicked "Track Order" without logging in
  if (!user && initialTab === 'track') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.08] space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5A1F]">
              Real-Time Shipment Telemetry
            </p>
            <h1 className="font-display text-3xl font-bold uppercase text-[#111111]">
              Track Your STEPZONE Order
            </h1>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookupOrder(trackingQuery);
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              value={trackingQuery}
              onChange={(e) => setTrackingQuery(e.target.value)}
              placeholder="Enter Order ID (e.g. SZ-2026-8841 or SZ-2026-8904)"
              aria-label="Order ID or Tracking Number"
              className="flex-1 px-4 py-3 rounded-xl bg-[#F5F5F5] border border-black/15 text-xs font-mono text-[#111111]"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
            >
              Track Order
            </button>
          </form>

          {trackingError && (
            <p className="text-xs text-red-600 font-medium">{trackingError}</p>
          )}

          {trackedOrder && <OrderTrackingTimelineCard order={trackedOrder} />}
        </div>
      </div>
    );
  }

  // AUTHENTICATION VIEW (Login / Register / Forgot Password)
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.08] space-y-6">
          <div className="text-center space-y-1">
            <span className="font-display text-3xl font-bold tracking-tight text-[#111111]">
              STEPZONE
            </span>
            <p className="text-xs text-[#777777]">
              {authTab === 'login'
                ? 'Sign in with your Email or Mobile Number'
                : authTab === 'register'
                ? 'Create your STEPZONE Member Account'
                : 'Reset your password using a secure token'}
            </p>
          </div>

          {/* Segmented Auth Mode Switcher */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#F5F5F5] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAuthTab('login')}
              className={`py-2 rounded-lg transition-colors ${
                authTab === 'login'
                  ? 'bg-white text-[#111111] shadow-xs'
                  : 'text-[#777777]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthTab('register')}
              className={`py-2 rounded-lg transition-colors ${
                authTab === 'register'
                  ? 'bg-white text-[#111111] shadow-xs'
                  : 'text-[#777777]'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => setAuthTab('forgot')}
              className={`py-2 rounded-lg transition-colors ${
                authTab === 'forgot'
                  ? 'bg-white text-[#111111] shadow-xs'
                  : 'text-[#777777]'
              }`}
            >
              Reset
            </button>
          </div>

          {authTab === 'login' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await loginWithCredentials(loginIdentifier, loginPassword);
                if (ok) {
                  navigateTo('dashboard');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="login-identifier"
                  className="block text-xs font-semibold text-[#555555] mb-1"
                >
                  Email Address or Mobile Number
                </label>
                <input
                  id="login-identifier"
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="arjun@stepzone.in or 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs text-[#111111]"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-[#555555] mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs text-[#111111] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
              >
                Sign In to STEPZONE
              </button>

              {/* Quick Demo Account Buttons for Instant Testing */}
              <div className="pt-3 border-t border-black/10 space-y-2">
                <p className="text-[11px] text-[#777777] text-center">
                  Instant Demo Accounts (One-Click Sign In):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await loginWithCredentials(
                        'arjun@stepzone.in',
                        'Customer@123'
                      );
                      if (ok) navigateTo('dashboard');
                    }}
                    className="py-2 px-3 rounded-lg bg-[#F5F5F5] hover:bg-black/10 text-xs font-semibold text-[#111111]"
                  >
                    Customer Login
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await loginWithCredentials(
                        'admin@stepzone.in',
                        'Admin@123'
                      );
                      if (ok) navigateTo('admin');
                    }}
                    className="py-2 px-3 rounded-lg bg-[#111111] text-white hover:bg-[#FF5A1F] text-xs font-semibold"
                  >
                    Admin Login
                  </button>
                </div>
              </div>
            </form>
          )}

          {authTab === 'register' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (regForm.password !== regForm.confirmPassword) {
                  showToast('Passwords do not match.', 'error');
                  return;
                }
                const ok = await registerAccount({
                  name: regForm.name,
                  email: regForm.email,
                  phone: regForm.phone,
                  password: regForm.password,
                });
                if (ok) navigateTo('dashboard');
              }}
              className="space-y-3.5"
            >
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs font-semibold text-[#555555] mb-1"
                >
                  Full Name *
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  placeholder="Riya Kapoor"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-semibold text-[#555555] mb-1"
                >
                  Email Address *
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="riya@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-phone"
                  className="block text-xs font-semibold text-[#555555] mb-1"
                >
                  Mobile Number *
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  placeholder="9876501234"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-mono"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold text-[#555555] mb-1"
                >
                  Password (min 6 chars) *
                </label>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-confirm"
                  className="block text-xs font-semibold text-[#555555] mb-1"
                >
                  Confirm Password *
                </label>
                <input
                  id="reg-confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={regForm.confirmPassword}
                  onChange={(e) =>
                    setRegForm({ ...regForm, confirmPassword: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-[#FF5A1F] hover:bg-[#e04812] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
              >
                Create Account
              </button>
            </form>
          )}

          {authTab === 'forgot' && (
            <div className="space-y-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: forgotEmail }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    showToast(data.error || 'Could not generate reset token.', 'error');
                    return;
                  }
                  setGeneratedResetToken(data.resetToken);
                  setResetTokenInput(data.resetToken);
                  showToast('Expiring reset token generated!', 'success');
                }}
                className="space-y-3"
              >
                <label
                  htmlFor="forgot-email"
                  className="block text-xs font-semibold text-[#555555]"
                >
                  Registered Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#111111] text-white text-xs font-semibold rounded-lg"
                >
                  Generate Expiring Reset Token
                </button>
              </form>

              {generatedResetToken && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const res = await fetch('/api/auth/reset-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: forgotEmail,
                        token: resetTokenInput,
                        newPassword: resetNewPassword,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      showToast(data.error || 'Reset failed.', 'error');
                      return;
                    }
                    showToast(data.message, 'success');
                    setAuthTab('login');
                  }}
                  className="p-4 rounded-xl bg-[#F5F5F5] space-y-3 border border-black/10"
                >
                  <p className="text-xs text-emerald-800 font-medium">
                    Reset Token Issued:{' '}
                    <strong className="font-mono">{generatedResetToken}</strong>
                  </p>
                  <input
                    type="text"
                    required
                    value={resetTokenInput}
                    onChange={(e) => setResetTokenInput(e.target.value)}
                    placeholder="Reset Token"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-black/15 text-xs font-mono"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Enter New Password (min 6 chars)"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-black/15 text-xs"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#FF5A1F] text-white text-xs font-semibold rounded-lg"
                  >
                    Confirm New Password
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // AUTHENTICATED CUSTOMER DASHBOARD
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Dashboard Navigation Sidebar */}
        <aside className="lg:col-span-3 bg-white rounded-2xl p-6 border border-black/[0.08] space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-black/10">
            <div className="w-11 h-11 rounded-full bg-[#111111] text-white font-bold text-sm flex items-center justify-center">
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#111111] truncate">{user.name}</p>
              <p className="text-xs text-[#777777] truncate">{user.email}</p>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setDashTab('orders')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-colors ${
                dashTab === 'orders'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#222222] hover:bg-[#F5F5F5]'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>My Orders ({myOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDashTab('tracking');
                if (myOrders[0]) handleLookupOrder(myOrders[0].orderNumber);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-colors ${
                dashTab === 'tracking'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#222222] hover:bg-[#F5F5F5]'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Order Tracking</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('wishlist')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[#222222] hover:bg-[#F5F5F5]"
            >
              <Heart className="w-4 h-4" />
              <span>My Wishlist ({wishlistIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setDashTab('addresses')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-colors ${
                dashTab === 'addresses'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#222222] hover:bg-[#F5F5F5]'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Saved Addresses ({user.addresses?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setDashTab('profile')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-colors ${
                dashTab === 'profile'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#222222] hover:bg-[#F5F5F5]'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>My Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setDashTab('password')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-colors ${
                dashTab === 'password'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#222222] hover:bg-[#F5F5F5]'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Change Password</span>
            </button>

            {user.role === 'admin' && (
              <button
                type="button"
                onClick={() => navigateTo('admin')}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#FF5A1F] text-white"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open Admin Console</span>
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-red-600 hover:bg-red-50 mt-4"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Dashboard Main Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* MY ORDERS TAB */}
          {dashTab === 'orders' && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.08] space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="font-display text-3xl font-bold uppercase text-[#111111]">
                  My Orders ({myOrders.length})
                </h1>
              </div>

              {myOrders.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-sm font-semibold text-[#111111]">
                    You haven’t placed any orders yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo('catalog')}
                    className="px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold rounded-lg"
                  >
                    Shop Footwear
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl border border-black/10 p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-black/[0.06] text-xs">
                        <div className="space-x-3">
                          <span className="font-mono font-bold text-[#111111] text-sm">
                            {order.orderNumber}
                          </span>
                          <span className="text-[#777777]">
                            · Placed on{' '}
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold text-[#555555]">
                            Payment: {order.paymentMethod} ({order.paymentStatus})
                          </span>
                          <span className="font-semibold text-[#FF5A1F]">
                            · {order.orderStatus}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-4 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <ProductImage
                                src={item.image}
                                alt={item.name}
                                className="w-14 h-14 rounded-lg object-cover bg-[#ECECEC]"
                              />
                              <div>
                                <p className="font-bold text-[#111111] text-sm">
                                  {item.name}
                                </p>
                                <p className="text-[#777777] font-mono">
                                  UK {item.size} · {item.color} · Qty {item.quantity}
                                </p>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-[#111111]">
                              {formatINR(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-3">
                        <div className="font-mono text-sm font-bold text-[#111111]">
                          Order Total: {formatINR(order.totalAmount)}
                        </div>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTrackingQuery(order.orderNumber);
                              setTrackedOrder(order);
                              setDashTab('tracking');
                            }}
                            className="px-4 py-2 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            Track Timeline
                          </button>

                          {canCancelOrder(order.orderStatus) && (
                            <button
                              type="button"
                              onClick={() => cancelCustomerOrder(order.id)}
                              className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors"
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ORDER TRACKING TIMELINE TAB */}
          {dashTab === 'tracking' && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.08] space-y-6">
              <h1 className="font-display text-3xl font-bold uppercase text-[#111111]">
                Order Tracking Timeline
              </h1>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookupOrder(trackingQuery);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={trackingQuery}
                  onChange={(e) => setTrackingQuery(e.target.value)}
                  placeholder="Enter Order ID (e.g. SZ-2026-8841)"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-mono"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold rounded-lg"
                >
                  Track
                </button>
              </form>

              {trackedOrder ? (
                <OrderTrackingTimelineCard order={trackedOrder} />
              ) : (
                myOrders[0] && <OrderTrackingTimelineCard order={myOrders[0]} />
              )}
            </div>
          )}

          {/* SAVED ADDRESSES TAB */}
          {dashTab === 'addresses' && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.08] space-y-6">
              <h1 className="font-display text-3xl font-bold uppercase text-[#111111]">
                Saved Delivery Addresses
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(user.addresses || []).map((addr) => (
                  <div
                    key={addr.id}
                    className="p-5 rounded-xl border border-black/10 space-y-1.5 text-xs"
                  >
                    <p className="font-bold text-sm text-[#111111]">{addr.fullName}</p>
                    <p className="text-[#555555]">{addr.fullAddress}</p>
                    <p className="font-mono text-[#777777]">
                      {addr.city}, {addr.state} — {addr.pinCode}
                    </p>
                    <p className="font-mono text-[#777777]">Phone: {addr.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MY PROFILE TAB */}
          {dashTab === 'profile' && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.08] space-y-6">
              <h1 className="font-display text-3xl font-bold uppercase text-[#111111]">
                My Profile
              </h1>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateUserProfile({ name: profileName, phone: profilePhone });
                }}
                className="space-y-4 max-w-md"
              >
                <div>
                  <label
                    htmlFor="prof-name"
                    className="block text-xs font-semibold text-[#555555] mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    id="prof-name"
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prof-phone"
                    className="block text-xs font-semibold text-[#555555] mb-1"
                  >
                    Mobile Number
                  </label>
                  <input
                    id="prof-phone"
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Save Profile Changes
                </button>
              </form>
            </div>
          )}

          {/* CHANGE PASSWORD TAB */}
          {dashTab === 'password' && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.08] space-y-6">
              <h1 className="font-display text-3xl font-bold uppercase text-[#111111]">
                Change Password
              </h1>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ currentPassword, newPassword }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    showToast(data.error || 'Failed to update password.', 'error');
                    return;
                  }
                  setCurrentPassword('');
                  setNewPassword('');
                  showToast('Password updated successfully!', 'success');
                }}
                className="space-y-4 max-w-md"
              >
                <div>
                  <label
                    htmlFor="curr-pass"
                    className="block text-xs font-semibold text-[#555555] mb-1"
                  >
                    Current Password
                  </label>
                  <input
                    id="curr-pass"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-pass"
                    className="block text-xs font-semibold text-[#555555] mb-1"
                  >
                    New Password (min 6 chars)
                  </label>
                  <input
                    id="new-pass"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-semibold rounded-lg"
                >
                  Update Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OrderTrackingTimelineCard: React.FC<{ order: Order }> = ({ order }) => {
  const currentStepIndex = ORDER_STATUS_SEQUENCE.indexOf(order.orderStatus);
  const isCancelledOrReturned =
    order.orderStatus === 'Cancelled' || order.orderStatus === 'Returned';

  return (
    <div className="p-5 rounded-xl bg-[#F5F5F5] border border-black/10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-4">
        <div>
          <p className="text-xs text-[#777777]">Order Number</p>
          <p className="font-mono text-lg font-bold text-[#111111]">
            {order.orderNumber}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#777777]">Tracking Number</p>
          <p className="font-mono text-sm font-bold text-[#FF5A1F]">
            {order.trackingNumber}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#777777]">Current Status</p>
          <p className="text-sm font-bold text-[#111111]">{order.orderStatus}</p>
        </div>
      </div>

      {/* 6-Stage Standard Progression Bar */}
      {!isCancelledOrReturned ? (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {ORDER_STATUS_SEQUENCE.map((stage, idx) => {
            const completed = idx <= currentStepIndex;
            return (
              <div
                key={stage}
                className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2 ${
                  completed
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#777777] border-black/10'
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 ${
                    completed ? 'text-[#FF5A1F]' : 'text-neutral-300'
                  }`}
                />
                <span className="font-semibold leading-tight">{stage}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-red-950 text-red-100 flex items-center gap-3 text-xs">
          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>
            This order is currently marked as <strong>{order.orderStatus}</strong>.
            Payment Status: <strong>{order.paymentStatus}</strong>.
          </span>
        </div>
      )}

      {/* Detailed Activity Log */}
      <div className="space-y-2.5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#555555]">
          Shipment Activity History
        </p>
        <div className="space-y-2">
          {order.timeline.map((ev, idx) => (
            <div
              key={idx}
              className="bg-white p-3 rounded-lg border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
            >
              <div>
                <span className="font-bold text-[#111111]">{ev.status}</span>
                <span className="text-[#555555] ml-2">— {ev.note}</span>
              </div>
              <span className="font-mono text-[11px] text-[#777777]">
                {new Date(ev.timestamp).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
