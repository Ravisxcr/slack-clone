import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { type QueryCtx, mutation } from './_generated/server';

const extractPlainText = (body: string): string => {
  try {
    const delta = JSON.parse(body) as { ops?: Array<{ insert?: string | object }> };
    if (!delta.ops || !Array.isArray(delta.ops)) return body;
    return delta.ops
      .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
      .join('')
      .replace(/\n+$/, '')
      .trim();
  } catch {
    return body;
  }
};

const getMember = async (ctx: QueryCtx, workspaceId: Id<'workspaces'>, userId: Id<'users'>) => {
  return await ctx.db
    .query('members')
    .withIndex('by_workspace_id_user_id', (q) => q.eq('workspaceId', workspaceId).eq('userId', userId))
    .unique();
};

export const toggle = mutation({
  args: {
    messageId: v.id('messages'),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error('Unauthorized.');

    const message = await ctx.db.get(args.messageId);

    if (!message) throw new Error('Message not found.');

    const member = await getMember(ctx, message.workspaceId, userId);

    if (!member) throw new Error('Unauthorized.');

    const existingMessageReactionFromUser = await ctx.db
      .query('reactions')
      .filter((q) =>
        q.and(q.eq(q.field('messageId'), args.messageId), q.eq(q.field('memberId'), member._id), q.eq(q.field('value'), args.value)),
      )
      .first();

    if (existingMessageReactionFromUser) {
      await ctx.db.delete(existingMessageReactionFromUser._id);

      return existingMessageReactionFromUser._id;
    } else {
      const newReactionId = await ctx.db.insert('reactions', {
        value: args.value,
        memberId: member._id,
        messageId: message._id,
        workspaceId: message.workspaceId,
      });

      // Notify the message author when someone else reacts
      const messageAuthor = await ctx.db.get(message.memberId);
      if (messageAuthor && messageAuthor.userId !== userId) {
        const reactor = await ctx.db.get(userId);
        const channel = message.channelId ? await ctx.db.get(message.channelId) : null;
        const preview = extractPlainText(message.body).slice(0, 100) || undefined;

        await ctx.db.insert('activityEvents', {
          workspaceId: message.workspaceId,
          targetUserId: messageAuthor.userId,
          actorName: reactor?.name ?? 'Unknown',
          actorImage: reactor?.image ?? undefined,
          action: 'emoji_reaction',
          channelId: message.channelId,
          channelName: channel?.name,
          parentMessageId: message.parentMessageId,
          messagePreview: preview,
          emoji: args.value,
          isRead: false,
        });
      }

      return newReactionId;
    }
  },
});
