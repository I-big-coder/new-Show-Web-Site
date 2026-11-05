# STEPZONE — Step Into Your Style

Full-stack Footwear E-Commerce Platform built with React, TypeScript, Tailwind CSS, Express.js, Mongoose schema architecture, JWT Authentication, and Razorpay HMAC-SHA256 payment verification.

## Features
- **Storefront & Catalog**: 20 realistic demonstration footwear products across 9 categories (Men's Sneakers, Women's Shoes, Running Shoes, Sports Shoes, Casual Shoes, Formal Shoes, Training Shoes, Limited Edition Sneakers, Sandals).
- **Filtering & Search**: Filter by keyword, category, gender, UK shoe size (6–12), brand, colorway, max price, discount, customer rating, and stock availability.
- **Product Details**: Interactive colorway switcher, UK 6–12 size selector with live stock counts, UK/US/EU/CM Size Guide modal, 6-digit Indian PIN code delivery estimator, technical specifications, and verified customer reviews.
- **Shopping Cart & Coupons**: Persistent cart and slide-over bag drawer, coupon validation (`STEP10`, `FIRST500`, `RUNNER15`), free shipping threshold (`₹1,999`), and 12% GST calculation.
- **Checkout & Payments**: 3-step checkout with saved addresses, official Razorpay order creation (`/api/payments/create-order`) + server-side HMAC-SHA256 signature verification (`/api/payments/verify`), and Cash on Delivery (COD).
- **Customer Account & Order Tracking**: JWT authentication, password reset token workflow, 8-status Order Tracking timeline, and eligible pre-dispatch cancellation.
- **Admin Console**: Revenue & monthly sales analytics, product CRUD, category CRUD, order fulfillment status control, customer management, coupon management, and review moderation.

## Quick Start
```bash
npm install
npm run seed
npm run dev
```

## Demo Credentials
- **Customer**: `arjun@stepzone.in` / `Customer@123`
- **Admin**: `admin@stepzone.in` / `Admin@123`
