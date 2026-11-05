import fs from 'fs';
import path from 'path';
import type { CartItem, Category, Coupon, Order, Product, Review, User } from '../src/types';
import {
  SEED_CATEGORIES,
  SEED_COUPONS,
  SEED_ORDERS,
  SEED_PRODUCTS,
  SEED_REVIEWS,
  SEED_USERS,
} from './seedData';

export interface StoredUser extends User {
  passwordHash: string;
  resetToken?: string;
  resetTokenExpiry?: number;
}

export interface NewsletterSubscriber {
  email: string;
  subscribedAt: string;
  isActive: boolean;
}

export interface DatabaseSchema {
  users: StoredUser[];
  products: Product[];
  categories: Category[];
  carts: Record<string, CartItem[]>; // keyed by userId
  wishlists: Record<string, string[]>; // keyed by userId -> productId[]
  orders: Order[];
  coupons: Coupon[];
  reviews: Review[];
  newsletter: NewsletterSubscriber[];
  razorpayOrders: Record<
    string,
    { id: string; amount: number; currency: string; receipt: string; createdAt: string }
  >;
}

const DB_FILE_PATH = path.resolve(process.cwd(), '.stepzone-db.json');

function createInitialDb(): DatabaseSchema {
  return {
    users: structuredClone(SEED_USERS),
    products: structuredClone(SEED_PRODUCTS),
    categories: structuredClone(SEED_CATEGORIES),
    carts: {
      'user-cust-1': [],
    },
    wishlists: {
      'user-cust-1': ['prod-1', 'prod-7'],
    },
    orders: structuredClone(SEED_ORDERS),
    coupons: structuredClone(SEED_COUPONS),
    reviews: structuredClone(SEED_REVIEWS),
    newsletter: [
      {
        email: 'arjun@stepzone.in',
        subscribedAt: '2026-06-15T11:30:00.000Z',
        isActive: true,
      },
    ],
    razorpayOrders: {},
  };
}

let dbInstance: DatabaseSchema | null = null;

export function getDb(): DatabaseSchema {
  if (dbInstance) return dbInstance;
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      if (parsed && Array.isArray(parsed.products) && parsed.products.length >= 20) {
        dbInstance = parsed;
        return dbInstance;
      }
    }
  } catch {
    // Fallback to fresh seed if corrupted
  }
  dbInstance = createInitialDb();
  saveDb();
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dbInstance, null, 2), 'utf8');
  } catch {
    // Ignore read-only fs errors in restricted environments
  }
}

export function resetAndSeedDb(): DatabaseSchema {
  dbInstance = createInitialDb();
  saveDb();
  return dbInstance;
}
