import React, { useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Lock,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductImage } from '../components/ProductCard';
import { formatINR } from '../utils/ecommerceLogic';
import type { Address, Order } from '../types';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartTotals,
    appliedCoupon,
    user,
    updateUserProfile,
    placeOrder,
    navigateTo,
    showToast,
  } = useStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'COD'>('Razorpay');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Interactive Razorpay Gateway Modal state
  const [razorpayModalData, setRazorpayModalData] = useState<{
    keyId: string;
    orderId: string;
    amount: number;
    handshake: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    };
  } | null>(null);

  const defaultAddr = user?.addresses?.[0];
  const [address, setAddress] = useState<Address>({
    id: defaultAddr?.id || `addr-${Date.now()}`,
    fullName: defaultAddr?.fullName || user?.name || 'Arjun Mehta',
    phone: defaultAddr?.phone || user?.phone || '9876543210',
    email: defaultAddr?.email || user?.email || 'arjun@stepzone.in',
    pinCode: defaultAddr?.pinCode || '560034',
    state: defaultAddr?.state || 'Karnataka',
    city: defaultAddr?.city || 'Bengaluru',
    fullAddress:
      defaultAddr?.fullAddress ||
      '402, Elmwood Residences, 100 Feet Road, Indiranagar',
    landmark: defaultAddr?.landmark || 'Opposite Metro Pillar 48',
    isDefault: true,
  });

  const [addressError, setAddressError] = useState<string>('');

  const validateAddressForm = (): boolean => {
    if (!address.fullName.trim()) {
      setAddressError('Full Name is required.');
      return false;
    }
    if (!/^\d{10}$/.test(address.phone.replace(/\D/g, '').slice(-10))) {
      setAddressError('Please enter a valid 10-digit Indian mobile number.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) {
      setAddressError('Please enter a valid email address.');
      return false;
    }
    if (!/^[1-9][0-9]{5}$/.test(address.pinCode.trim())) {
      setAddressError('Please enter a valid 6-digit Indian PIN code.');
      return false;
    }
    if (!address.state.trim() || !address.city.trim() || !address.fullAddress.trim()) {
      setAddressError('State, City, and Full Street Address are required.');
      return false;
    }
    setAddressError('');
    return true;
  };

  const handleSaveAndContinueToSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddressForm()) return;
    if (user) {
      const existingList = user.addresses || [];
      const alreadySaved = existingList.some(
        (a) => a.fullAddress === address.fullAddress && a.pinCode === address.pinCode
      );
      if (!alreadySaved) {
        await updateUserProfile({
          addresses: [...existingList, { ...address, id: `addr-${Date.now()}` }],
        });
      }
    }
    setStep(2);
  };

  const handleInitiatePayment = async () => {
    if (!validateAddressForm()) {
      setStep(1);
      return;
    }

    setIsProcessing(true);
    try {
      if (paymentMethod === 'COD') {
        const created = await placeOrder({
          shippingAddress: address,
          paymentMethod: 'COD',
        });
        if (created) {
          setConfirmedOrder(created);
        }
        return;
      }

      // Official Razorpay Backend Order Creation
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: cartTotals.totalAmount }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        showToast(orderData.error || 'Could not initialize Razorpay order.', 'error');
        return;
      }

      setRazorpayModalData({
        keyId: orderData.keyId,
        orderId: orderData.orderId,
        amount: orderData.amount,
        handshake: orderData.paymentHandshake,
      });
    } catch {
      showToast('Failed to initialize payment gateway.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteRazorpayPayment = async () => {
    if (!razorpayModalData) return;
    setIsProcessing(true);
    try {
      // Step 1: Verify cryptographic HMAC SHA-256 signature on backend
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(razorpayModalData.handshake),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) {
        showToast(verifyData.error || 'Payment signature verification failed.', 'error');
        return;
      }

      // Step 2: Create verified order on backend
      const created = await placeOrder({
        shippingAddress: address,
        paymentMethod: 'Razorpay',
        paymentDetails: razorpayModalData.handshake,
      });
      setRazorpayModalData(null);
      if (created) {
        setConfirmedOrder(created);
      }
    } catch {
      showToast('Payment verification error.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Order Confirmation Screen
  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl p-8 border border-black/[0.08] space-y-6">
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="w-8 h-8 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest">
                Order Confirmed · Receipt Generated
              </p>
              <h1 className="font-display text-3xl font-bold uppercase text-[#111111]">
                Thank You For Your Order!
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#F5F5F5] text-xs">
            <div>
              <span className="text-[#777777] block">Order Number</span>
              <span className="font-mono font-bold text-[#111111] text-sm">
                {confirmedOrder.orderNumber}
              </span>
            </div>
            <div>
              <span className="text-[#777777] block">Tracking ID</span>
              <span className="font-mono font-bold text-[#FF5A1F] text-sm">
                {confirmedOrder.trackingNumber}
              </span>
            </div>
            <div>
              <span className="text-[#777777] block">Payment Status</span>
              <span className="font-semibold text-[#111111]">
                {confirmedOrder.paymentMethod} — {confirmedOrder.paymentStatus}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#555555]">
              Ordered Footwear ({confirmedOrder.items.length})
            </h2>
            <div className="divide-y divide-black/[0.06] border border-black/10 rounded-xl p-4">
              {confirmedOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-lg object-cover bg-[#ECECEC]"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#111111]">{item.name}</p>
                      <p className="text-xs text-[#777777] font-mono">
                        UK {item.size} · {item.color} · Qty {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#111111]">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F5F5F5] space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="font-sans text-[#555555]">Subtotal</span>
              <span>{formatINR(confirmedOrder.subtotal)}</span>
            </div>
            {confirmedOrder.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span className="font-sans">Coupon Discount</span>
                <span>-{formatINR(confirmedOrder.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-sans text-[#555555]">Shipping</span>
              <span>
                {confirmedOrder.shippingCost === 0
                  ? 'FREE'
                  : formatINR(confirmedOrder.shippingCost)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-[#555555]">GST (12%)</span>
              <span>{formatINR(confirmedOrder.tax)}</span>
            </div>
            <div className="pt-2 border-t border-black/10 flex justify-between text-sm font-bold text-[#111111]">
              <span className="font-sans">Total Amount</span>
              <span>{formatINR(confirmedOrder.totalAmount)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                navigateTo('track-order', { orderId: confirmedOrder.orderNumber })
              }
              className="px-6 py-3 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
            >
              Track Order Status
            </button>
            <button
              type="button"
              onClick={() => navigateTo('catalog')}
              className="px-6 py-3 border border-black/15 hover:border-[#111111] text-xs font-semibold rounded-xl"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <PackageCheck className="w-12 h-12 text-[#777777] mx-auto" />
        <h1 className="font-display text-3xl font-bold uppercase">
          No Items in Bag for Checkout
        </h1>
        <button
          type="button"
          onClick={() => navigateTo('catalog')}
          className="px-6 py-3 bg-[#111111] text-white text-xs font-semibold rounded-lg"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Checkout Header & 3-Step Indicator */}
      <div className="bg-white rounded-2xl p-6 border border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5A1F]">
            256-Bit Encrypted Checkout
          </p>
          <h1 className="font-display text-3xl font-bold uppercase text-[#111111]">
            Complete Your STEPZONE Order
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold overflow-x-auto pb-1 sm:pb-0">
          {[
            { num: 1, label: '1. Address' },
            { num: 2, label: '2. Summary' },
            { num: 3, label: '3. Payment' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num === 1 || validateAddressForm()) {
                  setStep(s.num as 1 | 2 | 3);
                }
              }}
              className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                step === s.num
                  ? 'bg-[#111111] text-white'
                  : 'bg-[#F5F5F5] text-[#555555] hover:text-[#111111]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Interactive Checkout Steps */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: DELIVERY ADDRESS */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.08] space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#FF5A1F]" />
                <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
                  Step 1: Delivery Address
                </h2>
              </div>
              {step !== 1 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-[#FF5A1F] hover:underline"
                >
                  Change Address
                </button>
              )}
            </div>

            {/* Saved Addresses Quick Selector */}
            {user && user.addresses && user.addresses.length > 0 && step === 1 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#777777]">
                  Saved Addresses
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {user.addresses.map((saved) => (
                    <button
                      key={saved.id}
                      type="button"
                      onClick={() => setAddress(saved)}
                      className={`p-3.5 rounded-xl border text-left text-xs transition-all ${
                        address.fullAddress === saved.fullAddress
                          ? 'border-[#111111] bg-[#F5F5F5]'
                          : 'border-black/10 hover:border-black/30'
                      }`}
                    >
                      <p className="font-bold text-[#111111]">{saved.fullName}</p>
                      <p className="text-[#555555] truncate mt-0.5">{saved.fullAddress}</p>
                      <p className="font-mono text-[#777777] mt-0.5">
                        {saved.city}, {saved.state} — {saved.pinCode}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSaveAndContinueToSummary} className="space-y-4">
                {addressError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
                    {addressError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="addr-name"
                      className="block text-xs font-semibold text-[#555555] mb-1"
                    >
                      Full Name *
                    </label>
                    <input
                      id="addr-name"
                      type="text"
                      required
                      value={address.fullName}
                      onChange={(e) =>
                        setAddress({ ...address, fullName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs text-[#111111]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="addr-phone"
                      className="block text-xs font-semibold text-[#555555] mb-1"
                    >
                      Mobile Number *
                    </label>
                    <input
                      id="addr-phone"
                      type="tel"
                      required
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-mono text-[#111111]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="addr-email"
                      className="block text-xs font-semibold text-[#555555] mb-1"
                    >
                      Email Address *
                    </label>
                    <input
                      id="addr-email"
                      type="email"
                      required
                      value={address.email}
                      onChange={(e) => setAddress({ ...address, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs text-[#111111]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="addr-pincode"
                      className="block text-xs font-semibold text-[#555555] mb-1"
                    >
                      PIN Code (6 Digits) *
                    </label>
                    <input
                      id="addr-pincode"
                      type="text"
                      maxLength={6}
                      required
                      value={address.pinCode}
                      onChange={(e) =>
                        setAddress({ ...address, pinCode: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-mono text-[#111111]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="addr-city"
                      className="block text-xs font-semibold text-[#555555] mb-1"
                    >
                      City / District *
                    </label>
                    <input
                      id="addr-city"
                      type="text"
                      required
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs text-[#111111]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="addr-state"
                      className="block text-xs font-semibold text-[#555555] mb-1"
                    >
                      State *
                    </label>
                    <input
                      id="addr-state"
                      type="text"
                      required
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs text-[#111111]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="addr-street"
                    className="block text-xs font-semibold text-[#555555] mb-1"
                  >
                    Full Address (House No., Building, Street, Area) *
                  </label>
                  <input
                    id="addr-street"
                    type="text"
                    required
                    value={address.fullAddress}
                    onChange={(e) =>
                      setAddress({ ...address, fullAddress: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs text-[#111111]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="addr-landmark"
                    className="block text-xs font-semibold text-[#555555] mb-1"
                  >
                    Landmark (Optional)
                  </label>
                  <input
                    id="addr-landmark"
                    type="text"
                    value={address.landmark || ''}
                    onChange={(e) =>
                      setAddress({ ...address, landmark: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs text-[#111111]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                >
                  Save & Continue to Order Summary →
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-[#F5F5F5] text-xs space-y-1">
                <p className="font-bold text-[#111111]">
                  {address.fullName} · {address.phone}
                </p>
                <p className="text-[#555555]">
                  {address.fullAddress}, {address.city}, {address.state} —{' '}
                  <span className="font-mono font-semibold">{address.pinCode}</span>
                </p>
              </div>
            )}
          </div>

          {/* STEP 2: ORDER SUMMARY */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#FF5A1F]" />
                <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
                  Step 2: Order Summary ({cart.reduce((s, i) => s + i.quantity, 0)} Items)
                </h2>
              </div>
            </div>

            <div className="divide-y divide-black/[0.06]">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover bg-[#ECECEC]"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#111111]">{item.name}</p>
                      <p className="text-xs text-[#777777] font-mono">
                        Size: UK {item.size} · Color: {item.color} · Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#111111]">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {step === 2 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                >
                  Continue to Payment Method →
                </button>
              </div>
            )}
          </div>

          {/* STEP 3: PAYMENT METHOD */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.08] space-y-5">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#FF5A1F]" />
              <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
                Step 3: Select Payment Method
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('Razorpay')}
                className={`p-4 rounded-xl border text-left transition-all space-y-1.5 ${
                  paymentMethod === 'Razorpay'
                    ? 'border-[#FF5A1F] bg-[#FFF8F5]'
                    : 'border-black/15 hover:border-[#111111]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#111111]">
                    Razorpay Secure Checkout
                  </span>
                  <ShieldCheck className="w-4 h-4 text-[#FF5A1F]" />
                </div>
                <p className="text-xs text-[#555555]">
                  Pay via UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking.
                  Instant server signature verification.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-xl border text-left transition-all space-y-1.5 ${
                  paymentMethod === 'COD'
                    ? 'border-[#FF5A1F] bg-[#FFF8F5]'
                    : 'border-black/15 hover:border-[#111111]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#111111]">
                    Cash on Delivery (COD)
                  </span>
                  <Truck className="w-4 h-4 text-[#111111]" />
                </div>
                <p className="text-xs text-[#555555]">
                  Pay via Cash or UPI QR when your STEPZONE footwear arrives at your
                  doorstep. No extra COD fee.
                </p>
              </button>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleInitiatePayment}
              className="w-full py-4 px-6 bg-[#FF5A1F] hover:bg-[#e04812] disabled:bg-neutral-400 text-white text-sm font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isProcessing
                  ? 'Processing Order...'
                  : paymentMethod === 'Razorpay'
                  ? `Pay ${formatINR(cartTotals.totalAmount)} via Razorpay`
                  : `Place COD Order (${formatINR(cartTotals.totalAmount)})`}
              </span>
            </button>
          </div>
        </div>

        {/* Right Sticky Summary Column */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-black/[0.08] space-y-4 sticky top-20">
          <h3 className="font-display text-2xl font-bold uppercase text-[#111111]">
            Price Details
          </h3>

          <div className="space-y-2.5 text-xs font-mono tabular-nums pt-2 border-t border-black/10">
            <div className="flex justify-between text-[#555555]">
              <span className="font-sans">Items Subtotal</span>
              <span>{formatINR(cartTotals.subtotal)}</span>
            </div>
            {cartTotals.couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span className="font-sans">Coupon ({appliedCoupon?.code})</span>
                <span>-{formatINR(cartTotals.couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#555555]">
              <span className="font-sans">Shipping Cost</span>
              <span>
                {cartTotals.shippingCost === 0
                  ? 'FREE'
                  : formatINR(cartTotals.shippingCost)}
              </span>
            </div>
            <div className="flex justify-between text-[#555555]">
              <span className="font-sans">GST (12%)</span>
              <span>{formatINR(cartTotals.tax)}</span>
            </div>
            <div className="pt-3 border-t border-black/10 flex justify-between text-base font-bold text-[#111111]">
              <span className="font-sans">Total Payable</span>
              <span>{formatINR(cartTotals.totalAmount)}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5F5F5] text-[11px] text-[#555555] space-y-1">
            <p className="font-semibold text-[#111111]">
              STEPZONE Buyer Protection Guarantee
            </p>
            <p>
              Inventory is locked upon checkout. Every Razorpay payment signature is
              verified server-side using HMAC-SHA256 before order confirmation.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Razorpay Checkout Gateway Modal */}
      {razorpayModalData && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Razorpay Payment Gateway"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white max-w-md w-full rounded-2xl overflow-hidden shadow-2xl border border-black/10">
            <div className="bg-[#111111] text-white p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#FF5A1F] font-semibold">
                  Razorpay Official Order #{razorpayModalData.orderId.slice(-8)}
                </p>
                <h3 className="font-display text-2xl font-bold uppercase">
                  STEPZONE Footwear India
                </h3>
              </div>
              <span className="font-mono text-lg font-bold text-white">
                {formatINR(cartTotals.totalAmount)}
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#F5F5F5] text-xs space-y-1">
                <p className="font-semibold text-[#111111]">
                  Customer: {address.fullName} ({address.phone})
                </p>
                <p className="text-[#777777] font-mono text-[11px]">
                  Order ID: {razorpayModalData.orderId}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#555555]">
                  Select Instant Payment Mode
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-lg border border-[#FF5A1F] bg-[#FFF8F5] font-semibold text-[#111111] flex justify-between">
                    <span>UPI Instant (GPay / PhonePe / Paytm)</span>
                    <span className="text-[#FF5A1F]">Recommended</span>
                  </div>
                  <div className="p-3 rounded-lg border border-black/10 text-[#555555]">
                    Visa / Mastercard / RuPay Credit & Debit Card
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRazorpayModalData(null)}
                  className="px-4 py-3 border border-black/15 rounded-xl text-xs font-semibold text-[#555555]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCompleteRazorpayPayment}
                  className="flex-1 py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                >
                  {isProcessing
                    ? 'Verifying Signature...'
                    : `Authorize & Pay ${formatINR(cartTotals.totalAmount)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
