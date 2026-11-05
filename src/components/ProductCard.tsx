import React, { useState } from 'react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import type { Product } from '../types';
import { formatINR } from '../utils/ecommerceLogic';
import { useStore } from '../context/StoreContext';

export const ProductImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = '' }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#EAEAEA] to-[#DCDCDC] text-[#222222] p-6 select-none ${className}`}
      >
        <ShoppingBag className="w-8 h-8 text-[#777777] mb-2 stroke-[1.5]" />
        <span className="text-xs font-medium text-[#555555] text-center line-clamp-1">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { navigateTo, addToCart, wishlistIds, toggleWishlist } = useStore();
  const isWishlisted = wishlistIds.includes(product.id);
  const availableSizes = product.sizes.filter((s) => s.stock > 0).map((s) => s.size);
  const [selectedQuickSize, setSelectedQuickSize] = useState<number>(
    availableSizes.includes(9) ? 9 : availableSizes[0] || 8
  );

  // Maximum 1 subtle text tag on the image (never pill badge clusters)
  const singleBadge = product.isNewArrival
    ? 'New Arrival'
    : product.isBestSeller
    ? 'Best Seller'
    : null;

  return (
    <article className="group bg-white rounded-xl border border-black/[0.07] overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Product Image Stage (65-75% visual weight) */}
      <div className="relative aspect-[4/3] w-full bg-[#ECECEC] overflow-hidden">
        <button
          type="button"
          onClick={() => navigateTo('product', { productId: product.id })}
          className="w-full h-full block text-left focus:outline-none"
          aria-label={`View details for ${product.name}`}
        >
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        </button>

        {singleBadge && (
          <span className="absolute top-3 left-3 bg-[#111111]/90 text-white text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded">
            {singleBadge}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            isWishlisted
              ? 'bg-[#FF5A1F] text-white'
              : 'bg-white/90 text-[#111111] hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Clean Unboxed Metadata & Content */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Unboxed inline metadata with typographic separators */}
          <div className="flex items-center justify-between gap-2 text-xs text-[#777777] mb-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-medium uppercase tracking-wider text-[#555555]">
                {product.brand}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{product.category}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-[#222222] font-mono tabular-nums">
              <Star className="w-3.5 h-3.5 fill-[#FF5A1F] text-[#FF5A1F]" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('product', { productId: product.id })}
            className="text-left block w-full group-hover:text-[#FF5A1F] transition-colors"
          >
            <h3 className="text-base font-semibold text-[#111111] line-clamp-1">
              {product.name}
            </h3>
          </button>

          {/* Available UK sizes inline summary */}
          <p className="text-xs text-[#777777] mt-1 font-mono tabular-nums">
            UK Sizes: {availableSizes.length > 0 ? availableSizes.join(', ') : 'Out of Stock'}
          </p>
        </div>

        {/* Price Baseline & Quick Add */}
        <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between gap-2">
          <div className="font-mono tabular-nums">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-[#111111]">
                {formatINR(product.price)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-[#777777] line-through">
                  {formatINR(product.originalPrice)}
                </span>
              )}
            </div>
            {product.discount > 0 && (
              <span className="text-[11px] font-semibold text-[#FF5A1F]">
                {product.discount}% OFF
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <select
              aria-label={`Select UK size for ${product.name}`}
              value={selectedQuickSize}
              onChange={(e) => setSelectedQuickSize(Number(e.target.value))}
              className="text-xs font-mono bg-[#F5F5F5] border border-black/10 rounded-lg px-2 py-2 text-[#111111] focus:outline-none focus:border-[#111111]"
            >
              {availableSizes.map((sz) => (
                <option key={sz} value={sz}>
                  UK {sz}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={availableSizes.length === 0}
              onClick={() =>
                addToCart(
                  product,
                  selectedQuickSize,
                  product.colors[0]?.name || 'Standard',
                  1,
                  true
                )
              }
              className="px-3 py-2 text-xs font-semibold text-white bg-[#111111] hover:bg-[#FF5A1F] disabled:bg-neutral-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Quick Add</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
