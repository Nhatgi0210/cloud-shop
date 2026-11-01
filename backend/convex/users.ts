import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server';
import { v } from 'convex/values';
import { requireText } from './shared.helpers';

const role = v.union(v.literal('admin'), v.literal('user'));

export const findByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique();
  },
});

export const getById = query({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    role,
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!email.includes('@')) {
      throw new Error('Email is invalid');
    }
    requireText(args.passwordHash, 'Password hash');

    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique();
    if (existing) {
      throw new Error('Email already exists');
    }

    return await ctx.db.insert('users', {
      email,
      passwordHash: args.passwordHash,
      role: args.role,
      createdAt: Date.now(),
    });
  },
});
