import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const sizes = v.array(v.object({ size: v.number(), stock: v.number() }));
export const orderStatus = v.union(
  v.literal('pending'),
  v.literal('confirmed'),
  v.literal('shipping'),
  v.literal('delivered'),
  v.literal('cancelled'),
);

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    passwordHash: v.optional(v.string()),
    sessionVersion: v.optional(v.number()),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal('admin'), v.literal('customer')),
  })
    .index('by_tokenIdentifier', ['tokenIdentifier'])
    .index('by_email', ['email']),
  categories: defineTable({ name: v.string(), slug: v.string() }).index(
    'by_slug',
    ['slug'],
  ),
  products: defineTable({
    name: v.string(),
    brand: v.string(),
    description: v.string(),
    categoryId: v.id('categories'),
    isActive: v.boolean(),
    isFeatured: v.boolean(),
  }).index('by_isActive', ['isActive']),
  productVariants: defineTable({
    productId: v.id('products'),
    name: v.string(),
    price: v.number(),
    imageUrl: v.string(),
    sizes,
    sold: v.number(),
    isActive: v.boolean(),
  }).index('by_productId', ['productId']),
  cartItems: defineTable({
    userId: v.id('users'),
    variantId: v.id('productVariants'),
    size: v.number(),
    quantity: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_userId_and_variantId_and_size', ['userId', 'variantId', 'size']),
  orders: defineTable({
    userId: v.id('users'),
    status: orderStatus,
    paymentMethod: v.literal('cod'),
    paymentStatus: v.union(v.literal('unpaid'), v.literal('paid')),
    totalAmount: v.number(),
    shippingName: v.string(),
    shippingPhone: v.string(),
    shippingAddress: v.string(),
  }).index('by_userId', ['userId']),
  orderItems: defineTable({
    orderId: v.id('orders'),
    productId: v.id('products'),
    variantId: v.id('productVariants'),
    productName: v.string(),
    variantName: v.string(),
    size: v.number(),
    unitPrice: v.number(),
    quantity: v.number(),
  }).index('by_orderId', ['orderId']),
});
