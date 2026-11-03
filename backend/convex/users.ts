import { mutation, query, internalMutation, env } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { currentUser, requireUser, requireAdmin } from './auth';

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query('users').order('desc').take(100);
    return users.map(({ _id, _creationTime, name, email, role }) => ({
      _id,
      _creationTime,
      name,
      email,
      role,
    }));
  },
});

export const updateRole = mutation({
  args: {
    id: v.id('users'),
    role: v.union(v.literal('admin'), v.literal('customer')),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (args.id === admin._id)
      throw new ConvexError('Không thể tự thay đổi quyền của chính mình.');
    const user = await ctx.db.get(args.id);
    if (!user) throw new ConvexError('Người dùng không tồn tại.');
    if (user.role === args.role) return;
    await ctx.db.patch(user._id, {
      role: args.role,
      sessionVersion: (user.sessionVersion ?? 0) + 1,
    });
  },
});

function requireBackend(secret: string) {
  if (!env.NEST_AUTH_SECRET || secret !== env.NEST_AUTH_SECRET)
    throw new ConvexError('Không có quyền truy cập.');
}
export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    if (!user) return null;
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
});
// Credential hashes are available only to the trusted Nest server.
export const findForLogin = query({
  args: { secret: v.string(), email: v.string() },
  handler: async (ctx, { secret, email }) => {
    requireBackend(secret);
    return ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email.trim().toLowerCase()))
      .unique();
  },
});
export const register = mutation({
  args: {
    secret: v.string(),
    subject: v.string(),
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    requireBackend(args.secret);
    const email = args.email.trim().toLowerCase();
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      !args.name.trim() ||
      args.name.trim().length > 100 ||
      !args.passwordHash.startsWith('scrypt$') ||
      !/^[0-9a-f-]{36}$/.test(args.subject)
    )
      throw new ConvexError('Thông tin tài khoản không hợp lệ.');
    if (
      await ctx.db
        .query('users')
        .withIndex('by_email', (q) => q.eq('email', email))
        .unique()
    )
      throw new ConvexError('Email đã được đăng ký.');
    const id = await ctx.db.insert('users', {
      tokenIdentifier: `https://cloudkicks.local|${args.subject}`,
      name: args.name.trim(),
      email,
      passwordHash: args.passwordHash,
      role: 'customer',
      sessionVersion: 0,
    });
    return ctx.db.get(id);
  },
});
export const logout = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    await ctx.db.patch(user._id, {
      sessionVersion: (user.sessionVersion ?? 0) + 1,
    });
  },
});
export const setAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email.trim().toLowerCase()))
      .unique();
    if (!user) throw new ConvexError('Đăng ký tài khoản trước khi cấp quyền.');
    await ctx.db.patch(user._id, { role: 'admin' });
  },
});
