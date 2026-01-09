import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

// Get all folders in a specific parent folder (or root if no parentId)
export const getFoldersInParent = query({
  args: {
    ownerId: v.id('users'),
    parentId: v.optional(v.id('folders')),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('folders')
      .withIndex('by_owner_and_parent', (q) =>
        q.eq('ownerId', args.ownerId).eq('parentId', args.parentId)
      )
      .filter((q) => q.eq(q.field('isTrashed'), false))
      .collect()
  },
})

// Get starred folders for a user
export const getStarredFolders = query({
  args: {
    ownerId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const folders = await ctx.db
      .query('folders')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.ownerId))
      .filter((q) =>
        q.and(
          q.eq(q.field('isStarred'), true),
          q.eq(q.field('isTrashed'), false)
        )
      )
      .collect()
    return folders
  },
})

// Get trashed folders for a user
export const getTrashedFolders = query({
  args: {
    ownerId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const folders = await ctx.db
      .query('folders')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.ownerId))
      .filter((q) => q.eq(q.field('isTrashed'), true))
      .collect()
    return folders
  },
})

// Get a single folder by ID
export const getFolder = query({
  args: {
    folderId: v.id('folders'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.folderId)
  },
})

// Get folder breadcrumb path
export const getFolderPath = query({
  args: {
    folderId: v.optional(v.id('folders')),
  },
  handler: async (ctx, args) => {
    const path: { id: string; name: string }[] = []

    let currentFolderId = args.folderId
    while (currentFolderId) {
      const folder = await ctx.db.get(currentFolderId)
      if (!folder) break
      path.unshift({ id: folder._id, name: folder.name })
      currentFolderId = folder.parentId
    }

    return path
  },
})

// Create a new folder
export const createFolder = mutation({
  args: {
    name: v.string(),
    parentId: v.optional(v.id('folders')),
    ownerId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const folderId = await ctx.db.insert('folders', {
      name: args.name,
      parentId: args.parentId,
      ownerId: args.ownerId,
      isStarred: false,
      isTrashed: false,
      createdAt: now,
      updatedAt: now,
    })
    return folderId
  },
})
