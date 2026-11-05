import React, { useEffect, useMemo, useState } from 'react';
import { Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { filterAndSortProducts, formatINR } from '../utils/ecommerceLogic';
import type { ProductFilterState } from '../types';

export const CatalogPage: React.FC = () => {
  const {
    products,
    categories,
    catalogCategoryFilter,
    catalogGenderFilter,
    catalogSearchQuery,
  } = useStore();

  const [filters, setFilters] = useState<ProductFilterState>({
    search: catalogSearchQuery || '',
    category: catalogCategoryFilter || 'All',
    gender: catalogGenderFilter || 'All',
    brand: 'All',
    size: null,
    color: 'All',
    minPrice: 0,
    maxPrice: 6500,
    minDiscount: 0,
    minRating: 0,
    inStockOnly: false,
    sortBy: 'recommended',
  });

  const [visibleCount, setVisibleCount] = useState<number>(9);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: catalogCategoryFilter || 'All',
      gender: catalogGenderFilter || 'All',
      search: catalogSearchQuery || '',
    }));
    setVisibleCount(9);
  }, [catalogCategoryFilter, catalogGenderFilter, catalogSearchQuery]);

  const brands = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.brand)))],
    [products]
  );

  const colorOptions = ['All', 'Orange', 'White', 'Black', 'Blue', 'Stone', 'Espresso'];

  const filteredProducts = useMemo(
    () => filterAndSortProducts(products, filters),
    [products, filters]
  );

  const displayedProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  const resetAllFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      gender: 'All',
      brand: 'All',
      size: null,
      color: 'All',
      minPrice: 0,
      maxPrice: 6500,
      minDiscount: 0,
      minRating: 0,
      inStockOnly: false,
      sortBy: 'recommended',
    });
    setVisibleCount(9);
  };

  const FilterPanelContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-black/10 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#111111]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#111111]">
            Filters
          </h2>
        </div>
        <button
          type="button"
          onClick={resetAllFilters}
          className="text-xs font-medium text-[#FF5A1F] hover:underline flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Category Filter */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#555555] mb-2.5">
          Category
        </h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, category: 'All' }))}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filters.category === 'All'
                ? 'bg-[#111111] text-white font-semibold'
                : 'text-[#222222] hover:bg-black/5'
            }`}
          >
            All Footwear ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, category: cat.name }))}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                filters.category === cat.name
                  ? 'bg-[#111111] text-white font-semibold'
                  : 'text-[#222222] hover:bg-black/5'
              }`}
            >
              <span>{cat.name}</span>
              <span className="font-mono text-[11px] opacity-70">{cat.productCount ?? ''}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Gender Filter */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#555555] mb-2.5">
          Gender
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {['All', 'Men', 'Women', 'Unisex'].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, gender: g }))}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                filters.gender === g
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white text-[#222222] border-black/10 hover:border-black/30'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* UK Shoe Size Filter */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#555555] mb-2.5">
          UK Shoe Size
        </h3>
        <div className="grid grid-cols-4 gap-1.5">
          {[6, 7, 8, 9, 10, 11, 12].map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() =>
                setFilters((f) => ({ ...f, size: f.size === sz ? null : sz }))
              }
              className={`py-2 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                filters.size === sz
                  ? 'bg-[#FF5A1F] text-white border-[#FF5A1F]'
                  : 'bg-white text-[#111111] border-black/15 hover:border-[#111111]'
              }`}
            >
              UK {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Filter */}
      <div>
        <label
          htmlFor="brand-filter-select"
          className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-2"
        >
          Brand Division
        </label>
        <select
          id="brand-filter-select"
          value={filters.brand}
          onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-medium text-[#111111]"
        >
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Colorway Filter */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#555555] mb-2">
          Colorway
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {colorOptions.map((clr) => (
            <button
              key={clr}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, color: clr }))}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                filters.color === clr
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white text-[#222222] border-black/10 hover:border-black/30'
              }`}
            >
              {clr}
            </button>
          ))}
        </div>
      </div>

      {/* Maximum Price Filter */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold uppercase tracking-wider text-[#555555]">
            Max Price
          </span>
          <span className="font-mono font-bold text-[#111111]">
            Up to {formatINR(filters.maxPrice)}
          </span>
        </div>
        <input
          type="range"
          min={1299}
          max={6500}
          step={100}
          aria-label="Maximum price filter"
          value={filters.maxPrice}
          onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))}
          className="w-full accent-[#FF5A1F]"
        />
        <div className="flex justify-between text-[11px] font-mono text-[#777777] mt-1">
          <span>₹1,299</span>
          <span>₹6,500</span>
        </div>
      </div>

      {/* Minimum Discount & Rating */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label
            htmlFor="discount-select"
            className="block text-[11px] font-bold uppercase tracking-wider text-[#555555] mb-1"
          >
            Min Discount
          </label>
          <select
            id="discount-select"
            value={filters.minDiscount}
            onChange={(e) =>
              setFilters((f) => ({ ...f, minDiscount: Number(e.target.value) }))
            }
            className="w-full px-2.5 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-mono"
          >
            <option value={0}>Any</option>
            <option value={20}>20% or more</option>
            <option value={25}>25% or more</option>
            <option value={28}>28% or more</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="rating-select"
            className="block text-[11px] font-bold uppercase tracking-wider text-[#555555] mb-1"
          >
            Customer Rating
          </label>
          <select
            id="rating-select"
            value={filters.minRating}
            onChange={(e) =>
              setFilters((f) => ({ ...f, minRating: Number(e.target.value) }))
            }
            className="w-full px-2.5 py-2 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-mono"
          >
            <option value={0}>All Ratings</option>
            <option value={4.5}>4.5★ & above</option>
            <option value={4.8}>4.8★ & above</option>
          </select>
        </div>
      </div>

      {/* Availability Filter */}
      <label className="flex items-center gap-2.5 text-xs font-medium text-[#111111] cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={filters.inStockOnly}
          onChange={(e) => setFilters((f) => ({ ...f, inStockOnly: e.target.checked }))}
          className="w-4 h-4 accent-[#FF5A1F] rounded"
        />
        <span>Exclude Out of Stock Items</span>
      </label>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header & Search + Sort Toolbar */}
      <div className="bg-white rounded-2xl p-6 border border-black/[0.08] mb-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5A1F]">
              STEPZONE Official Catalog · Demonstration Inventory
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase text-[#111111] mt-1">
              {filters.category === 'All' ? 'All Footwear Collection' : filters.category}
              {filters.gender !== 'All' ? ` — ${filters.gender}` : ''}
            </h1>
          </div>

          <p className="text-xs font-mono text-[#555555]">
            Showing <strong className="text-[#111111]">{displayedProducts.length}</strong> of{' '}
            <strong className="text-[#111111]">{filteredProducts.length}</strong> matching styles
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-black/[0.06]">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Filter catalog by keyword"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search by shoe name, brand, category, or color..."
              className="w-full pl-10 pr-8 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/10 text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, search: '' }))}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#111111]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden px-4 py-2.5 bg-[#111111] text-white text-xs font-semibold rounded-lg flex items-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <div className="flex items-center gap-2">
              <label
                htmlFor="catalog-sort-select"
                className="text-xs font-semibold text-[#555555] whitespace-nowrap"
              >
                Sort By:
              </label>
              <select
                id="catalog-sort-select"
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, sortBy: e.target.value as any }))
                }
                className="px-3 py-2.5 rounded-lg bg-[#F5F5F5] border border-black/15 text-xs font-semibold text-[#111111]"
              >
                <option value="recommended">Recommended</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="best_selling">Best Selling</option>
                <option value="top_rated">Top Rated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog Grid + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-3 bg-white rounded-2xl p-6 border border-black/[0.08] sticky top-20">
          {FilterPanelContent}
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-9">
          {displayedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-black/[0.08] space-y-4">
              <p className="font-display text-2xl font-bold uppercase text-[#111111]">
                No Footwear Matches Your Current Filters
              </p>
              <p className="text-xs text-[#777777] max-w-md mx-auto">
                Try clearing your size, price range, or search query to view our complete
                20-product STEPZONE footwear collection.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-6 py-2.5 bg-[#FF5A1F] text-white text-xs font-semibold rounded-lg"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {visibleCount < filteredProducts.length && (
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                    className="px-8 py-3.5 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors"
                  >
                    Load More Footwear ({filteredProducts.length - visibleCount} Remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end lg:hidden"
        >
          <div className="bg-white w-full max-w-xs h-full p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  aria-label="Close mobile filters"
                  className="p-1.5 text-[#777777] hover:text-[#111111]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {FilterPanelContent}
            </div>
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(false)}
              className="mt-6 w-full py-3 bg-[#111111] text-white text-xs font-semibold rounded-lg"
            >
              Apply Filters ({filteredProducts.length} results)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
