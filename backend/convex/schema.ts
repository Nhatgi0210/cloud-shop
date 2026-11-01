import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const orderItemFields = {
  productId: v.string(),
  name: v.string(),
  price: v.number(),
  quantity: v.number(),
  size: v.optional(v.string()),
  color: v.optional(v.string()),
};

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal('admin'), v.literal('user')),
    createdAt: v.number(),
  }).index('by_email', ['email']),

  products: defineTable({
    name: v.string(),
    price: v.number(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    size: v.optional(v.string()),
    color: v.optional(v.string()),
  })
    .index('by_category', ['category'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['category'],
    }),

  orders: defineTable({
    userId: v.optional(v.string()),
    items: v.array(v.object(orderItemFields)),
    totalPrice: v.number(),
    status: v.string(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),
});
