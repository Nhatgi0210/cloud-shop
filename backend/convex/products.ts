import { mutation, query } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { requireAdmin } from './auth';
import { sizes } from './schema';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query('products')
      .withIndex('by_isActive', (q) => q.eq('isActive', true))
      .take(100);
    return Promise.all(
      products.map(async (product) => ({
        ...product,
        category: (await ctx.db.get(product.categoryId))?.name ?? 'Giày',
        variants: (
          await ctx.db
            .query('productVariants')
            .withIndex('by_productId', (q) => q.eq('productId', product._id))
            .take(30)
        ).filter((variant) => variant.isActive),
      })),
    );
  },
});

export const categories = query({
  args: {},
  handler: (ctx) => ctx.db.query('categories').take(50),
});

export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const products = await ctx.db.query('products').order('desc').take(100);
    return Promise.all(
      products.map(async (product) => ({
        ...product,
        category: (await ctx.db.get(product.categoryId))?.name ?? 'Giày',
        variants: await ctx.db
          .query('productVariants')
          .withIndex('by_productId', (q) => q.eq('productId', product._id))
          .take(30),
      })),
    );
  },
});

export const restore = mutation({
  args: { id: v.id('products') },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    if (!(await ctx.db.get(id)))
      throw new ConvexError('Sản phẩm không tồn tại.');
    await ctx.db.patch(id, { isActive: true });
  },
});
export const createCategory = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = args.name.trim();
    if (!name || name.length > 80)
      throw new ConvexError('Tên danh mục phải có 1–80 ký tự.');
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!slug) throw new ConvexError('Tên danh mục không hợp lệ.');
    if (
      await ctx.db
        .query('categories')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .unique()
    )
      throw new ConvexError('Danh mục đã tồn tại.');
    return ctx.db.insert('categories', { name, slug });
  },
});

export const addVariant = mutation({
  args: {
    productId: v.id('products'),
    name: v.string(),
    price: v.number(),
    imageUrl: v.string(),
    sizes,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!(await ctx.db.get(args.productId)))
      throw new ConvexError('Sản phẩm không tồn tại.');
    if (
      !args.name.trim() ||
      !args.imageUrl.startsWith('https://') ||
      !Number.isSafeInteger(args.price) ||
      args.price < 0
    )
      throw new ConvexError('Kiểm tra tên, ảnh HTTPS và giá biến thể.');
    validateSizes(args.sizes);
    const existing = await ctx.db
      .query('productVariants')
      .withIndex('by_productId', (q) => q.eq('productId', args.productId))
      .take(30);
    if (existing.length >= 20)
      throw new ConvexError('Mỗi sản phẩm tối đa 20 biến thể trong bản demo.');
    return ctx.db.insert('productVariants', {
      ...args,
      name: args.name.trim(),
      sold: 0,
      isActive: true,
    });
  },
});

export const updateMetadata = mutation({
  args: {
    id: v.id('products'),
    name: v.string(),
    brand: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!args.name.trim() || !args.brand.trim() || !args.description.trim())
      throw new ConvexError('Nhập đầy đủ thông tin sản phẩm.');
    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      brand: args.brand.trim(),
      description: args.description.trim(),
    });
  },
});
export const create = mutation({
  args: {
    name: v.string(),
    brand: v.string(),
    description: v.string(),
    categoryId: v.id('categories'),
    variantName: v.string(),
    price: v.number(),
    imageUrl: v.string(),
    sizes,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!args.name.trim() || !args.brand.trim() || !args.variantName.trim())
      throw new ConvexError('Nhập đầy đủ tên, thương hiệu và biến thể.');
    if (!Number.isSafeInteger(args.price) || args.price < 0)
      throw new ConvexError('Giá VND phải là số nguyên không âm.');
    if (!(await ctx.db.get(args.categoryId)))
      throw new ConvexError('Danh mục không tồn tại.');
    validateSizes(args.sizes);
    if (!args.imageUrl.startsWith('https://'))
      throw new ConvexError('Ảnh phải dùng URL HTTPS.');
    const id = await ctx.db.insert('products', {
      name: args.name.trim(),
      brand: args.brand.trim(),
      description: args.description.trim(),
      categoryId: args.categoryId,
      isActive: true,
      isFeatured: false,
    });
    await ctx.db.insert('productVariants', {
      productId: id,
      name: args.variantName.trim(),
      price: args.price,
      imageUrl: args.imageUrl,
      sizes: args.sizes,
      sold: 0,
      isActive: true,
    });
    return id;
  },
});

export function validateSizes(items: { size: number; stock: number }[]) {
  if (
    !items.length ||
    items.length > 30 ||
    new Set(items.map((i) => i.size)).size !== items.length ||
    items.some(
      (i) =>
        !Number.isSafeInteger(i.size) ||
        i.size < 20 ||
        i.size > 55 ||
        !Number.isSafeInteger(i.stock) ||
        i.stock < 0,
    )
  )
    throw new ConvexError(
      'Size phải duy nhất, trong khoảng 20–55; tồn kho là số nguyên không âm.',
    );
}

export const updateVariant = mutation({
  args: {
    id: v.id('productVariants'),
    price: v.number(),
    sizes,
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!Number.isSafeInteger(args.price) || args.price < 0)
      throw new ConvexError('Giá không hợp lệ.');
    validateSizes(args.sizes);
    if (args.name !== undefined && !args.name.trim())
      throw new ConvexError('Tên biến thể không được trống.');
    if (args.imageUrl !== undefined && !args.imageUrl.startsWith('https://'))
      throw new ConvexError('Ảnh phải dùng HTTPS.');
    await ctx.db.patch(args.id, {
      price: args.price,
      sizes: args.sizes,
      ...(args.name !== undefined ? { name: args.name.trim() } : {}),
      ...(args.imageUrl !== undefined ? { imageUrl: args.imageUrl } : {}),
    });
  },
});

export const hide = mutation({
  args: { id: v.id('products') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { isActive: false });
  },
});
