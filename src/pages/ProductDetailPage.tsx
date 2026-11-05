import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  MapPin,
  Minus,
  Plus,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Undo2,
  X,
  ZoomIn,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard, ProductImage } from '../components/ProductCard';
import {
  estimateDeliveryByPin,
  formatINR,
  PinDeliveryEstimate,
} from '../utils/ecommerceLogic';

export const ProductDetailPage: React.FC = () => {
  const {
    products,
    selectedProductId,
    navigateTo,
    addToCart,
    wishlistIds,
    toggleWishlist,
    reviews,
    user,
    token,
    refreshCatalog,
    showToast,
  } = useStore();

  const product =
    products.find((p) => p.id === selectedProductId || p.slug === selectedProductId) ||
    products[0];

  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<number>(9);
  const [quantity, setQuantity] = useState<number>(1);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState<boolean>(false);

  const [pinCode, setPinCode] = useState<string>('400001');
  const [pinResult, setPinResult] = useState<PinDeliveryEstimate | null>(() =>
    estimateDeliveryByPin('400001')
  );

  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  useEffect(() => {
    if (product) {
      setActiveImage(product.images[0]);
      setSelectedColor(product.colors[0]?.name || 'Standard');
      const firstAvailable =
        product.sizes.find((s) => s.size === 9 && s.stock > 0)?.size ||
        product.sizes.find((s) => s.stock > 0)?.size ||
        8;
      setSelectedSize(firstAvailable);
      setQuantity(1);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-[#777777]">Loading product details...</p>
      </div>
    );
  }

  const isWishlisted = wishlistIds.includes(product.id);
  const selectedSizeRecord = product.sizes.find((s) => s.size === selectedSize);
  const selectedSizeStock = selectedSizeRecord ? selectedSizeRecord.stock : 0;

  const productReviews = reviews.filter(
    (r) => r.productId === product.id && r.isApproved
  );

  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 3);

  const handleColorSelect = (colorName: string, colorImage: string) => {
    setSelectedColor(colorName);
    if (colorImage) {
      setActiveImage(colorImage);
    }
  };

  const handlePinCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setPinResult(estimateDeliveryByPin(pinCode));
  };

  const handleBuyNow = () => {
    if (selectedSizeStock <= 0) {
      showToast('Selected UK size is currently out of stock.', 'error');
      return;
    }
    addToCart(product, selectedSize, selectedColor, quantity, false);
    navigateTo('checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) {
      showToast('Please sign in to submit a verified customer review.', 'info');
      navigateTo('auth');
      return;
    }
    if (!reviewComment.trim()) {
      showToast('Please enter your review comment.', 'error');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setReviewComment('');
        await refreshCatalog();
        showToast('Thank you! Your review has been published.', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Could not post review.', 'error');
      }
    } catch {
      showToast('Error submitting review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const allThumbnails = Array.from(
    new Set([
      ...product.images,
      ...product.colors.map((c) => c.image).filter(Boolean),
    ])
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4 text-xs text-[#777777]">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="hover:text-[#111111]"
          >
            Home
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() =>
              navigateTo('catalog', {
                category: product.category,
                gender: 'All',
                search: '',
              })
            }
            className="hover:text-[#111111]"
          >
            {product.category}
          </button>
          <span>/</span>
          <span className="text-[#111111] font-semibold">{product.name}</span>
        </div>

        <button
          type="button"
          onClick={() => navigateTo('catalog')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#111111] hover:text-[#FF5A1F]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </button>
      </div>

      {/* Contiguous Purchase Module (Sticky Gallery Left, Purchase Controls Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Gallery Column */}
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-20">
          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-white border border-black/[0.08]">
            <ProductImage
              src={activeImage || product.images[0]}
              alt={`${product.name} - ${selectedColor}`}
              className={`w-full h-full object-cover object-center transition-transform duration-300 ${
                isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
            />
            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              aria-label="Toggle product image zoom"
              className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/90 hover:bg-white text-[#111111] text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>{isZoomed ? 'Reset Zoom' : 'Zoom Image'}</span>
            </button>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {allThumbnails.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(imgUrl)}
                aria-label={`View image thumbnail ${idx + 1}`}
                className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                  activeImage === imgUrl
                    ? 'border-[#FF5A1F] scale-105'
                    : 'border-black/10 opacity-75 hover:opacity-100'
                }`}
              >
                <ProductImage
                  src={imgUrl}
                  alt={`${product.name} view ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Purchase Module */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.08] space-y-6">
          {/* Header & Unboxed Metadata */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-[#777777]">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold uppercase tracking-wider text-[#FF5A1F]">
                  {product.brand}
                </span>
                <span aria-hidden="true">·</span>
                <span>{product.category}</span>
                <span aria-hidden="true">·</span>
                <span>{product.gender}</span>
              </div>
              {product.isDemoData && (
                <span className="text-[11px] text-[#777777]">Demo Inventory</span>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase text-[#111111]">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-[#111111] font-mono font-bold">
                <Star className="w-4 h-4 fill-[#FF5A1F] text-[#FF5A1F]" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
              <span aria-hidden="true" className="text-[#777777]">
                ·
              </span>
              <span className="text-[#555555]">
                {product.numReviews} Verified Customer Reviews
              </span>
            </div>
          </div>

          {/* Pricing Block */}
          <div className="py-4 border-y border-black/[0.07] flex items-baseline justify-between">
            <div className="space-y-1 font-mono tabular-nums">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-[#111111]">
                  {formatINR(product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-sm text-[#777777] line-through">
                    {formatINR(product.originalPrice)}
                  </span>
                )}
                {product.discount > 0 && (
                  <span className="text-xs font-bold text-[#FF5A1F]">
                    Save {product.discount}%
                  </span>
                )}
              </div>
              <p className="text-[11px] font-sans text-[#777777]">
                Inclusive of all packaging taxes · Free shipping above ₹1,999
              </p>
            </div>
          </div>

          <p className="text-sm text-[#222222] leading-relaxed">{product.description}</p>

          {/* Colorway Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-[#555555]">
                Selected Colorway:
              </span>
              <span className="font-semibold text-[#111111]">{selectedColor}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((clr) => (
                <button
                  key={clr.name}
                  type="button"
                  onClick={() => handleColorSelect(clr.name, clr.image)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    selectedColor === clr.name
                      ? 'border-[#111111] bg-[#111111] text-white'
                      : 'border-black/15 bg-white text-[#111111] hover:border-[#111111]'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/30"
                    style={{ backgroundColor: clr.hex }}
                  />
                  <span>{clr.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* UK Shoe Size Selection (6 to 12) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-[#555555]">
                Select UK Size:{' '}
                <strong className="text-[#111111] font-mono">UK {selectedSize}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-xs font-semibold text-[#FF5A1F] hover:underline flex items-center gap-1"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Size Guide</span>
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {product.sizes.map((slot) => {
                const isOut = slot.stock <= 0;
                const isSelected = selectedSize === slot.size;
                return (
                  <button
                    key={slot.size}
                    type="button"
                    disabled={isOut}
                    onClick={() => setSelectedSize(slot.size)}
                    aria-label={`Select size UK ${slot.size}${
                      isOut ? ' (Out of stock)' : ''
                    }`}
                    className={`py-2.5 rounded-xl font-mono text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                      isOut
                        ? 'bg-[#F5F5F5] text-neutral-400 border-black/5 line-through cursor-not-allowed'
                        : isSelected
                        ? 'bg-[#FF5A1F] text-white border-[#FF5A1F] shadow-xs'
                        : 'bg-white text-[#111111] border-black/15 hover:border-[#111111]'
                    }`}
                  >
                    <span>UK {slot.size}</span>
                    <span className="text-[9px] font-normal opacity-80">
                      {isOut ? 'Sold Out' : `${slot.stock} left`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Purchase Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-black/15 rounded-xl bg-[#F5F5F5]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="p-3 text-[#111111] hover:bg-black/5"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 font-mono text-sm font-bold text-[#111111]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(Math.max(1, selectedSizeStock), q + 1))
                  }
                  aria-label="Increase quantity"
                  className="p-3 text-[#111111] hover:bg-black/5"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={selectedSizeStock <= 0}
                onClick={() =>
                  addToCart(product, selectedSize, selectedColor, quantity, true)
                }
                className="flex-1 py-3.5 px-6 bg-[#111111] hover:bg-[#FF5A1F] disabled:bg-neutral-300 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {selectedSizeStock > 0 ? 'Add to Cart' : 'Size Out of Stock'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                className={`p-3.5 rounded-xl border transition-colors ${
                  isWishlisted
                    ? 'bg-[#FF5A1F] text-white border-[#FF5A1F]'
                    : 'bg-white text-[#111111] border-black/15 hover:border-[#111111]'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <button
              type="button"
              disabled={selectedSizeStock <= 0}
              onClick={handleBuyNow}
              className="w-full py-3.5 px-6 bg-[#FF5A1F] hover:bg-[#e04812] disabled:bg-neutral-300 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
            >
              Buy Now — Express Checkout
            </button>
          </div>

          {/* PIN Code Delivery Availability Checker */}
          <div className="pt-4 border-t border-black/[0.08] space-y-3">
            <label
              htmlFor="pincode-input"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#111111]"
            >
              <MapPin className="w-4 h-4 text-[#FF5A1F]" />
              <span>Check Delivery & COD by PIN Code</span>
            </label>

            <form onSubmit={handlePinCheck} className="flex gap-2">
              <input
                id="pincode-input"
                type="text"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="Enter 6-digit PIN (e.g. 400001)"
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-mono text-[#111111] focus:outline-none focus:border-[#111111]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Check
              </button>
            </form>

            {pinResult && (
              <div
                className={`p-3 rounded-lg text-xs ${
                  pinResult.valid
                    ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                    : 'bg-red-50 text-red-900 border border-red-200'
                }`}
              >
                {pinResult.valid ? (
                  <div className="space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{pinResult.estimatedDateText} ({pinResult.estimatedDays})</span>
                    </p>
                    <p className="text-[11px] opacity-85">{pinResult.message}</p>
                  </div>
                ) : (
                  <p>{pinResult.message}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-[#555555]">
              <div className="flex items-center gap-2">
                <Undo2 className="w-4 h-4 text-[#111111] shrink-0" />
                <span>7-Day Free Size Exchange & Return</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#111111] shrink-0" />
                <span>6-Month Sole & Stitch Warranty</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications & Customer Reviews Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Specifications */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.08] space-y-4">
          <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
            Product Specifications
          </h2>
          <dl className="divide-y divide-black/[0.06] text-xs">
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#777777]">Upper Material</dt>
              <dd className="font-semibold text-[#111111] text-right">
                {product.specifications?.upperMaterial ||
                  'Engineered Breathable Technical Mesh & Leather'}
              </dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#777777]">Midsole & Outsole</dt>
              <dd className="font-semibold text-[#111111] text-right">
                {product.specifications?.soleMaterial ||
                  'AeroFoam EVA + High-Abrasion Carbon Rubber'}
              </dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#777777]">Closure System</dt>
              <dd className="font-semibold text-[#111111] text-right">
                {product.specifications?.closure || 'Precision Flat-Lock Lacing'}
              </dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#777777]">Cushioning Profile</dt>
              <dd className="font-semibold text-[#111111] text-right">
                {product.specifications?.cushioning || 'Responsive Dual-Density Impact Core'}
              </dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#777777]">Shoe Weight</dt>
              <dd className="font-mono font-semibold text-[#111111] text-right">
                {product.specifications?.weight || '265g (UK 8)'}
              </dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#777777]">Warranty</dt>
              <dd className="font-semibold text-[#111111] text-right">
                {product.specifications?.warranty || '6 Months Manufacturing Warranty'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Verified Customer Reviews & Write Review Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.08] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold uppercase text-[#111111]">
                Customer Reviews ({productReviews.length})
              </h2>
              <p className="text-xs text-[#777777]">
                Rated {product.rating.toFixed(1)} out of 5.0 by verified STEPZONE buyers
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {productReviews.length === 0 ? (
              <p className="text-xs text-[#777777] py-4">
                No written reviews for this specific silhouette yet. Be the first to review!
              </p>
            ) : (
              productReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl bg-[#F5F5F5] border border-black/[0.05] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#111111]">
                        {rev.userName}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        · Verified Purchase
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 text-[#FF5A1F]">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#222222] leading-relaxed">{rev.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Submit a Review Form */}
          <form
            onSubmit={handleReviewSubmit}
            className="pt-4 border-t border-black/10 space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Write a Customer Review
            </h3>
            <div className="flex items-center gap-3">
              <label htmlFor="review-rating-select" className="text-xs text-[#555555]">
                Rating:
              </label>
              <select
                id="review-rating-select"
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-mono font-semibold"
              >
                <option value={5}>5 Stars — Exceptional</option>
                <option value={4}>4 Stars — Very Good</option>
                <option value={3}>3 Stars — Good</option>
                <option value={2}>2 Stars — Fair</option>
                <option value={1}>1 Star — Poor</option>
              </select>
            </div>
            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share how this shoe fits and performs on road, gym, or street..."
              aria-label="Review comment"
              className="w-full p-3 rounded-xl bg-[#F5F5F5] border border-black/15 text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
            />
            <button
              type="submit"
              disabled={isSubmittingReview}
              className="px-5 py-2.5 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {isSubmittingReview ? 'Submitting...' : 'Submit Verified Review'}
            </button>
          </form>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <h2 className="font-display text-3xl font-bold uppercase text-[#111111]">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}

      {/* UK Shoe Size Guide Modal */}
      {isSizeGuideOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="STEPZONE Shoe Size Guide"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="font-display text-2xl font-bold uppercase text-[#111111]">
                  STEPZONE UK Footwear Size Chart
                </h3>
                <p className="text-xs text-[#777777]">
                  Standard Indian / UK Footwear Sizing Conversion
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                aria-label="Close size guide"
                className="p-1.5 text-[#777777] hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse font-mono tabular-nums">
                <thead>
                  <tr className="bg-[#F5F5F5] text-[#111111] font-sans font-bold">
                    <th className="p-2.5 border border-black/10">UK / India</th>
                    <th className="p-2.5 border border-black/10">US Men</th>
                    <th className="p-2.5 border border-black/10">EU Size</th>
                    <th className="p-2.5 border border-black/10">Foot Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { uk: 6, us: 7, eu: 40, cm: '25.0 cm' },
                    { uk: 7, us: 8, eu: 41, cm: '25.8 cm' },
                    { uk: 8, us: 9, eu: 42, cm: '26.6 cm' },
                    { uk: 9, us: 10, eu: 43, cm: '27.5 cm' },
                    { uk: 10, us: 11, eu: 44.5, cm: '28.3 cm' },
                    { uk: 11, us: 12, eu: 46, cm: '29.2 cm' },
                    { uk: 12, us: 13, eu: 47, cm: '30.0 cm' },
                  ].map((row) => (
                    <tr key={row.uk} className="hover:bg-[#F5F5F5]">
                      <td className="p-2.5 border border-black/10 font-bold">
                        UK {row.uk}
                      </td>
                      <td className="p-2.5 border border-black/10">US {row.us}</td>
                      <td className="p-2.5 border border-black/10">EU {row.eu}</td>
                      <td className="p-2.5 border border-black/10">{row.cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-[#555555]">
              Fit Tip: If you are between two sizes or prefer extra toe-box room for long
              marathon runs, we recommend ordering one UK size up.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
