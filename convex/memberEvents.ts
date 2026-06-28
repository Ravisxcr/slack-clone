import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import { query } from './_generated/server';

export const getByWorkspace = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) return [];

    const member = await ctx.db
      .query('members')
      .withIndex('by_workspace_id_user_id', (q) => q.eq('workspaceId', args.workspaceId).eq('userId', userId))
      .unique();

    if (!member) return [];

    return await ctx.db
      .query('memberEvents')
      .withIndex('by_workspace_id', (q) => q.eq('workspaceId', args.workspaceId))
      .order('desc')
      .collect();
  },
});
