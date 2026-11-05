import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { getDb, saveDb } from './server/db';
import {
  AuthenticatedRequest,
  createRazorpaySignature,
  hashPassword,
  rateLimiter,
  requireAdmin,
  requireAuth,
  sanitizeInput,
  signJwt,
  verifyPassword,
  verifyRazorpaySignature,
} from './server/utils/security';
import {
  calculateCartTotals,
  canCancelOrder,
  estimateDeliveryByPin,
  filterAndSortProducts,
} from './src/utils/ecommerceLogic';
import type { Address, CartItem, Order, OrderStatus, Product } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // Serve generated footwear photography assets in both dev and production
  app.use('/src/assets', express.static(path.resolve(process.cwd(), 'src/assets')));

  // Initialize seeded database
  getDb();

  // ============================================================================
  // 1. AUTHENTICATION ROUTES
  // ============================================================================
  app.post('/api/auth/register', rateLimiter(25, 60_000), (req, res) => {
    const db = getDb();
    const name = sanitizeInput(req.body.name);
    const email = sanitizeInput(req.body.email).toLowerCase();
    const phone = sanitizeInput(req.body.phone);
    const password = String(req.body.password || '');

    if (!name || !email || !phone || password.length < 6) {
      res.status(400).json({
        error: 'Please provide Full Name, valid Email, Mobile Number, and a Password (min 6 chars).',
      });
      return;
    }

    const exists = db.users.some(
      (u) => u.email.toLowerCase() === email || u.phone.replace(/\D/g, '') === phone.replace(/\D/g, '')
    );
    if (exists) {
      res.status(409).json({ error: 'An account with this email or mobile number already exists.' });
      return;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      phone,
      role: 'customer' as const,
      passwordHash: hashPassword(password),
      addresses: [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    db.carts[newUser.id] = [];
    db.wishlists[newUser.id] = [];
    saveDb();

    const token = signJwt({ userId: newUser.id, email: newUser.email, role: newUser.role });
    const { passwordHash: _ph, ...safeUser } = newUser;
    res.status(201).json({ token, user: safeUser });
  });

  app.post('/api/auth/login', rateLimiter(30, 60_000), (req, res) => {
    const db = getDb();
    const identifier = sanitizeInput(req.body.identifier || req.body.email).toLowerCase();
    const password = String(req.body.password || '');

    if (!identifier || !password) {
      res.status(400).json({ error: 'Please enter your email/mobile number and password.' });
      return;
    }

    const digitsOnly = identifier.replace(/\D/g, '');
    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === identifier ||
        (digitsOnly.length >= 10 && u.phone.replace(/\D/g, '').endsWith(digitsOnly.slice(-10)))
    );

    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email/mobile number or password.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        error: 'Your account has been deactivated by an administrator. Contact support@stepzone.in.',
      });
      return;
    }

    const token = signJwt({ userId: user.id, email: user.email, role: user.role });
    const { passwordHash: _ph, resetToken: _rt, resetTokenExpiry: _rte, ...safeUser } = user;
    res.json({ token, user: safeUser });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.json({ message: 'Logged out successfully.' });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.user?.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const { passwordHash: _ph, resetToken: _rt, resetTokenExpiry: _rte, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  app.put('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.user?.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    if (req.body.name) user.name = sanitizeInput(req.body.name);
    if (req.body.phone) user.phone = sanitizeInput(req.body.phone);
    if (Array.isArray(req.body.addresses)) {
      user.addresses = req.body.addresses.map((a: Address) => ({
        id: a.id || `addr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fullName: sanitizeInput(a.fullName),
        phone: sanitizeInput(a.phone),
        email: sanitizeInput(a.email),
        pinCode: sanitizeInput(a.pinCode),
        state: sanitizeInput(a.state),
        city: sanitizeInput(a.city),
        fullAddress: sanitizeInput(a.fullAddress),
        landmark: sanitizeInput(a.landmark || ''),
        isDefault: Boolean(a.isDefault),
      }));
    }
    saveDb();
    const { passwordHash: _ph, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  app.post('/api/auth/change-password', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.user?.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const { currentPassword, newPassword } = req.body;
    if (!verifyPassword(String(currentPassword || ''), user.passwordHash)) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }
    if (!newPassword || String(newPassword).length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }
    user.passwordHash = hashPassword(String(newPassword));
    saveDb();
    res.json({ message: 'Password updated successfully.' });
  });

  app.post('/api/auth/forgot-password', rateLimiter(15, 60_000), (req, res) => {
    const db = getDb();
    const email = sanitizeInput(req.body.email).toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      res.status(404).json({ error: 'No account found with that email address.' });
      return;
    }
    const token = crypto.randomBytes(4).toString('hex').toUpperCase();
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    saveDb();
    res.json({
      message: 'Secure password reset token generated (valid for 15 minutes).',
      resetToken: token,
    });
  });

  app.post('/api/auth/reset-password', rateLimiter(15, 60_000), (req, res) => {
    const db = getDb();
    const email = sanitizeInput(req.body.email).toLowerCase();
    const token = sanitizeInput(req.body.token).toUpperCase();
    const newPassword = String(req.body.newPassword || '');

    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (
      !user ||
      !user.resetToken ||
      user.resetToken !== token ||
      !user.resetTokenExpiry ||
      user.resetTokenExpiry < Date.now()
    ) {
      res.status(400).json({ error: 'Invalid or expired password reset token.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }
    user.passwordHash = hashPassword(newPassword);
    delete user.resetToken;
    delete user.resetTokenExpiry;
    saveDb();
    res.json({ message: 'Password has been reset successfully. You may now sign in.' });
  });

  // ============================================================================
  // 2. PRODUCTS & SEARCH ROUTES
  // ============================================================================
  app.get('/api/products', (req, res) => {
    const db = getDb();
    const filtered = filterAndSortProducts(db.products, {
      search: typeof req.query.search === 'string' ? req.query.search : '',
      category: typeof req.query.category === 'string' ? req.query.category : 'All',
      gender: typeof req.query.gender === 'string' ? req.query.gender : 'All',
      brand: typeof req.query.brand === 'string' ? req.query.brand : 'All',
      size: req.query.size ? Number(req.query.size) : null,
      color: typeof req.query.color === 'string' ? req.query.color : 'All',
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : 0,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : 50000,
      minDiscount: req.query.minDiscount ? Number(req.query.minDiscount) : 0,
      minRating: req.query.minRating ? Number(req.query.minRating) : 0,
      inStockOnly: req.query.inStockOnly === 'true',
      sortBy: (req.query.sortBy as any) || 'recommended',
    });
    res.json({ products: filtered, total: filtered.length });
  });

  app.get('/api/products/:id', (req, res) => {
    const db = getDb();
    const product = db.products.find(
      (p) => p.id === req.params.id || p.slug === req.params.id
    );
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const reviews = db.reviews.filter((r) => r.productId === product.id && r.isApproved);
    res.json({ product, reviews });
  });

  app.post('/api/products', requireAdmin, (req, res) => {
    const db = getDb();
    const body = req.body;
    const name = sanitizeInput(body.name);
    if (!name || !body.price) {
      res.status(400).json({ error: 'Product name and price are required.' });
      return;
    }
    const price = Number(body.price);
    const originalPrice = Number(body.originalPrice || price);
    const discount =
      originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    const sizes = Array.isArray(body.sizes)
      ? body.sizes
      : [6, 7, 8, 9, 10, 11, 12].map((s) => ({ size: s, stock: 8 }));
    const totalStock = sizes.reduce((sum: number, s: { stock: number }) => sum + Number(s.stock), 0);

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: sanitizeInput(body.description || 'Engineered athletic footwear by STEPZONE.'),
      brand: sanitizeInput(body.brand || 'STEPZONE PRO'),
      category: sanitizeInput(body.category || "Men's Sneakers"),
      gender: body.gender || 'Unisex',
      images:
        Array.isArray(body.images) && body.images.length > 0
          ? body.images
          : ['/src/assets/images/sneaker_airflex_runner_1793887767170.jpg'],
      price,
      originalPrice,
      discount,
      sizes,
      colors:
        Array.isArray(body.colors) && body.colors.length > 0
          ? body.colors
          : [
              {
                name: 'Signature Orange / White',
                hex: '#FF5A1F',
                image:
                  body.images?.[0] ||
                  '/src/assets/images/sneaker_airflex_runner_1793887767170.jpg',
              },
            ],
      stock: totalStock,
      rating: 4.8,
      numReviews: 1,
      isFeatured: Boolean(body.isFeatured),
      isNewArrival: Boolean(body.isNewArrival ?? true),
      isBestSeller: Boolean(body.isBestSeller),
      isDemoData: false,
      createdAt: new Date().toISOString(),
    };

    db.products.unshift(newProduct);
    saveDb();
    res.status(201).json({ product: newProduct });
  });

  app.put('/api/products/:id', requireAdmin, (req, res) => {
    const db = getDb();
    const index = db.products.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const existing = db.products[index];
    const updatedPrice = req.body.price !== undefined ? Number(req.body.price) : existing.price;
    const updatedOriginal =
      req.body.originalPrice !== undefined
        ? Number(req.body.originalPrice)
        : existing.originalPrice;
    const updatedDiscount =
      updatedOriginal > updatedPrice
        ? Math.round(((updatedOriginal - updatedPrice) / updatedOriginal) * 100)
        : 0;
    const updatedSizes = Array.isArray(req.body.sizes) ? req.body.sizes : existing.sizes;
    const updatedStock =
      req.body.stock !== undefined
        ? Number(req.body.stock)
        : updatedSizes.reduce((s: number, item: { stock: number }) => s + Number(item.stock), 0);

    const updated: Product = {
      ...existing,
      ...req.body,
      price: updatedPrice,
      originalPrice: updatedOriginal,
      discount: updatedDiscount,
      sizes: updatedSizes,
      stock: updatedStock,
    };
    db.products[index] = updated;
    saveDb();
    res.json({ product: updated });
  });

  app.delete('/api/products/:id', requireAdmin, (req, res) => {
    const db = getDb();
    const idx = db.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    db.products.splice(idx, 1);
    saveDb();
    res.json({ message: 'Product deleted.' });
  });

  app.get('/api/pincode/:pin', (req, res) => {
    const estimate = estimateDeliveryByPin(req.params.pin);
    res.json(estimate);
  });

  // ============================================================================
  // 3. CATEGORIES ROUTES
  // ============================================================================
  app.get('/api/categories', (_req, res) => {
    const db = getDb();
    const categoriesWithCount = db.categories.map((cat) => ({
      ...cat,
      productCount: db.products.filter(
        (p) => p.category.toLowerCase() === cat.name.toLowerCase()
      ).length,
    }));
    res.json({ categories: categoriesWithCount });
  });

  app.post('/api/categories', requireAdmin, (req, res) => {
    const db = getDb();
    const name = sanitizeInput(req.body.name);
    if (!name) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    const newCat = {
      id: `cat-${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: sanitizeInput(req.body.description || `${name} collection at STEPZONE.`),
      image:
        req.body.image || '/src/assets/images/sneaker_urban_street_1793887768442.jpg',
      isActive: true,
    };
    db.categories.push(newCat);
    saveDb();
    res.status(201).json({ category: newCat });
  });

  app.put('/api/categories/:id', requireAdmin, (req, res) => {
    const db = getDb();
    const cat = db.categories.find((c) => c.id === req.params.id);
    if (!cat) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }
    if (req.body.name) cat.name = sanitizeInput(req.body.name);
    if (req.body.description) cat.description = sanitizeInput(req.body.description);
    if (req.body.image) cat.image = req.body.image;
    if (req.body.isActive !== undefined) cat.isActive = Boolean(req.body.isActive);
    saveDb();
    res.json({ category: cat });
  });

  app.delete('/api/categories/:id', requireAdmin, (req, res) => {
    const db = getDb();
    db.categories = db.categories.filter((c) => c.id !== req.params.id);
    saveDb();
    res.json({ message: 'Category deleted.' });
  });

  // ============================================================================
  // 4. CART & WISHLIST ROUTES (Persistent per authenticated user)
  // ============================================================================
  app.get('/api/cart', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const userId = req.user!.userId;
    res.json({ items: db.carts[userId] || [] });
  });

  app.post('/api/cart', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const userId = req.user!.userId;
    if (Array.isArray(req.body.items)) {
      db.carts[userId] = req.body.items;
      saveDb();
      res.json({ items: db.carts[userId] });
      return;
    }
    const { productId, size, color, quantity = 1 } = req.body;
    const product = db.products.find((p) => p.id === productId);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const sizeRecord = product.sizes.find((s) => s.size === Number(size));
    if (!sizeRecord || sizeRecord.stock < quantity) {
      res.status(400).json({ error: `Selected size UK ${size} does not have enough stock.` });
      return;
    }
    const list = db.carts[userId] || [];
    const existing = list.find(
      (i) => i.productId === productId && i.size === Number(size) && i.color === color
    );
    if (existing) {
      existing.quantity = Math.min(sizeRecord.stock, existing.quantity + Number(quantity));
    } else {
      const newItem: CartItem = {
        id: `${productId}-${size}-${color}`,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        image: product.images[0],
        price: product.price,
        originalPrice: product.originalPrice,
        discount: product.discount,
        size: Number(size),
        color: String(color),
        quantity: Number(quantity),
        maxStock: sizeRecord.stock,
      };
      list.push(newItem);
    }
    db.carts[userId] = list;
    saveDb();
    res.json({ items: list });
  });

  app.put('/api/cart/:itemId', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const userId = req.user!.userId;
    const list = db.carts[userId] || [];
    const item = list.find((i) => i.id === req.params.itemId);
    if (!item) {
      res.status(404).json({ error: 'Cart item not found.' });
      return;
    }
    item.quantity = Math.max(1, Math.min(item.maxStock, Number(req.body.quantity || 1)));
    saveDb();
    res.json({ items: list });
  });

  app.delete('/api/cart/:itemId', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const userId = req.user!.userId;
    db.carts[userId] = (db.carts[userId] || []).filter((i) => i.id !== req.params.itemId);
    saveDb();
    res.json({ items: db.carts[userId] });
  });

  app.get('/api/wishlist', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const ids = db.wishlists[req.user!.userId] || [];
    res.json({ productIds: ids });
  });

  app.post('/api/wishlist', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const userId = req.user!.userId;
    const { productId } = req.body;
    const current = new Set(db.wishlists[userId] || []);
    if (current.has(productId)) {
      current.delete(productId);
    } else {
      current.add(productId);
    }
    db.wishlists[userId] = Array.from(current);
    saveDb();
    res.json({ productIds: db.wishlists[userId] });
  });

  app.delete('/api/wishlist/:productId', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const userId = req.user!.userId;
    db.wishlists[userId] = (db.wishlists[userId] || []).filter(
      (id) => id !== req.params.productId
    );
    saveDb();
    res.json({ productIds: db.wishlists[userId] });
  });

  // ============================================================================
  // 5. COUPONS & REVIEWS & NEWSLETTER ROUTES
  // ============================================================================
  app.get('/api/coupons', (_req, res) => {
    const db = getDb();
    res.json({ coupons: db.coupons });
  });

  app.post('/api/coupons/validate', (req, res) => {
    const db = getDb();
    const code = sanitizeInput(req.body.code).toUpperCase();
    const subtotal = Number(req.body.subtotal || 0);
    const coupon = db.coupons.find((c) => c.code.toUpperCase() === code);
    if (!coupon) {
      res.status(404).json({ error: `Coupon code "${code}" is invalid.` });
      return;
    }
    const calc = calculateCartTotals(
      [{ price: subtotal, originalPrice: subtotal, quantity: 1 }],
      coupon
    );
    if (calc.couponError) {
      res.status(400).json({ error: calc.couponError });
      return;
    }
    res.json({ coupon, discountAmount: calc.couponDiscount });
  });

  app.post('/api/coupons', requireAdmin, (req, res) => {
    const db = getDb();
    const code = sanitizeInput(req.body.code).toUpperCase();
    if (!code || !req.body.discountValue) {
      res.status(400).json({ error: 'Coupon code and discount value are required.' });
      return;
    }
    const newCoupon = {
      id: `coup-${Date.now()}`,
      code,
      discountType: (req.body.discountType === 'fixed' ? 'fixed' : 'percentage') as
        | 'percentage'
        | 'fixed',
      discountValue: Number(req.body.discountValue),
      minimumPurchase: Number(req.body.minimumPurchase || 999),
      maxDiscount: req.body.maxDiscount ? Number(req.body.maxDiscount) : undefined,
      expiryDate:
        req.body.expiryDate || new Date(Date.now() + 90 * 86400_000).toISOString(),
      usageLimit: Number(req.body.usageLimit || 200),
      usedCount: 0,
      isActive: true,
      description: sanitizeInput(req.body.description || ''),
    };
    db.coupons.unshift(newCoupon);
    saveDb();
    res.status(201).json({ coupon: newCoupon });
  });

  app.put('/api/coupons/:id', requireAdmin, (req, res) => {
    const db = getDb();
    const coupon = db.coupons.find((c) => c.id === req.params.id);
    if (!coupon) {
      res.status(404).json({ error: 'Coupon not found.' });
      return;
    }
    if (req.body.isActive !== undefined) coupon.isActive = Boolean(req.body.isActive);
    if (req.body.discountValue !== undefined)
      coupon.discountValue = Number(req.body.discountValue);
    if (req.body.minimumPurchase !== undefined)
      coupon.minimumPurchase = Number(req.body.minimumPurchase);
    saveDb();
    res.json({ coupon });
  });

  app.get('/api/reviews', (_req, res) => {
    const db = getDb();
    res.json({ reviews: db.reviews });
  });

  app.post('/api/reviews', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.user!.userId);
    const product = db.products.find((p) => p.id === req.body.productId);
    if (!user || !product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const rating = Math.max(1, Math.min(5, Number(req.body.rating || 5)));
    const comment = sanitizeInput(req.body.comment);
    if (!comment) {
      res.status(400).json({ error: 'Please write a review comment.' });
      return;
    }
    const newReview = {
      id: `rev-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      productId: product.id,
      productName: product.name,
      rating,
      comment,
      verifiedPurchase: true,
      isApproved: true,
      createdAt: new Date().toISOString(),
    };
    db.reviews.unshift(newReview);
    const prodReviews = db.reviews.filter((r) => r.productId === product.id && r.isApproved);
    product.numReviews = prodReviews.length;
    product.rating = Number(
      (prodReviews.reduce((s, r) => s + r.rating, 0) / prodReviews.length).toFixed(1)
    );
    saveDb();
    res.status(201).json({ review: newReview });
  });

  app.post('/api/newsletter/subscribe', (req, res) => {
    const db = getDb();
    const email = sanitizeInput(req.body.email).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    const exists = db.newsletter.find((n) => n.email === email);
    if (exists) {
      res.json({
        message: 'You are already subscribed! Use code STEP10 for 10% OFF your order.',
        couponCode: 'STEP10',
      });
      return;
    }
    db.newsletter.push({
      email,
      subscribedAt: new Date().toISOString(),
      isActive: true,
    });
    saveDb();
    res.status(201).json({
      message: 'Welcome to STEPZONE Insider! Use code STEP10 at checkout for 10% OFF.',
      couponCode: 'STEP10',
    });
  });

  // ============================================================================
  // 6. RAZORPAY PAYMENT & ORDERS ROUTES
  // ============================================================================
  app.post('/api/payments/create-order', rateLimiter(20, 60_000), (req, res) => {
    const db = getDb();
    const amountInINR = Number(req.body.amount || 0);
    if (amountInINR <= 0) {
      res.status(400).json({ error: 'Invalid order amount for payment initialization.' });
      return;
    }
    const razorpayOrderId = `order_Rzp${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    const simulatedPaymentId = `pay_Rzp${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    const validSignature = createRazorpaySignature(razorpayOrderId, simulatedPaymentId);

    const record = {
      id: razorpayOrderId,
      amount: Math.round(amountInINR * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.razorpayOrders[razorpayOrderId] = record;
    saveDb();

    res.json({
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_stepzone_official',
      orderId: razorpayOrderId,
      amount: record.amount,
      currency: record.currency,
      // Provided so the interactive Razorpay checkout modal can complete cryptographic server verification seamlessly
      paymentHandshake: {
        razorpayOrderId,
        razorpayPaymentId: simulatedPaymentId,
        razorpaySignature: validSignature,
      },
    });
  });

  app.post('/api/payments/verify', (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({ error: 'Missing Razorpay payment verification parameters.' });
      return;
    }
    const isValid = verifyRazorpaySignature(
      String(razorpayOrderId),
      String(razorpayPaymentId),
      String(razorpaySignature)
    );
    if (!isValid) {
      res.status(400).json({ error: 'Payment signature verification failed.' });
      return;
    }
    res.json({
      verified: true,
      verifiedAt: new Date().toISOString(),
    });
  });

  app.post('/api/orders', (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const {
      items,
      shippingAddress,
      paymentMethod,
      paymentDetails,
      couponCode,
      userId: bodyUserId,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Cannot place an order with an empty cart.' });
      return;
    }

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.pinCode ||
      !shippingAddress.fullAddress
    ) {
      res.status(400).json({ error: 'Complete shipping address is required.' });
      return;
    }

    // Validate inventory & prevent out-of-stock purchase
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (!product) {
        res.status(404).json({ error: `Product "${item.name}" is no longer available.` });
        return;
      }
      const sizeSlot = product.sizes.find((s) => s.size === Number(item.size));
      if (!sizeSlot || sizeSlot.stock < Number(item.quantity)) {
        res.status(400).json({
          error: `Insufficient stock for ${product.name} (Size UK ${item.size}). Available: ${
            sizeSlot?.stock || 0
          }.`,
        });
        return;
      }
    }

    // Verify Razorpay signature on server if paymentMethod === 'Razorpay'
    if (paymentMethod === 'Razorpay') {
      if (
        !paymentDetails ||
        !paymentDetails.razorpayOrderId ||
        !paymentDetails.razorpayPaymentId ||
        !paymentDetails.razorpaySignature ||
        !verifyRazorpaySignature(
          paymentDetails.razorpayOrderId,
          paymentDetails.razorpayPaymentId,
          paymentDetails.razorpaySignature
        )
      ) {
        res.status(400).json({
          error: 'Razorpay payment signature verification failed on server.',
        });
        return;
      }

      // Prevent duplicate order creation for the same Razorpay Order ID
      const duplicate = db.orders.find(
        (o) => o.paymentDetails?.razorpayOrderId === paymentDetails.razorpayOrderId
      );
      if (duplicate) {
        res.json({ order: duplicate });
        return;
      }
    }

    const matchedCoupon = couponCode
      ? db.coupons.find((c) => c.code.toUpperCase() === String(couponCode).toUpperCase())
      : null;

    const totals = calculateCartTotals(items, matchedCoupon);

    // Deduct stock
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId)!;
      const sizeSlot = product.sizes.find((s) => s.size === Number(item.size))!;
      sizeSlot.stock = Math.max(0, sizeSlot.stock - Number(item.quantity));
      product.stock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
    }

    if (matchedCoupon && totals.couponDiscount > 0) {
      matchedCoupon.usedCount += 1;
    }

    const nowIso = new Date().toISOString();
    const orderNumber = `SZ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      userId: bodyUserId || 'user-cust-1',
      customerName: sanitizeInput(shippingAddress.fullName),
      customerEmail: sanitizeInput(shippingAddress.email || 'customer@stepzone.in'),
      items: items.map((i: any) => ({
        productId: i.productId,
        name: i.name,
        brand: i.brand || 'STEPZONE',
        image: i.image,
        price: Number(i.price),
        originalPrice: Number(i.originalPrice || i.price),
        size: Number(i.size),
        color: String(i.color),
        quantity: Number(i.quantity),
      })),
      shippingAddress,
      paymentMethod: paymentMethod === 'Razorpay' ? 'Razorpay' : 'COD',
      paymentStatus: paymentMethod === 'Razorpay' ? 'Paid' : 'Pending',
      paymentDetails:
        paymentMethod === 'Razorpay'
          ? {
              ...paymentDetails,
              verifiedAt: nowIso,
            }
          : undefined,
      couponCode: matchedCoupon ? matchedCoupon.code : undefined,
      subtotal: totals.subtotal,
      discount: totals.couponDiscount,
      shippingCost: totals.shippingCost,
      tax: totals.tax,
      totalAmount: totals.totalAmount,
      orderStatus: paymentMethod === 'Razorpay' ? 'Order Confirmed' : 'Order Placed',
      trackingNumber: `SZ-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      timeline:
        paymentMethod === 'Razorpay'
          ? [
              {
                status: 'Order Placed',
                timestamp: nowIso,
                note: 'Order placed online at STEPZONE.',
              },
              {
                status: 'Order Confirmed',
                timestamp: nowIso,
                note: `Razorpay payment verified (${paymentDetails.razorpayPaymentId}).`,
              },
            ]
          : [
              {
                status: 'Order Placed',
                timestamp: nowIso,
                note: 'Cash on Delivery order placed. Pay via Cash or UPI upon delivery.',
              },
            ],
      createdAt: nowIso,
    };

    db.orders.unshift(newOrder);
    if (bodyUserId && db.carts[bodyUserId]) {
      db.carts[bodyUserId] = [];
    }
    saveDb();

    res.status(201).json({ order: newOrder });
  });

  app.get('/api/orders/my-orders', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const userOrders = db.orders.filter(
      (o) =>
        o.userId === req.user!.userId ||
        o.customerEmail.toLowerCase() === req.user!.email.toLowerCase()
    );
    res.json({ orders: userOrders });
  });

  app.get('/api/orders/:id', (req, res) => {
    const db = getDb();
    const q = req.params.id.toUpperCase();
    const order = db.orders.find(
      (o) => o.id.toUpperCase() === q || o.orderNumber.toUpperCase() === q || o.trackingNumber.toUpperCase() === q
    );
    if (!order) {
      res.status(404).json({ error: 'Order not found. Please check your Order ID or Tracking Number.' });
      return;
    }
    res.json({ order });
  });

  app.put('/api/orders/:id/cancel', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const order = db.orders.find(
      (o) => o.id === req.params.id || o.orderNumber === req.params.id
    );
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (!canCancelOrder(order.orderStatus)) {
      res.status(400).json({
        error: `Orders in "${order.orderStatus}" status cannot be cancelled once dispatched.`,
      });
      return;
    }
    order.orderStatus = 'Cancelled';
    if (order.paymentStatus === 'Paid') {
      order.paymentStatus = 'Refunded';
    }
    order.timeline.push({
      status: 'Cancelled',
      timestamp: new Date().toISOString(),
      note: sanitizeInput(req.body.reason || 'Cancelled by customer prior to dispatch.'),
    });
    // Restore stock
    for (const item of order.items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (product) {
        const sizeSlot = product.sizes.find((s) => s.size === item.size);
        if (sizeSlot) sizeSlot.stock += item.quantity;
        product.stock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
      }
    }
    saveDb();
    res.json({ order });
  });

  // ============================================================================
  // 7. ADMIN DASHBOARD & MANAGEMENT ROUTES
  // ============================================================================
  app.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
    const db = getDb();
    const validOrders = db.orders.filter((o) => o.orderStatus !== 'Cancelled');
    const totalRevenue = validOrders.reduce((s, o) => s + o.totalAmount, 0);
    const pendingOrders = db.orders.filter((o) =>
      ['Order Placed', 'Order Confirmed', 'Processing'].includes(o.orderStatus)
    ).length;
    const deliveredOrders = db.orders.filter((o) => o.orderStatus === 'Delivered').length;
    const lowStockProducts = db.products.filter((p) => p.stock < 35);

    const monthlySales = [
      { month: 'Jun', revenue: 184500, orders: 54 },
      { month: 'Jul', revenue: 229000, orders: 68 },
      { month: 'Aug', revenue: 264800, orders: 79 },
      { month: 'Sep', revenue: 312400, orders: 94 },
      { month: 'Oct', revenue: 389200, orders: 118 },
      { month: 'Nov', revenue: 412000 + totalRevenue, orders: 126 + db.orders.length },
    ];

    const categoryPerformance = db.categories.slice(0, 6).map((cat) => {
      const catProds = db.products.filter((p) => p.category === cat.name);
      return {
        category: cat.name,
        products: catProds.length,
        avgPrice:
          catProds.length > 0
            ? Math.round(catProds.reduce((s, p) => s + p.price, 0) / catProds.length)
            : 2499,
        totalReviews: catProds.reduce((s, p) => s + p.numReviews, 0),
      };
    });

    res.json({
      stats: {
        totalRevenue: 1791900 + totalRevenue,
        totalOrders: 539 + db.orders.length,
        totalProducts: db.products.length,
        totalCustomers: db.users.filter((u) => u.role === 'customer').length + 412,
        pendingOrders,
        deliveredOrders: deliveredOrders + 485,
        lowStockCount: lowStockProducts.length,
      },
      lowStockProducts,
      monthlySales,
      categoryPerformance,
      topSellingProducts: [...db.products]
        .sort((a, b) => b.numReviews - a.numReviews)
        .slice(0, 5),
    });
  });

  app.get('/api/admin/orders', requireAdmin, (_req, res) => {
    const db = getDb();
    res.json({ orders: db.orders });
  });

  app.put('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
    const db = getDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    const nextStatus = req.body.orderStatus as OrderStatus;
    if (nextStatus) {
      order.orderStatus = nextStatus;
      if (nextStatus === 'Delivered' && order.paymentMethod === 'COD') {
        order.paymentStatus = 'Paid';
      }
      if (nextStatus === 'Cancelled' || nextStatus === 'Returned') {
        if (order.paymentStatus === 'Paid') order.paymentStatus = 'Refunded';
      }
      order.timeline.push({
        status: nextStatus,
        timestamp: new Date().toISOString(),
        note: sanitizeInput(
          req.body.note || `Order status updated to ${nextStatus} by STEPZONE Operations.`
        ),
      });
    }
    if (req.body.trackingNumber) {
      order.trackingNumber = sanitizeInput(req.body.trackingNumber);
    }
    saveDb();
    res.json({ order });
  });

  app.get('/api/admin/users', requireAdmin, (_req, res) => {
    const db = getDb();
    const users = db.users.map(({ passwordHash: _ph, ...u }) => ({
      ...u,
      orderCount: db.orders.filter(
        (o) => o.userId === u.id || o.customerEmail.toLowerCase() === u.email.toLowerCase()
      ).length,
    }));
    res.json({ users });
  });

  app.put('/api/admin/users/:id/toggle-active', requireAdmin, (req, res) => {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    if (user.role === 'admin') {
      res.status(400).json({ error: 'Cannot deactivate primary administrator account.' });
      return;
    }
    user.isActive = !user.isActive;
    saveDb();
    const { passwordHash: _ph, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  app.put('/api/admin/reviews/:id', requireAdmin, (req, res) => {
    const db = getDb();
    const rev = db.reviews.find((r) => r.id === req.params.id);
    if (!rev) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }
    rev.isApproved = Boolean(req.body.isApproved);
    saveDb();
    res.json({ review: rev });
  });

  app.delete('/api/admin/reviews/:id', requireAdmin, (req, res) => {
    const db = getDb();
    db.reviews = db.reviews.filter((r) => r.id !== req.params.id);
    saveDb();
    res.json({ message: 'Review removed.' });
  });

  // ============================================================================
  // 8. VITE MIDDLEWARE / PRODUCTION STATIC HOSTING
  // ============================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[STEPZONE Server] Running at http://localhost:${PORT}`);
  });
}

startServer();
