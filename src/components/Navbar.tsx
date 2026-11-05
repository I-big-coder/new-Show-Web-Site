import React, { useState } from 'react';
import {
  ChevronDown,
  Heart,
  Menu,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../utils/ecommerceLogic';
import { ProductImage } from './ProductCard';

export const Navbar: React.FC = () => {
  const {
    activePage,
    navigateTo,
    products,
    categories,
    cart,
    cartTotals,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateCartQuantity,
    removeFromCart,
    wishlistIds,
    user,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    toasts,
    dismissToast,
  } = useStore();

  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollectionsDropdownOpen, setIsCollectionsDropdownOpen] = useState(false);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const searchSuggestions = searchInput.trim()
    ? products
        .filter((p) => {
          const q = searchInput.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
          );
        })
        .slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = searchInput.trim();
    if (cleaned) {
      addRecentSearch(cleaned);
    }
    setIsSearchOpen(false);
    navigateTo('catalog', {
      category: 'All',
      gender: 'All',
      search: cleaned,
    });
  };

  return (
    <>
      {/* Slim Dismissible Top Announcement Bar (<= 36px height) */}
      {showAnnouncement && (
        <div className="bg-[#111111] text-white text-xs py-2 px-4 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap mx-auto">
              <span>Free Shipping on Orders Above ₹1,999</span>
              <span aria-hidden="true" className="text-white/40">
                ·
              </span>
              <span className="text-[#FF5A1F] font-semibold">
                Extra 10% OFF Your First Order: Code STEP10
              </span>
              <span aria-hidden="true" className="text-white/40 hidden sm:inline">
                ·
              </span>
              <span className="hidden sm:inline">Easy 7-Day Size Exchange & Returns</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAnnouncement(false)}
              aria-label="Dismiss promotional banner"
              className="text-white/60 hover:text-white shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Strict 3-Zone Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-black/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 -ml-2 text-[#111111] hover:bg-black/5 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] whitespace-nowrap shrink-0"
            >
              STEPZONE
            </button>
          </div>

          {/* Zone 2: Concise Single-Line Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#222222]"
          >
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className={`hover:text-[#FF5A1F] transition-colors whitespace-nowrap shrink-0 py-1 ${
                activePage === 'home' ? 'text-[#FF5A1F] font-semibold' : ''
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() =>
                navigateTo('catalog', { gender: 'Men', category: 'All', search: '' })
              }
              className="hover:text-[#FF5A1F] transition-colors whitespace-nowrap shrink-0 py-1"
            >
              Men
            </button>
            <button
              type="button"
              onClick={() =>
                navigateTo('catalog', { gender: 'Women', category: 'All', search: '' })
              }
              className="hover:text-[#FF5A1F] transition-colors whitespace-nowrap shrink-0 py-1"
            >
              Women
            </button>
            <button
              type="button"
              onClick={() =>
                navigateTo('catalog', {
                  category: 'Running Shoes',
                  gender: 'All',
                  search: '',
                })
              }
              className="hover:text-[#FF5A1F] transition-colors whitespace-nowrap shrink-0 py-1"
            >
              Sports
            </button>
            <button
              type="button"
              onClick={() =>
                navigateTo('catalog', { category: 'All', gender: 'All', search: '' })
              }
              className={`hover:text-[#FF5A1F] transition-colors whitespace-nowrap shrink-0 py-1 ${
                activePage === 'catalog' ? 'text-[#FF5A1F] font-semibold' : ''
              }`}
            >
              New Arrivals
            </button>

            {/* Collections Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsCollectionsDropdownOpen(true)}
              onMouseLeave={() => setIsCollectionsDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsCollectionsDropdownOpen(!isCollectionsDropdownOpen)}
                aria-expanded={isCollectionsDropdownOpen}
                className="flex items-center gap-1 hover:text-[#FF5A1F] transition-colors whitespace-nowrap shrink-0 py-2"
              >
                <span>Collections</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isCollectionsDropdownOpen && (
                <div className="absolute left-0 top-full w-64 bg-white rounded-xl shadow-lg border border-black/10 py-2 z-50">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setIsCollectionsDropdownOpen(false);
                        navigateTo('catalog', {
                          category: cat.name,
                          gender: 'All',
                          search: '',
                        });
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[#222222] hover:bg-[#F5F5F5] hover:text-[#FF5A1F] flex items-center justify-between"
                    >
                      <span>{cat.name}</span>
                      <span className="text-xs font-mono text-[#777777]">
                        {cat.productCount ?? ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => navigateTo('admin')}
                className={`flex items-center gap-1 hover:text-[#FF5A1F] transition-colors whitespace-nowrap shrink-0 py-1 ${
                  activePage === 'admin' ? 'text-[#FF5A1F] font-semibold' : ''
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#FF5A1F]" />
                <span>Admin Panel</span>
              </button>
            )}
          </nav>

          {/* Zone 3: Action Controls (Search, Wishlist, Account, Bag) */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open product search"
              className="p-1.5 sm:p-2 text-[#111111] hover:bg-[#F5F5F5] rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => navigateTo('wishlist')}
              aria-label={`Wishlist (${wishlistIds.length} saved items)`}
              className="relative p-1.5 sm:p-2 text-[#111111] hover:bg-[#F5F5F5] rounded-lg transition-colors"
            >
              <Heart className="w-5 h-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#111111] text-white text-[10px] font-mono font-bold flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigateTo(user ? 'dashboard' : 'auth')}
              aria-label={user ? `Account (${user.name})` : 'Sign In or Register'}
              className="p-1.5 sm:p-2 text-[#111111] hover:bg-[#F5F5F5] rounded-lg transition-colors flex items-center gap-1.5"
            >
              <UserIcon className="w-5 h-5" />
              {user && (
                <span className="hidden xl:inline text-xs font-semibold text-[#111111] max-w-[90px] truncate">
                  {user.name.split(' ')[0]}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              aria-label={`Shopping bag with ${totalCartItems} items`}
              className="px-2.5 sm:px-3.5 py-2 bg-[#111111] hover:bg-[#FF5A1F] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Bag</span>
              <span className="font-mono tabular-nums">({totalCartItems})</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-black/10 px-4 py-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateTo('home');
                }}
                className="text-left px-3 py-2.5 rounded-lg bg-[#F5F5F5] text-sm font-semibold"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateTo('catalog', { gender: 'Men', category: 'All', search: '' });
                }}
                className="text-left px-3 py-2.5 rounded-lg bg-[#F5F5F5] text-sm font-semibold"
              >
                Men’s Footwear
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateTo('catalog', { gender: 'Women', category: 'All', search: '' });
                }}
                className="text-left px-3 py-2.5 rounded-lg bg-[#F5F5F5] text-sm font-semibold"
              >
                Women’s Footwear
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateTo('catalog', {
                    category: 'Running Shoes',
                    gender: 'All',
                    search: '',
                  });
                }}
                className="text-left px-3 py-2.5 rounded-lg bg-[#F5F5F5] text-sm font-semibold"
              >
                Running & Sports
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateTo('track-order');
                }}
                className="text-left px-3 py-2.5 rounded-lg bg-[#F5F5F5] text-sm font-semibold"
              >
                Track Order
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateTo('admin');
                }}
                className="text-left px-3 py-2.5 rounded-lg bg-[#111111] text-white text-sm font-semibold"
              >
                Admin Console
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Live Search Modal with Suggestions & Recent Searches */}
      {isSearchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search STEPZONE footwear"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-16 px-4"
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-black/10 overflow-hidden">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-3 px-5 py-4 border-b border-black/10"
            >
              <Search className="w-5 h-5 text-[#777777]" />
              <input
                type="text"
                autoFocus
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by shoe name, brand, category (e.g. AirFlex, Running, Oxford)..."
                aria-label="Search products"
                className="w-full text-sm text-[#111111] placeholder:text-[#777777] focus:outline-none"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="text-xs text-[#777777] hover:text-[#111111]"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search dialog"
                className="p-1.5 text-[#777777] hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </form>

            <div className="p-5 max-h-[65vh] overflow-y-auto space-y-5">
              {searchInput.trim() ? (
                searchSuggestions.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#777777] mb-3">
                      Matching Footwear ({searchSuggestions.length})
                    </p>
                    <div className="divide-y divide-black/[0.06]">
                      {searchSuggestions.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => {
                            addRecentSearch(prod.name);
                            setIsSearchOpen(false);
                            navigateTo('product', { productId: prod.id });
                          }}
                          className="w-full py-2.5 flex items-center justify-between gap-4 hover:bg-[#F5F5F5] px-2 rounded-lg text-left transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <ProductImage
                              src={prod.images[0]}
                              alt={prod.name}
                              className="w-12 h-12 rounded-lg object-cover bg-[#ECECEC]"
                            />
                            <div>
                              <p className="text-sm font-semibold text-[#111111]">
                                {prod.name}
                              </p>
                              <p className="text-xs text-[#777777]">
                                {prod.brand} · {prod.category}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-mono font-bold text-[#111111]">
                            {formatINR(prod.price)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm font-semibold text-[#111111]">
                      No matching shoes found for “{searchInput}”
                    </p>
                    <p className="text-xs text-[#777777] mt-1">
                      Try searching for Running Shoes, Sneakers, High Top, or Formal Shoes.
                    </p>
                  </div>
                )
              ) : (
                <>
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#777777]">
                          Recent Searches
                        </span>
                        <button
                          type="button"
                          onClick={clearRecentSearches}
                          className="text-xs text-[#FF5A1F] hover:underline"
                        >
                          Clear History
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => {
                              setSearchInput(term);
                              setIsSearchOpen(false);
                              navigateTo('catalog', {
                                category: 'All',
                                gender: 'All',
                                search: term,
                              });
                            }}
                            className="px-3 py-1.5 bg-[#F5F5F5] hover:bg-[#111111] hover:text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#777777] mb-2">
                      Popular Categories
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categories.slice(0, 6).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setIsSearchOpen(false);
                            navigateTo('catalog', {
                              category: c.name,
                              gender: 'All',
                              search: '',
                            });
                          }}
                          className="text-left px-3 py-2 rounded-lg border border-black/10 hover:border-[#111111] text-xs font-medium text-[#111111]"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Shopping Cart Drawer */}
      {isCartDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Bag Drawer"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end"
        >
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#111111]" />
                <h2 className="font-display text-xl font-bold uppercase tracking-wide text-[#111111]">
                  Your Shopping Bag ({totalCartItems})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(false)}
                aria-label="Close shopping bag drawer"
                className="p-2 text-[#777777] hover:text-[#111111] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cartTotals.freeShippingRemaining > 0 && cart.length > 0 ? (
              <div className="bg-[#F5F5F5] px-6 py-2.5 text-xs text-[#222222] border-b border-black/[0.06]">
                Add{' '}
                <span className="font-mono font-bold text-[#FF5A1F]">
                  {formatINR(cartTotals.freeShippingRemaining)}
                </span>{' '}
                more to unlock <span className="font-semibold">FREE Express Shipping</span>!
              </div>
            ) : (
              cart.length > 0 && (
                <div className="bg-emerald-950 text-emerald-100 px-6 py-2.5 text-xs font-medium">
                  You have unlocked FREE Express Shipping on this order!
                </div>
              )
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <ShoppingBag className="w-12 h-12 text-[#777777] mx-auto stroke-[1.25]" />
                  <div>
                    <p className="text-base font-semibold text-[#111111]">
                      Your STEPZONE bag is empty
                    </p>
                    <p className="text-xs text-[#777777] mt-1">
                      Explore our performance runners, street sneakers, and limited releases.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartDrawerOpen(false);
                      navigateTo('catalog', { category: 'All', gender: 'All', search: '' });
                    }}
                    className="px-5 py-2.5 bg-[#111111] hover:bg-[#FF5A1F] text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Explore Footwear
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 pb-4 border-b border-black/[0.07]"
                  >
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover bg-[#ECECEC] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCartDrawerOpen(false);
                            navigateTo('product', { productId: item.productId });
                          }}
                          className="text-sm font-semibold text-[#111111] hover:text-[#FF5A1F] text-left truncate"
                        >
                          {item.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.name} from bag`}
                          className="text-[#777777] hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-[#777777] mt-0.5">
                        Size: UK {item.size} · {item.color}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-black/15 rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="p-1.5 text-[#111111] hover:bg-[#F5F5F5]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-mono font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="p-1.5 text-[#111111] hover:bg-[#F5F5F5]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm font-mono font-bold text-[#111111]">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-[#F5F5F5] border-t border-black/10 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#555555]">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatINR(cartTotals.subtotal)}</span>
                  </div>
                  {cartTotals.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Coupon Discount</span>
                      <span className="font-mono">-{formatINR(cartTotals.couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#555555]">
                    <span>Shipping</span>
                    <span className="font-mono">
                      {cartTotals.shippingCost === 0
                        ? 'FREE'
                        : formatINR(cartTotals.shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#555555]">
                    <span>Estimated GST (12%)</span>
                    <span className="font-mono">{formatINR(cartTotals.tax)}</span>
                  </div>
                  <div className="pt-2 border-t border-black/10 flex justify-between text-sm font-bold text-[#111111]">
                    <span>Total Payable</span>
                    <span className="font-mono">{formatINR(cartTotals.totalAmount)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartDrawerOpen(false);
                      navigateTo('cart');
                    }}
                    className="py-2.5 px-4 border border-[#111111] text-[#111111] hover:bg-black/5 rounded-lg text-xs font-semibold transition-colors"
                  >
                    View Full Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartDrawerOpen(false);
                      navigateTo('checkout');
                    }}
                    className="py-2.5 px-4 bg-[#FF5A1F] hover:bg-[#e04812] text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Checkout Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Toast Notification Stack */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium ${
                t.type === 'error'
                  ? 'bg-red-950 text-red-100 border-red-800'
                  : t.type === 'info'
                  ? 'bg-[#111111] text-white border-white/15'
                  : 'bg-[#111111] text-white border-[#FF5A1F]'
              }`}
            >
              <span>{t.text}</span>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Close notification"
                className="text-white/60 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
