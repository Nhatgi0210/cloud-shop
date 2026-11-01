import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server';
import { v } from 'convex/values';
import {
  definedFields,
  optionalCategory,
  optionalText,
  requirePrice,
  requireText,
} from './shared.helpers';

export const list = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const search = optionalText(args.search);
    const category = optionalCategory(args.category);

    if (search && category) {
      return await ctx.db
        .query('products')
        .withSearchIndex('search_name', (q) =>
          q.search('name', search).eq('category', category),
        )
        .collect();
    }

    if (search) {
      return await ctx.db
        .query('products')
        .withSearchIndex('search_name', (q) => q.search('name', search))
        .collect();
    }

    if (category) {
      return await ctx.db
        .query('products')
        .withIndex('by_category', (q) => q.eq('category', category))
        .collect();
    }

    return await ctx.db.query('products').order('desc').collect();
  },
});

export const getById = query({
  args: { id: v.id('products') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    price: v.number(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    size: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert(
      'products',
      definedFields({
        name: requireText(args.name, 'Product name'),
        price: requirePrice(args.price),
        description: requireText(args.description, 'Description'),
        imageUrl: optionalText(args.imageUrl),
        category: optionalCategory(args.category),
        size: optionalText(args.size),
        color: optionalText(args.color),
      }),
    );
  },
});

export const update = mutation({
  args: {
    id: v.id('products'),
    name: v.optional(v.string()),
    price: v.optional(v.number()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    size: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Product not found');
    }

    const patch: {
      name?: string;
      price?: number;
      description?: string;
      imageUrl?: string;
      category?: string;
      size?: string;
      color?: string;
    } = {};

    if (args.name !== undefined) {
      patch.name = requireText(args.name, 'Product name');
    }
    if (args.price !== undefined) {
      patch.price = requirePrice(args.price);
    }
    if (args.description !== undefined) {
      patch.description = requireText(args.description, 'Description');
    }
    if (args.imageUrl !== undefined) {
      const imageUrl = optionalText(args.imageUrl);
      if (imageUrl !== undefined) {
        patch.imageUrl = imageUrl;
      }
    }
    if (args.category !== undefined) {
      const category = optionalCategory(args.category);
      if (category !== undefined) {
        patch.category = category;
      }
    }
    if (args.size !== undefined) {
      const size = optionalText(args.size);
      if (size !== undefined) {
        patch.size = size;
      }
    }
    if (args.color !== undefined) {
      const color = optionalText(args.color);
      if (color !== undefined) {
        patch.color = color;
      }
    }

    await ctx.db.patch(args.id, patch);
    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: { id: v.id('products') },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Product not found');
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});
