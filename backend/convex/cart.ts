import { mutation, query } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { requireUser } from './auth';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query('cartItems')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .take(100);
    return Promise.all(
      rows.map(async (row) => {
        const variant = await ctx.db.get(row.variantId);
        const product = variant ? await ctx.db.get(variant.productId) : null;
        return { ...row, variant, product };
      }),
    );
  },
});

export const add = mutation({
  args: {
    variantId: v.id('productVariants'),
    size: v.number(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!Number.isSafeInteger(args.quantity) || args.quantity < 1)
      throw new ConvexError('Số lượng không hợp lệ.');
    const variant = await ctx.db.get(args.variantId);
    const product = variant ? await ctx.db.get(variant.productId) : null;
    if (!variant?.isActive || !product?.isActive)
      throw new ConvexError('Sản phẩm ngừng bán.');
    const existing = await ctx.db
      .query('cartItems')
      .withIndex('by_userId_and_variantId_and_size', (q) =>
        q
          .eq('userId', user._id)
          .eq('variantId', args.variantId)
          .eq('size', args.size),
      )
      .unique();
    const quantity = (existing?.quantity ?? 0) + args.quantity;
    if (
      (variant.sizes.find((s) => s.size === args.size)?.stock ?? 0) < quantity
    )
      throw new ConvexError('Size đã hết hoặc không đủ hàng.');
    if (existing) return ctx.db.patch(existing._id, { quantity });
    const rows = await ctx.db
      .query('cartItems')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .take(100);
    if (rows.length >= 50) throw new ConvexError('Giỏ hàng tối đa 50 dòng.');
    await ctx.db.insert('cartItems', { userId: user._id, ...args });
  },
});

export const remove = mutation({
  args: { id: v.id('cartItems') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const item = await ctx.db.get(args.id);
    if (!item || item.userId !== user._id)
      throw new ConvexError('Không tìm thấy mục trong giỏ hàng.');
    await ctx.db.delete(item._id);
  },
});

export const setQuantity = mutation({
  args: { id: v.id('cartItems'), quantity: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const item = await ctx.db.get(args.id);
    if (!item || item.userId !== user._id)
      throw new ConvexError('Không tìm thấy mục trong giỏ hàng.');
    const variant = await ctx.db.get(item.variantId);
    if (
      !Number.isSafeInteger(args.quantity) ||
      args.quantity < 1 ||
      args.quantity >
        (variant?.sizes.find((s) => s.size === item.size)?.stock ?? 0)
    )
      throw new ConvexError('Số lượng vượt tồn kho hoặc không hợp lệ.');
    await ctx.db.patch(item._id, { quantity: args.quantity });
  },
});
