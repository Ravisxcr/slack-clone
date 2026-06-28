import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const getForCurrentUser = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const member = await ctx.db
      .query('members')
      .withIndex('by_workspace_id_user_id', (q) =>
        q.eq('workspaceId', args.workspaceId).eq('userId', userId),
      )
      .first();

    if (!member) return [];

    return await ctx.db
      .query('activityEvents')
      .withIndex('by_workspace_and_target', (q) =>
        q.eq('workspaceId', args.workspaceId).eq('targetUserId', userId),
      )
      .order('desc')
      .collect();
  },
});

export const getUnreadCount = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const events = await ctx.db
      .query('activityEvents')
      .withIndex('by_workspace_and_target', (q) =>
        q.eq('workspaceId', args.workspaceId).eq('targetUserId', userId),
      )
      .collect();

    return events.filter((e) => !e.isRead).length;
  },
});

export const markAllRead = mutation({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const unread = await ctx.db
      .query('activityEvents')
      .withIndex('by_workspace_and_target', (q) =>
        q.eq('workspaceId', args.workspaceId).eq('targetUserId', userId),
      )
      .filter((q) => q.eq(q.field('isRead'), false))
      .collect();

    await Promise.all(unread.map((e) => ctx.db.patch(e._id, { isRead: true })));
  },
});
