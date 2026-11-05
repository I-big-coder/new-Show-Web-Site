import React, { useState } from 'react';
import {
  ArrowRight,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard, ProductImage } from '../components/ProductCard';
import { formatINR } from '../utils/ecommerceLogic';

export const CartPage: React.FC<{ mode?: 'cart' | 'wishlist' }> = ({
  mode = 'cart',
}) => {
  const {
    cart,
    cartTotals,
    updateCartQuantity,
    removeFromCart,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    coupons,
    products,
    wishlistIds,
    toggleWishlist,
    moveWishlistToCart,
    navigateTo,
  } = useStore();

  const [couponInput, setCouponInput] = useState<string>('');

  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));

  if (mode === 'wishlist') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5A1F]">
              Saved Silhouettes
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase text-[#111111] mt-1">
              My Wishlist ({wishlistedProducts.length})
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('catalog')}
            className="text-xs font-semibold text-[#111111] hover:text-[#FF5A1F]"
          >
            Continue Shopping →
          </button>
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-14 text-center border border-black/[0.08] space-y-4">
            <Heart className="w-12 h-12 text-[#777777] mx-auto stroke-[1.25]" />
            <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
              Your Wishlist Is Empty
            </h2>
            <p className="text-xs text-[#777777] max-w-md mx-auto">
              Tap the heart icon on any sneaker or runner to save your favorite styles for
              later.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('catalog')}
              className="px-6 py-3 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Browse Footwear
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistedProducts.map((product) => (
              <div key={product.id} className="space-y-2">
                <ProductCard product={product} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => moveWishlistToCart(product)}
                    className="flex-1 py-2.5 bg-[#FF5A1F] hover:bg-[#e04812] text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Move to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    className="px-3 py-2.5 border border-black/15 bg-white hover:bg-black/5 text-xs font-medium rounded-lg"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5A1F]">
            STEPZONE Bag & Coupon Summary
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase text-[#111111] mt-1">
            Shopping Cart ({cart.reduce((s, i) => s + i.quantity, 0)} Items)
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigateTo('catalog')}
          className="text-xs font-semibold text-[#111111] hover:text-[#FF5A1F]"
        >
          ← Continue Shopping
        </button>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-black/[0.08] space-y-4">
          <ShoppingBag className="w-12 h-12 text-[#777777] mx-auto stroke-[1.25]" />
          <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
            Your Shopping Cart Is Empty
          </h2>
          <p className="text-xs text-[#777777] max-w-md mx-auto">
            Add performance running shoes, street sneakers, or formal Oxfords to your bag to
            proceed to checkout.
          </p>
          <button
            type="button"
            onClick={() => navigateTo('catalog')}
            className="px-7 py-3 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Shop Footwear Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-black/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
              >
                <div className="flex items-center gap-4">
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 rounded-xl object-cover bg-[#ECECEC] shrink-0"
                  />
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
                      {item.brand}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigateTo('product', { productId: item.productId })}
                      className="block text-base font-bold text-[#111111] hover:text-[#FF5A1F] text-left"
                    >
                      {item.name}
                    </button>
                    <p className="text-xs text-[#555555] font-mono">
                      Size: UK {item.size} · Color: {item.color}
                    </p>
                    <div className="flex items-baseline gap-2 font-mono text-xs pt-1">
                      <span className="font-bold text-[#111111]">
                        {formatINR(item.price)}
                      </span>
                      {item.originalPrice > item.price && (
                        <span className="text-[#777777] line-through">
                          {formatINR(item.originalPrice)}
                        </span>
                      )}
                      {item.discount > 0 && (
                        <span className="text-[#FF5A1F] font-semibold">
                          ({item.discount}% OFF)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-black/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-black/15 rounded-lg bg-[#F5F5F5]">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        aria-label={`Decrease quantity of ${item.name}`}
                        className="p-2 text-[#111111] hover:bg-black/5"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-mono font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        aria-label={`Increase quantity of ${item.name}`}
                        className="p-2 text-[#111111] hover:bg-black/5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.name} from cart`}
                      className="p-2 text-[#777777] hover:text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="font-mono text-base font-bold text-[#111111]">
                    Subtotal: {formatINR(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary & Coupon Panel */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-black/[0.08] space-y-6 sticky top-20">
            <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
              Order Summary
            </h2>

            {/* Coupon Code Input */}
            <div className="space-y-2.5">
              <label
                htmlFor="cart-coupon-input"
                className="text-xs font-bold uppercase tracking-wider text-[#555555] flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5 text-[#FF5A1F]" />
                <span>Apply Promo / Coupon Code</span>
              </label>

              {appliedCoupon ? (
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <div>
                    <span className="font-mono font-bold text-emerald-900">
                      {appliedCoupon.code}
                    </span>
                    <span className="text-emerald-700 ml-1.5">
                      (-{formatINR(cartTotals.couponDiscount)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    aria-label="Remove coupon"
                    className="text-emerald-800 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyCouponCode(couponInput);
                  }}
                  className="flex gap-2"
                >
                  <input
                    id="cart-coupon-input"
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g. STEP10)"
                    className="flex-1 px-3 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-mono uppercase text-[#111111]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </form>
              )}

              {/* Quick Available Coupons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {coupons
                  .filter((c) => c.isActive)
                  .map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCouponInput(c.code);
                        applyCouponCode(c.code);
                      }}
                      className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#F5F5F5] hover:bg-[#111111] hover:text-white text-[#222222] border border-black/10 transition-colors"
                    >
                      {c.code}
                    </button>
                  ))}
              </div>
            </div>

            {/* Itemized Price Breakdown */}
            <div className="space-y-2.5 text-xs pt-4 border-t border-black/10 font-mono tabular-nums">
              <div className="flex justify-between text-[#555555]">
                <span className="font-sans">MRP Total</span>
                <span>{formatINR(cartTotals.originalSubtotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span className="font-sans">Product Discount</span>
                <span>-{formatINR(cartTotals.productSavings)}</span>
              </div>
              <div className="flex justify-between text-[#111111] font-semibold">
                <span className="font-sans">Cart Subtotal</span>
                <span>{formatINR(cartTotals.subtotal)}</span>
              </div>
              {cartTotals.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span className="font-sans">
                    Coupon Discount ({appliedCoupon?.code})
                  </span>
                  <span>-{formatINR(cartTotals.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#555555]">
                <span className="font-sans">Shipping Charges</span>
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
                <span className="font-sans">Final Total</span>
                <span>{formatINR(cartTotals.totalAmount)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigateTo('checkout')}
              className="w-full py-3.5 px-6 bg-[#FF5A1F] hover:bg-[#e04812] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
