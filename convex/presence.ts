import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const getMyPresence = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const presence = await ctx.db
      .query('userPresence')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .unique();
    if (!presence) return { availability: 'active' as const, customStatus: null, customStatusExpiry: null };
    const now = Date.now();
    const statusExpired = presence.customStatusExpiry != null && presence.customStatusExpiry < now;
    return {
      availability: presence.availability,
      customStatus: statusExpired ? null : (presence.customStatus ?? null),
      customStatusExpiry: statusExpired ? null : (presence.customStatusExpiry ?? null),
    };
  },
});

export const getUserPresenceByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const presence = await ctx.db
      .query('userPresence')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .unique();
    if (!presence) return { availability: 'active' as const, customStatus: null };
    const now = Date.now();
    const statusExpired = presence.customStatusExpiry != null && presence.customStatusExpiry < now;
    return {
      availability: presence.availability,
      customStatus: statusExpired ? null : (presence.customStatus ?? null),
    };
  },
});

export const setPresence = mutation({
  args: {
    availability: v.union(v.literal('active'), v.literal('away'), v.literal('dnd')),
    customStatus: v.optional(v.string()),
    customStatusExpiry: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Unauthorized.');

    const existing = await ctx.db
      .query('userPresence')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        availability: args.availability,
        customStatus: args.customStatus,
        customStatusExpiry: args.customStatusExpiry,
      });
    } else {
      await ctx.db.insert('userPresence', {
        userId,
        availability: args.availability,
        customStatus: args.customStatus,
        customStatusExpiry: args.customStatusExpiry,
      });
    }
  },
});
