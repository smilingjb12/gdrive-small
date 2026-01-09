import { query } from './_generated/server'
import { v } from 'convex/values'

// Get all files in a specific folder (or root if no folderId)
export const getFilesInFolder = query({
  args: {
    ownerId: v.id('users'),
    folderId: v.optional(v.id('folders')),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('files')
      .withIndex('by_owner_and_folder', (q) =>
        q.eq('ownerId', args.ownerId).eq('folderId', args.folderId)
      )
      .filter((q) => q.eq(q.field('isTrashed'), false))
      .collect()
  },
})

// Get starred files for a user
export const getStarredFiles = query({
  args: {
    ownerId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('files')
      .withIndex('by_owner_starred', (q) =>
        q.eq('ownerId', args.ownerId).eq('isStarred', true)
      )
      .filter((q) => q.eq(q.field('isTrashed'), false))
      .collect()
  },
})

// Get trashed files for a user
export const getTrashedFiles = query({
  args: {
    ownerId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('files')
      .withIndex('by_owner_trashed', (q) =>
        q.eq('ownerId', args.ownerId).eq('isTrashed', true)
      )
      .collect()
  },
})

// Get a single file by ID
export const getFile = query({
  args: {
    fileId: v.id('files'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.fileId)
  },
})

// Get file count for a user
export const getFileCount = query({
  args: {
    ownerId: v.id('users'),
    folderId: v.optional(v.id('folders')),
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query('files')
      .withIndex('by_owner_and_folder', (q) =>
        q.eq('ownerId', args.ownerId).eq('folderId', args.folderId)
      )
      .filter((q) => q.eq(q.field('isTrashed'), false))
      .collect()
    return files.length
  },
})
