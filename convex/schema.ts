import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const schema = defineSchema({
  ...authTables,
  workspaces: defineTable({
    name: v.string(),
    userId: v.id('users'),
    joinCode: v.string(),
  }),
  members: defineTable({
    userId: v.id('users'),
    workspaceId: v.id('workspaces'),
    role: v.union(v.literal('admin'), v.literal('member')),
    status: v.optional(v.union(v.literal('active'), v.literal('disabled'))),
  })
    .index('by_user_id', ['userId'])
    .index('by_workspace_id', ['workspaceId'])
    .index('by_workspace_id_user_id', ['workspaceId', 'userId']),
  channels: defineTable({
    name: v.string(),
    workspaceId: v.id('workspaces'),
  }).index('by_workspace_id', ['workspaceId']),
  conversations: defineTable({
    workspaceId: v.id('workspaces'),
    memberOneId: v.id('members'),
    memberTwoId: v.id('members'),
    lastRead: v.optional(v.record(v.string(), v.number())),
  }).index('by_workspace_id', ['workspaceId']),
  messages: defineTable({
    body: v.string(),
    image: v.optional(v.id('_storage')),
    memberId: v.id('members'),
    workspaceId: v.id('workspaces'),
    channelId: v.optional(v.id('channels')),
    parentMessageId: v.optional(v.id('messages')),
    conversationId: v.optional(v.id('conversations')),
    updatedAt: v.optional(v.number()),
  })
    .index('by_workspace_id', ['workspaceId'])
    .index('by_member_id', ['memberId'])
    .index('by_channel_id', ['channelId'])
    .index('by_conversation_id', ['conversationId'])
    .index('by_parent_message_id', ['parentMessageId'])
    .index('by_channel_id_parent_message_id_conversation_id', ['channelId', 'parentMessageId', 'conversationId']),
  reactions: defineTable({
    workspaceId: v.id('workspaces'),
    messageId: v.id('messages'),
    memberId: v.id('members'),
    value: v.string(),
  })
    .index('by_workspace_id', ['workspaceId'])
    .index('by_message_id', ['messageId'])
    .index('by_member_id', ['memberId']),
  memberEvents: defineTable({
    workspaceId: v.id('workspaces'),
    actorName: v.string(),
    targetName: v.string(),
    targetImage: v.optional(v.string()),
    action: v.union(v.literal('joined'), v.literal('removed')),
  }).index('by_workspace_id', ['workspaceId']),
  userPresence: defineTable({
    userId: v.id('users'),
    availability: v.union(v.literal('active'), v.literal('away'), v.literal('dnd')),
    customStatus: v.optional(v.string()),
    customStatusExpiry: v.optional(v.number()),
  }).index('by_user_id', ['userId']),
  activityEvents: defineTable({
    workspaceId: v.id('workspaces'),
    targetUserId: v.id('users'),
    actorName: v.string(),
    actorImage: v.optional(v.string()),
    action: v.union(
      v.literal('added_to_workspace'),
      v.literal('removed_from_workspace'),
      v.literal('message_mention'),
      v.literal('channel_message'),
      v.literal('thread_reply'),
      v.literal('emoji_reaction'),
    ),
    channelId: v.optional(v.id('channels')),
    channelName: v.optional(v.string()),
    parentMessageId: v.optional(v.id('messages')),
    messagePreview: v.optional(v.string()),
    emoji: v.optional(v.string()),
    isRead: v.boolean(),
  })
    .index('by_workspace_and_target', ['workspaceId', 'targetUserId'])
    .index('by_target_user', ['targetUserId']),
});

export default schema;
