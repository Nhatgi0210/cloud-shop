import { mutation, query } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { requireAdmin, requireUser } from './auth';
import { orderStatus } from './schema';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const orders =
      user.role === 'admin'
        ? await ctx.db.query('orders').order('desc').take(100)
        : await ctx.db
            .query('orders')
            .withIndex('by_userId', (q) => q.eq('userId', user._id))
            .order('desc')
            .take(100);
    return Promise.all(
      orders.map(async (order) => ({
        ...order,
        items: await ctx.db
          .query('orderItems')
          .withIndex('by_orderId', (q) => q.eq('orderId', order._id))
          .take(100),
      })),
    );
  },
});

export const place = mutation({
  args: {
    shippingName: v.string(),
    shippingPhone: v.string(),
    shippingAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const shippingName = args.shippingName.trim(),
      shippingPhone = args.shippingPhone.trim(),
      shippingAddress = args.shippingAddress.trim();
    if (
      shippingName.length < 2 ||
      shippingName.length > 100 ||
      !/^(\+84|0)[0-9]{9,10}$/.test(shippingPhone) ||
      shippingAddress.length < 10 ||
      shippingAddress.length > 500
    )
      throw new ConvexError(
        'Kiểm tra họ tên, số điện thoại và địa chỉ giao hàng.',
      );
    const cart = await ctx.db
      .query('cartItems')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .take(100);
    if (!cart.length) throw new ConvexError('Giỏ hàng trống.');
    let totalAmount = 0;
    const lines = [];
    for (const item of cart) {
      const variant = await ctx.db.get(item.variantId);
      const product = variant ? await ctx.db.get(variant.productId) : null;
      const stock =
        variant?.sizes.find((s) => s.size === item.size)?.stock ?? 0;
      if (!variant?.isActive || !product?.isActive || item.quantity > stock)
        throw new ConvexError(
          'Sản phẩm hết hàng hoặc ngừng bán. Vui lòng kiểm tra giỏ hàng.',
        );
      totalAmount += variant.price * item.quantity;
      lines.push({
        productId: product._id,
        variantId: variant._id,
        productName: product.name,
        variantName: variant.name,
        size: item.size,
        unitPrice: variant.price,
        quantity: item.quantity,
      });
      await ctx.db.patch(variant._id, {
        sizes: variant.sizes.map((s) =>
          s.size === item.size ? { ...s, stock: s.stock - item.quantity } : s,
        ),
        sold: variant.sold + item.quantity,
      });
      await ctx.db.delete(item._id);
    }
    const orderId = await ctx.db.insert('orders', {
      userId: user._id,
      status: 'pending',
      paymentMethod: 'cod',
      paymentStatus: 'unpaid',
      totalAmount,
      shippingName,
      shippingPhone,
      shippingAddress,
    });
    for (const line of lines)
      await ctx.db.insert('orderItems', { ...line, orderId });
    return orderId;
  },
});

export const cancel = mutation({
  args: { id: v.id('orders') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const order = await ctx.db.get(args.id);
    if (!order || (order.userId !== user._id && user.role !== 'admin'))
      throw new ConvexError('Không tìm thấy đơn hàng.');
    if (order.status !== 'pending')
      throw new ConvexError('Chỉ có thể hủy đơn đang chờ xác nhận.');
    const items = await ctx.db
      .query('orderItems')
      .withIndex('by_orderId', (q) => q.eq('orderId', order._id))
      .take(100);
    for (const item of items) {
      const variant = await ctx.db.get(item.variantId);
      if (!variant)
        throw new ConvexError('Không thể hoàn kho: biến thể không tồn tại.');
      const entries = variant.sizes.some((s) => s.size === item.size)
        ? variant.sizes.map((s) =>
            s.size === item.size ? { ...s, stock: s.stock + item.quantity } : s,
          )
        : [...variant.sizes, { size: item.size, stock: item.quantity }];
      await ctx.db.patch(variant._id, {
        sizes: entries,
        sold: Math.max(0, variant.sold - item.quantity),
      });
    }
    await ctx.db.patch(order._id, { status: 'cancelled' });
  },
});

export const updateStatus = mutation({
  args: { id: v.id('orders'), status: orderStatus },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.id);
    const next = {
      pending: 'confirmed',
      confirmed: 'shipping',
      shipping: 'delivered',
      delivered: '',
      cancelled: '',
    };
    if (!order || next[order.status] !== args.status)
      throw new ConvexError('Trạng thái chuyển tiếp không hợp lệ.');
    await ctx.db.patch(order._id, {
      status: args.status,
      paymentStatus: args.status === 'delivered' ? 'paid' : order.paymentStatus,
    });
  },
});
