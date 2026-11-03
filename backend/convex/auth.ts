import { ConvexError } from 'convex/values';
import type { MutationCtx, QueryCtx } from './_generated/server';

export async function currentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const user = await ctx.db
    .query('users')
    .withIndex('by_tokenIdentifier', (q) =>
      q.eq('tokenIdentifier', identity.tokenIdentifier),
    )
    .unique();
  if (!user || (identity.sessionVersion ?? 0) !== (user.sessionVersion ?? 0))
    return null;
  return user;
}

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await currentUser(ctx);
  if (!user)
    throw new ConvexError('Vui lòng đăng nhập và chờ đồng bộ tài khoản.');
  return user;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await requireUser(ctx);
  if (user.role !== 'admin')
    throw new ConvexError('Bạn không có quyền quản trị.');
  return user;
}
