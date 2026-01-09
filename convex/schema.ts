import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Users table
  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    storageUsed: v.number(), // in bytes
    storageLimit: v.number(), // in bytes
  }).index('by_email', ['email']),

  // Folders table
  folders: defineTable({
    name: v.string(),
    parentId: v.optional(v.id('folders')), // null for root folders
    ownerId: v.id('users'),
    isStarred: v.boolean(),
    isTrashed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_owner', ['ownerId'])
    .index('by_parent', ['parentId'])
    .index('by_owner_and_parent', ['ownerId', 'parentId']),

  // Files table
  files: defineTable({
    name: v.string(),
    type: v.union(
      v.literal('document'),
      v.literal('image'),
      v.literal('video'),
      v.literal('audio'),
      v.literal('archive'),
      v.literal('spreadsheet'),
      v.literal('presentation'),
      v.literal('pdf'),
      v.literal('code'),
      v.literal('other')
    ),
    mimeType: v.string(),
    size: v.number(), // in bytes
    storageId: v.optional(v.id('_storage')), // Convex storage ID
    folderId: v.optional(v.id('folders')), // null for root level files
    ownerId: v.id('users'),
    isStarred: v.boolean(),
    isTrashed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_owner', ['ownerId'])
    .index('by_folder', ['folderId'])
    .index('by_owner_and_folder', ['ownerId', 'folderId'])
    .index('by_owner_starred', ['ownerId', 'isStarred'])
    .index('by_owner_trashed', ['ownerId', 'isTrashed']),

  // Recent activity tracking
  recentActivity: defineTable({
    userId: v.id('users'),
    itemType: v.union(v.literal('file'), v.literal('folder')),
    itemId: v.string(), // file or folder ID
    action: v.union(
      v.literal('viewed'),
      v.literal('edited'),
      v.literal('uploaded'),
      v.literal('created')
    ),
    timestamp: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_timestamp', ['userId', 'timestamp']),
})
