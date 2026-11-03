import { internalMutation } from './_generated/server';
import { demoProducts } from './catalog';

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (await ctx.db.query('products').first())
      throw new Error('Database đã có sản phẩm; seed không ghi đè dữ liệu.');
    for (const item of demoProducts) {
      const slug = item.category.toLowerCase();
      const existing = await ctx.db
        .query('categories')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .unique();
      const categoryId =
        existing?._id ??
        (await ctx.db.insert('categories', { name: item.category, slug }));
      const productId = await ctx.db.insert('products', {
        name: item.name,
        brand: item.brand,
        description: item.description,
        categoryId,
        isActive: true,
        isFeatured: true,
      });
      for (const variant of item.variants) {
        await ctx.db.insert('productVariants', {
          ...variant,
          productId,
          isActive: true,
          sizes: [38, 39, 40, 41, 42, 43, 44].map((size) => ({
            size,
            stock: size === 39 ? 0 : 5,
          })),
        });
      }
    }
    return 'Đã tạo 4 mẫu giày và 7 biến thể.';
  },
});
