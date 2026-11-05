import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Star, Truck, Undo2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard, ProductImage } from '../components/ProductCard';
import { filterAndSortProducts, formatINR } from '../utils/ecommerceLogic';

const HERO_IMG = '/src/assets/images/hero_sneaker_banner_1793887766132.jpg';

export const HomePage: React.FC = () => {
  const { products, categories, reviews, navigateTo, showToast } = useStore();

  const [bestSellerSort, setBestSellerSort] = useState<
    'popularity' | 'price_asc' | 'price_desc' | 'newest'
  >('popularity');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  const featuredProducts = useMemo(
    () => products.filter((p) => p.isFeatured).slice(0, 6),
    [products]
  );

  const sortedBestSellers = useMemo(() => {
    const base = products.filter((p) => p.isBestSeller || p.rating >= 4.7);
    return filterAndSortProducts(base, { sortBy: bestSellerSort }).slice(0, 6);
  }, [products, bestSellerSort]);

  const showcaseCategories = useMemo(() => categories.slice(0, 6), [categories]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newsletterEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setNewsletterStatus({
        type: 'error',
        message: 'Please enter a valid email address (e.g. you@example.com).',
      });
      return;
    }
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNewsletterStatus({
          type: 'error',
          message: data.error || 'Subscription failed.',
        });
        return;
      }
      setNewsletterStatus({
        type: 'success',
        message: data.message,
      });
      setNewsletterEmail('');
      showToast('Subscribed! Use code STEP10 for 10% OFF.', 'success');
    } catch {
      setNewsletterStatus({
        type: 'error',
        message: 'Unable to subscribe right now. Please try again.',
      });
    }
  };

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Split Architectural Hero Section */}
      <section className="bg-[#111111] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Copy Column */}
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF5A1F] font-semibold">
                <span>STEPZONE Flagship Drop</span>
                <span aria-hidden="true">·</span>
                <span>AeroFoam Carbon Series</span>
              </div>

              <h1
                className="font-display font-bold uppercase tracking-tight text-white leading-[0.96]"
                style={{ fontSize: 'clamp(2.5rem, 4.5vw, 4.25rem)', textWrap: 'balance' }}
              >
                FIND YOUR PERFECT STEP.
              </h1>

              <p className="text-base sm:text-lg text-white/75 max-w-xl leading-relaxed">
                Discover footwear that combines comfort, performance, and style. Engineered
                with nitrogen-infused midsoles, breathable monofilament mesh, and
                hand-finished Italian leathers.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    navigateTo('catalog', { gender: 'Men', category: 'All', search: '' })
                  }
                  className="px-7 py-3.5 bg-[#FF5A1F] hover:bg-[#e04812] text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <span>Shop Men</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigateTo('catalog', { gender: 'Women', category: 'All', search: '' })
                  }
                  className="px-7 py-3.5 bg-white hover:bg-neutral-200 text-[#111111] text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  Shop Women
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigateTo('catalog', { category: 'All', gender: 'All', search: '' })
                  }
                  className="px-5 py-3.5 border border-white/25 hover:border-white text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  View All {products.length} Styles
                </button>
              </div>
            </div>

            {/* Right Hero Photography Showcase */}
            <div className="lg:col-span-6 relative">
              <div className="relative h-full min-h-[320px] sm:min-h-[400px] rounded-2xl overflow-hidden border border-white/10 bg-[#1A1A1A]">
                <ProductImage
                  src={HERO_IMG}
                  alt="STEPZONE Arc-Zero Carbon Plate Performance Sneaker"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                  <div className="w-full flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/70">
                        Featured Silhouette · UK 6–12
                      </p>
                      <p className="text-lg font-bold text-white">
                        Elite Performance Runner · {formatINR(4499)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateTo('product', { productId: 'prod-10' })}
                      className="px-4 py-2 bg-white text-[#111111] hover:bg-[#FF5A1F] hover:text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      Inspect Shoe
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width Trust & Fulfilment Strip below Hero Split */}
          <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-white/80">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-[#FF5A1F] shrink-0" />
              <div>
                <p className="font-semibold text-white">Free Express Delivery Above ₹1,999</p>
                <p className="text-white/60">2–3 day air dispatch across 19,000+ Indian PIN codes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Undo2 className="w-5 h-5 text-[#FF5A1F] shrink-0" />
              <div>
                <p className="font-semibold text-white">Easy 7-Day Returns & Size Exchange</p>
                <p className="text-white/60">Complimentary doorstep pickup for size swaps</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#FF5A1F] shrink-0" />
              <div>
                <p className="font-semibold text-white">100% Authentic & 6-Month Warranty</p>
                <p className="text-white/60">Razorpay verified checkout & Cash on Delivery</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shop by Category Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5A1F]">
              Curated Footwear Divisions
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase text-[#111111] mt-1">
              Shop By Category
            </h2>
          </div>
          <button
            type="button"
            onClick={() =>
              navigateTo('catalog', { category: 'All', gender: 'All', search: '' })
            }
            className="text-sm font-semibold text-[#111111] hover:text-[#FF5A1F] flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Browse All 9 Categories</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {showcaseCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                navigateTo('catalog', { category: cat.name, gender: 'All', search: '' })
              }
              className="group relative aspect-[16/10] rounded-xl overflow-hidden bg-[#111111] text-left border border-black/10 focus:outline-none"
            >
              <ProductImage
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-6 flex flex-col justify-end">
                <p className="text-xs text-white/75 line-clamp-1 mb-1">{cat.description}</p>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-2xl font-bold uppercase text-white">
                    {cat.name}
                  </h3>
                  <span className="text-xs font-semibold text-[#FF5A1F] group-hover:translate-x-1 transition-transform flex items-center gap-1 whitespace-nowrap">
                    <span>Explore Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#777777]">
              Season Flagships · UK 6 to UK 12
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase text-[#111111] mt-1">
              Featured Footwear
            </h2>
          </div>
          <button
            type="button"
            onClick={() =>
              navigateTo('catalog', { category: 'All', gender: 'All', search: '' })
            }
            className="px-5 py-2.5 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            View All Products
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. Promotional Performance Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#111111] text-white rounded-2xl overflow-hidden border border-black/10 grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-center space-y-5">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#FF5A1F]">
              STEPZONE Biomechanics Lab
            </span>
            <h2
              className="font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white"
              style={{ textWrap: 'balance' }}
            >
              BUILT FOR EVERY MOVE.
            </h2>
            <p className="text-sm sm:text-base text-white/75 max-w-xl leading-relaxed">
              Discover performance footwear designed to help you move further. Every pair is
              tested across 500+ kilometres of road, track, and gym surfaces for torsional
              stability and impact attenuation.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() =>
                  navigateTo('catalog', {
                    category: 'Running Shoes',
                    gender: 'All',
                    search: '',
                  })
                }
                className="px-7 py-3.5 bg-[#FF5A1F] hover:bg-[#e04812] text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="lg:col-span-5 min-h-[260px] relative bg-[#1C1C1C]">
            <ProductImage
              src="/src/assets/images/sneaker_prosport_training_1793887768991.jpg"
              alt="STEPZONE Kinetic Training Shoe"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* 5. Best Sellers with Live Sorting Controls */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#777777]">
              Most Wanted Silhouettes
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase text-[#111111] mt-1">
              Best Sellers
            </h2>
          </div>

          {/* Interactive Segmented Sort Bar */}
          <div
            role="group"
            aria-label="Sort Best Sellers"
            className="flex flex-wrap items-center gap-1 p-1 bg-black/[0.06] rounded-lg self-start md:self-auto"
          >
            {[
              { id: 'popularity', label: 'Popularity' },
              { id: 'price_asc', label: 'Price: Low to High' },
              { id: 'price_desc', label: 'Price: High to Low' },
              { id: 'newest', label: 'Newest Arrivals' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setBestSellerSort(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  bestSellerSort === tab.id
                    ? 'bg-white text-[#111111] shadow-xs'
                    : 'text-[#555555] hover:text-[#111111]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {sortedBestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. Verified Customer Reviews & Newsletter Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Customer Testimonials */}
        <div>
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5A1F]">
              4.8 / 5.0 Average Rating Across 1,400+ Verified Buyers
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase text-[#111111] mt-1">
              What Runners & Creators Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.slice(0, 4).map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-xl p-6 border border-black/[0.07] flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-[#FF5A1F]">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-[#222222] leading-relaxed">“{rev.comment}”</p>
                </div>

                <div className="pt-4 border-t border-black/[0.06] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#111111] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {rev.userName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#111111] truncate">
                      {rev.userName}
                    </p>
                    <p className="text-[11px] text-[#777777] truncate">
                      Verified Buyer · {rev.productName}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Subscription Box */}
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-black/[0.08] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#FF5A1F]">
              STEPZONE Run Club & Archive Drops
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase text-[#111111]">
              GET 10% OFF YOUR FIRST ORDER.
            </h2>
            <p className="text-sm text-[#555555]">
              Subscribe to our newsletter and receive exclusive offers, early access to
              limited-edition drops, and instant coupon code <strong className="text-[#111111]">STEP10</strong>.
            </p>
          </div>

          <div className="w-full lg:max-w-md">
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="newsletter-email" className="sr-only">
                Email Address
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="flex-1 px-4 py-3 rounded-lg bg-[#F5F5F5] border border-black/15 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>

            {newsletterStatus.type !== 'idle' && (
              <p
                className={`mt-2.5 text-xs flex items-center gap-1.5 ${
                  newsletterStatus.type === 'success' ? 'text-emerald-700 font-medium' : 'text-red-600'
                }`}
              >
                {newsletterStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{newsletterStatus.message}</span>
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
