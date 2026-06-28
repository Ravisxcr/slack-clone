import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const createOrGet = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    memberId: v.id('members'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error('Unauthorized.');

    const currentMember = await ctx.db
      .query('members')
      .withIndex('by_workspace_id_user_id', (q) => q.eq('workspaceId', args.workspaceId).eq('userId', userId))
      .unique();

    const otherMember = await ctx.db.get(args.memberId);

    if (!currentMember || !otherMember) throw new Error('Member not found.');

    const existingConversation = await ctx.db
      .query('conversations')
      .filter((q) => q.eq(q.field('workspaceId'), args.workspaceId))
      .filter((q) =>
        q.or(
          q.and(q.eq(q.field('memberOneId'), currentMember._id), q.eq(q.field('memberTwoId'), otherMember._id)),
          q.and(q.eq(q.field('memberOneId'), otherMember._id), q.eq(q.field('memberTwoId'), currentMember._id)),
        ),
      )
      .unique();

    if (existingConversation) return existingConversation._id;

    const conversationId = await ctx.db.insert('conversations', {
      workspaceId: args.workspaceId,
      memberOneId: currentMember._id,
      memberTwoId: otherMember._id,
    });

    return conversationId;
  },
});

export const getAllForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query('members')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .collect();

    const activeMemberships = memberships.filter((m) => m.status !== 'disabled');
    const results = [];

    for (const membership of activeMemberships) {
      const workspace = await ctx.db.get(membership.workspaceId);
      if (!workspace) continue;

      const conversations = await ctx.db
        .query('conversations')
        .withIndex('by_workspace_id', (q) => q.eq('workspaceId', membership.workspaceId))
        .collect();

      for (const conv of conversations) {
        if (conv.memberOneId !== membership._id && conv.memberTwoId !== membership._id) continue;

        const otherMemberId = conv.memberOneId === membership._id ? conv.memberTwoId : conv.memberOneId;
        const otherMember = await ctx.db.get(otherMemberId);
        if (!otherMember) continue;

        const otherUser = await ctx.db.get(otherMember.userId);
        if (!otherUser) continue;

        const lastMessage = await ctx.db
          .query('messages')
          .withIndex('by_conversation_id', (q) => q.eq('conversationId', conv._id))
          .order('desc')
          .first();

        const lastReadTime = conv.lastRead?.[membership._id] ?? 0;
        const isUnread =
          lastMessage !== null &&
          lastMessage._creationTime > lastReadTime &&
          lastMessage.memberId !== membership._id;

        results.push({
          conversationId: conv._id,
          workspaceId: membership.workspaceId,
          workspaceName: workspace.name,
          otherMemberId: otherMember._id,
          otherUserName: otherUser.name ?? 'Unknown',
          otherUserImage: otherUser.image,
          lastMessage: lastMessage
            ? {
                body: lastMessage.body,
                createdAt: lastMessage._creationTime,
                isMine: lastMessage.memberId === membership._id,
              }
            : null,
          isUnread,
        });
      }
    }

    results.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? 0;
      const bTime = b.lastMessage?.createdAt ?? 0;
      return bTime - aTime;
    });

    return results;
  },
});

export const getUnreadDmCountGlobal = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const memberships = await ctx.db
      .query('members')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .collect();

    const activeMemberships = memberships.filter((m) => m.status !== 'disabled');
    let total = 0;

    for (const membership of activeMemberships) {
      const conversations = await ctx.db
        .query('conversations')
        .withIndex('by_workspace_id', (q) => q.eq('workspaceId', membership.workspaceId))
        .collect();

      for (const conv of conversations) {
        if (conv.memberOneId !== membership._id && conv.memberTwoId !== membership._id) continue;

        const lastReadTime = conv.lastRead?.[membership._id] ?? 0;

        const unread = await ctx.db
          .query('messages')
          .withIndex('by_conversation_id', (q) => q.eq('conversationId', conv._id))
          .filter((q) =>
            q.and(
              q.gt(q.field('_creationTime'), lastReadTime),
              q.neq(q.field('memberId'), membership._id),
            ),
          )
          .collect();

        total += unread.length;
      }
    }

    return total;
  },
});
