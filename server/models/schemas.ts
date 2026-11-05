/**
 * Mongoose Schema Definitions & Collection Blueprints for STEPZONE
 * Defines schemas, indexes, and validation rules for all 9 MongoDB collections:
 * Users, Products, Categories, Cart, Wishlist, Orders, Coupons, Reviews, NewsletterSubscribers.
 */

export const MongooseSchemasBlueprint = {
  UserSchema: {
    collection: 'users',
    fields: {
      name: { type: 'String', required: true, trim: true },
      email: { type: 'String', required: true, unique: true, lowercase: true, index: true },
      phone: { type: 'String', required: true },
      password: { type: 'String', required: true, select: false },
      role: { type: 'String', enum: ['customer', 'admin'], default: 'customer' },
      addresses: [
        {
          id: 'String',
          fullName: 'String',
          phone: 'String',
          email: 'String',
          pinCode: 'String',
          state: 'String',
          city: 'String',
          fullAddress: 'String',
          landmark: 'String',
          isDefault: 'Boolean',
        },
      ],
      resetPasswordToken: { type: 'String', required: false },
      resetPasswordExpires: { type: 'Date', required: false },
      isActive: { type: 'Boolean', default: true },
      createdAt: { type: 'Date', default: 'Date.now' },
    },
  },
  ProductSchema: {
    collection: 'products',
    indexes: [{ slug: 1 }, { category: 1, gender: 1 }, { price: 1 }, { name: 'text', brand: 'text' }],
    fields: {
      name: { type: 'String', required: true, trim: true },
      slug: { type: 'String', required: true, unique: true, index: true },
      description: { type: 'String', required: true },
      brand: { type: 'String', required: true, index: true },
      category: { type: 'String', required: true, index: true },
      gender: { type: 'String', enum: ['Men', 'Women', 'Unisex'], required: true },
      images: [{ type: 'String', required: true }],
      price: { type: 'Number', required: true, min: 0 },
      originalPrice: { type: 'Number', required: true, min: 0 },
      discount: { type: 'Number', default: 0, min: 0, max: 95 },
      sizes: [
        {
          size: { type: 'Number', enum: [6, 7, 8, 9, 10, 11, 12] },
          stock: { type: 'Number', min: 0 },
        },
      ],
      colors: [
        {
          name: 'String',
          hex: 'String',
          image: 'String',
        },
      ],
      stock: { type: 'Number', required: true, min: 0 },
      rating: { type: 'Number', default: 4.5, min: 0, max: 5 },
      numReviews: { type: 'Number', default: 0 },
      isFeatured: { type: 'Boolean', default: false },
      isNewArrival: { type: 'Boolean', default: false },
      isBestSeller: { type: 'Boolean', default: false },
      isDemoData: { type: 'Boolean', default: true },
      createdAt: { type: 'Date', default: 'Date.now' },
    },
  },
  CategorySchema: {
    collection: 'categories',
    fields: {
      name: { type: 'String', required: true, unique: true },
      slug: { type: 'String', required: true, unique: true, index: true },
      description: { type: 'String', required: true },
      image: { type: 'String', required: true },
      isActive: { type: 'Boolean', default: true },
    },
  },
  CartSchema: {
    collection: 'carts',
    fields: {
      user: { type: 'ObjectId', ref: 'User', required: true, unique: true },
      items: [
        {
          id: 'String',
          product: { type: 'ObjectId', ref: 'Product', required: true },
          size: { type: 'Number', required: true },
          color: { type: 'String', required: true },
          quantity: { type: 'Number', required: true, min: 1 },
        },
      ],
    },
  },
  WishlistSchema: {
    collection: 'wishlists',
    fields: {
      user: { type: 'ObjectId', ref: 'User', required: true, unique: true },
      products: [{ type: 'ObjectId', ref: 'Product' }],
    },
  },
  OrderSchema: {
    collection: 'orders',
    indexes: [{ userId: 1, createdAt: -1 }, { orderNumber: 1 }, { orderStatus: 1 }],
    fields: {
      user: { type: 'ObjectId', ref: 'User', required: true },
      items: 'Array',
      shippingAddress: 'Object',
      paymentMethod: { type: 'String', enum: ['Razorpay', 'COD'], required: true },
      paymentStatus: { type: 'String', enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
      paymentDetails: 'Object',
      subtotal: 'Number',
      discount: 'Number',
      shippingCost: 'Number',
      tax: 'Number',
      totalAmount: 'Number',
      orderStatus: {
        type: 'String',
        enum: [
          'Order Placed',
          'Order Confirmed',
          'Processing',
          'Shipped',
          'Out for Delivery',
          'Delivered',
          'Cancelled',
          'Returned',
        ],
        default: 'Order Placed',
      },
      trackingNumber: 'String',
      createdAt: { type: 'Date', default: 'Date.now' },
    },
  },
  CouponSchema: {
    collection: 'coupons',
    fields: {
      code: { type: 'String', required: true, unique: true, uppercase: true },
      discountType: { type: 'String', enum: ['percentage', 'fixed'], required: true },
      discountValue: { type: 'Number', required: true },
      minimumPurchase: { type: 'Number', default: 0 },
      expiryDate: { type: 'Date', required: true },
      usageLimit: { type: 'Number', default: 100 },
      usedCount: { type: 'Number', default: 0 },
      isActive: { type: 'Boolean', default: true },
    },
  },
  ReviewSchema: {
    collection: 'reviews',
    fields: {
      user: { type: 'ObjectId', ref: 'User', required: true },
      product: { type: 'ObjectId', ref: 'Product', required: true },
      rating: { type: 'Number', required: true, min: 1, max: 5 },
      comment: { type: 'String', required: true },
      isApproved: { type: 'Boolean', default: true },
      createdAt: { type: 'Date', default: 'Date.now' },
    },
  },
  NewsletterSubscriberSchema: {
    collection: 'newsletter_subscribers',
    fields: {
      email: { type: 'String', required: true, unique: true, lowercase: true },
      subscribedAt: { type: 'Date', default: 'Date.now' },
      isActive: { type: 'Boolean', default: true },
    },
  },
};
