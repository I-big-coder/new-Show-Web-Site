import { resetAndSeedDb } from './db';

const db = resetAndSeedDb();
console.log(
  `[STEPZONE Seed] Successfully seeded ${db.products.length} products, ${db.categories.length} categories, ${db.coupons.length} coupons, ${db.users.length} users, and ${db.orders.length} sample orders.`
);
