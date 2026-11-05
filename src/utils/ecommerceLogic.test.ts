import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  canCancelOrder,
  estimateDeliveryByPin,
  filterAndSortProducts,
  formatINR,
} from './ecommerceLogic';
import type { Coupon, Product } from '../types';

const sampleCoupon: Coupon = {
  id: 'c1',
  code: 'STEP10',
  discountType: 'percentage',
  discountValue: 10,
  minimumPurchase: 1500,
  maxDiscount: 1000,
  expiryDate: '2030-12-31T23:59:59.000Z',
  usageLimit: 100,
  usedCount: 5,
  isActive: true,
};

test('formatINR formats Indian currency properly', () => {
  assert.equal(formatINR(2499), '₹2,499');
  assert.equal(formatINR(125000), '₹1,25,000');
});

test('calculateCartTotals computes free shipping above 1999 and applies valid percentage coupon', () => {
  const totals = calculateCartTotals(
    [{ price: 2499, originalPrice: 3499, quantity: 1 }],
    sampleCoupon,
    new Date('2026-11-05T00:00:00Z')
  );
  assert.equal(totals.subtotal, 2499);
  assert.equal(totals.productSavings, 1000);
  assert.equal(totals.couponDiscount, 250);
  assert.equal(totals.shippingCost, 0);
  assert.equal(totals.tax, Math.round(2249 * 0.12));
  assert.equal(totals.totalAmount, 2249 + Math.round(2249 * 0.12));
});

test('calculateCartTotals charges shipping below 1999 threshold and rejects coupon below min purchase', () => {
  const totals = calculateCartTotals(
    [{ price: 1299, originalPrice: 1599, quantity: 1 }],
    sampleCoupon,
    new Date('2026-11-05T00:00:00Z')
  );
  assert.equal(totals.couponDiscount, 0);
  assert.ok(totals.couponError);
  assert.equal(totals.shippingCost, 149);
});

test('estimateDeliveryByPin validates 6-digit PIN codes and returns metro estimates', () => {
  const bad = estimateDeliveryByPin('123');
  assert.equal(bad.valid, false);

  const mumbai = estimateDeliveryByPin('400001', new Date('2026-11-05T00:00:00Z'));
  assert.equal(mumbai.valid, true);
  assert.equal(mumbai.serviceable, true);
  assert.equal(mumbai.cityZone, 'Mumbai Metro');
  assert.equal(mumbai.codAvailable, true);
});

test('canCancelOrder allows cancellation only before shipping', () => {
  assert.equal(canCancelOrder('Order Placed'), true);
  assert.equal(canCancelOrder('Processing'), true);
  assert.equal(canCancelOrder('Shipped'), false);
  assert.equal(canCancelOrder('Delivered'), false);
});

test('filterAndSortProducts filters by category, size, and price and sorts accurately', () => {
  const mockProducts: Product[] = [
    {
      id: 'p1',
      name: 'AirFlex Runner',
      slug: 'airflex-runner',
      description: 'Lightweight carbon running shoe',
      brand: 'STEPZONE PRO',
      category: 'Running Shoes',
      gender: 'Men',
      images: ['/img1.jpg'],
      price: 2499,
      originalPrice: 3499,
      discount: 29,
      sizes: [
        { size: 8, stock: 5 },
        { size: 9, stock: 0 },
      ],
      colors: [{ name: 'Solar Orange', hex: '#FF5A1F', image: '/img1.jpg' }],
      stock: 5,
      rating: 4.8,
      numReviews: 42,
      isFeatured: true,
      isNewArrival: true,
      createdAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'p2',
      name: 'Urban Street Sneaker',
      slug: 'urban-street-sneaker',
      description: 'Minimalist court leather sneaker',
      brand: 'STEPZONE ORIGINALS',
      category: "Men's Sneakers",
      gender: 'Unisex',
      images: ['/img2.jpg'],
      price: 1999,
      originalPrice: 2499,
      discount: 20,
      sizes: [{ size: 9, stock: 8 }],
      colors: [{ name: 'Chalk White', hex: '#F5F5F5', image: '/img2.jpg' }],
      stock: 8,
      rating: 4.6,
      numReviews: 28,
      isFeatured: false,
      isNewArrival: false,
      createdAt: '2026-09-15T00:00:00Z',
    },
  ];

  const bySize8 = filterAndSortProducts(mockProducts, { size: 8 });
  assert.equal(bySize8.length, 1);
  assert.equal(bySize8[0].id, 'p1');

  const sortedLowToHigh = filterAndSortProducts(mockProducts, { sortBy: 'price_asc' });
  assert.equal(sortedLowToHigh[0].id, 'p2');
  assert.equal(sortedLowToHigh[1].id, 'p1');
});
