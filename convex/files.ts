import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

// File type detection based on MIME type
function getFileType(mimeType: string): 'document' | 'image' | 'video' | 'audio' | 'archive' | 'spreadsheet' | 'presentation' | 'pdf' | 'code' | 'other' {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.includes('spreadsheet') || mimeType === 'text/csv' || mimeType.includes('excel')) return 'spreadsheet'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('7z') || mimeType.includes('compressed')) return 'archive'
  if (mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css') || mimeType.includes('xml') || mimeType === 'text/plain') return 'code'
  if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('msword')) return 'document'
  return 'other'
}

// Generate upload URL for file upload
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

// Create a file record after upload
export const createFile = mutation({
  args: {
    name: v.string(),
    mimeType: v.string(),
    size: v.number(),
    storageId: v.id('_storage'),
    folderId: v.optional(v.id('folders')),
    ownerId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const fileType = getFileType(args.mimeType)

    // Create the file record
    const fileId = await ctx.db.insert('files', {
      name: args.name,
      type: fileType,
      mimeType: args.mimeType,
      size: args.size,
      storageId: args.storageId,
      folderId: args.folderId,
      ownerId: args.ownerId,
      isStarred: false,
      isTrashed: false,
      createdAt: now,
      updatedAt: now,
    })

    // Update user's storage used
    const user = await ctx.db.get(args.ownerId)
    if (user) {
      await ctx.db.patch(args.ownerId, {
        storageUsed: user.storageUsed + args.size,
      })
    }

    return fileId
  },
})

// Get download URL for a file
export const getDownloadUrl = query({
  args: {
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId)
  },
})

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

// Soft delete a file (move to trash)
export const softDeleteFile = mutation({
  args: {
    fileId: v.id('files'),
  },
  handler: async (ctx, args) => {
    // Check if the file exists
    const file = await ctx.db.get(args.fileId)
    if (!file) {
      throw new Error('File not found')
    }

    // Check if already trashed
    if (file.isTrashed) {
      return { success: true }
    }

    const now = Date.now()

    // Soft delete the file
    await ctx.db.patch(args.fileId, {
      isTrashed: true,
      updatedAt: now,
    })

    return { success: true }
  },
})

// Search files by name (case-insensitive, trimmed)
export const searchFiles = query({
  args: {
    ownerId: v.id('users'),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmedSearchTerm = args.searchTerm.trim().toLowerCase()
    if (!trimmedSearchTerm) {
      return []
    }

    // Get all non-trashed files for the user and filter by name
    const allFiles = await ctx.db
      .query('files')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.ownerId))
      .filter((q) => q.eq(q.field('isTrashed'), false))
      .collect()

    // Filter by name containing search term (case-insensitive)
    return allFiles.filter((file) =>
      file.name.toLowerCase().includes(trimmedSearchTerm)
    )
  },
})

// Get storage breakdown by file type for a user
export const getStorageByFileType = query({
  args: {
    ownerId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get all non-trashed files for the user
    const allFiles = await ctx.db
      .query('files')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.ownerId))
      .filter((q) => q.eq(q.field('isTrashed'), false))
      .collect()

    // Calculate storage used per file type
    const storageByType: Record<string, number> = {}

    for (const file of allFiles) {
      if (!storageByType[file.type]) {
        storageByType[file.type] = 0
      }
      storageByType[file.type] += file.size
    }

    // Convert to array format for easier consumption
    return Object.entries(storageByType).map(([type, size]) => ({
      type,
      size,
    }))
  },
})

// Get all files for a user sorted by size descending
export const getAllFilesSortedBySize = query({
  args: {
    ownerId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get all non-trashed files for the user
    const allFiles = await ctx.db
      .query('files')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.ownerId))
      .filter((q) => q.eq(q.field('isTrashed'), false))
      .collect()

    // Sort by size descending
    return allFiles.sort((a, b) => b.size - a.size)
  },
})

// Rename a file
export const renameFile = mutation({
  args: {
    fileId: v.id('files'),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if the file exists
    const file = await ctx.db.get(args.fileId)
    if (!file) {
      throw new Error('File not found')
    }

    // Validate the new name
    const trimmedName = args.newName.trim()
    if (!trimmedName) {
      throw new Error('File name cannot be empty')
    }

    const now = Date.now()

    // Update the file name
    await ctx.db.patch(args.fileId, {
      name: trimmedName,
      updatedAt: now,
    })

    return { success: true }
  },
})

// Restore a file from trash
export const restoreFile = mutation({
  args: {
    fileId: v.id('files'),
  },
  handler: async (ctx, args) => {
    // Check if the file exists
    const file = await ctx.db.get(args.fileId)
    if (!file) {
      throw new Error('File not found')
    }

    // Check if already not trashed
    if (!file.isTrashed) {
      return { success: true }
    }

    const now = Date.now()

    // Restore the file
    await ctx.db.patch(args.fileId, {
      isTrashed: false,
      updatedAt: now,
    })

    return { success: true }
  },
})

// Permanently delete a file
export const permanentDeleteFile = mutation({
  args: {
    fileId: v.id('files'),
  },
  handler: async (ctx, args) => {
    // Check if the file exists
    const file = await ctx.db.get(args.fileId)
    if (!file) {
      throw new Error('File not found')
    }

    // Delete the file from storage if it has a storageId
    if (file.storageId) {
      await ctx.storage.delete(file.storageId)
    }

    // Update user's storage used
    const user = await ctx.db.get(file.ownerId)
    if (user) {
      await ctx.db.patch(file.ownerId, {
        storageUsed: Math.max(0, user.storageUsed - file.size),
      })
    }

    // Delete the file record
    await ctx.db.delete(args.fileId)

    return { success: true }
  },
})

// Empty trash - delete all trashed files for a user
export const emptyTrash = mutation({
  args: {
    ownerId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get all trashed files for the user
    const trashedFiles = await ctx.db
      .query('files')
      .withIndex('by_owner_trashed', (q) =>
        q.eq('ownerId', args.ownerId).eq('isTrashed', true)
      )
      .collect()

    // Get all trashed folders for the user
    const trashedFolders = await ctx.db
      .query('folders')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.ownerId))
      .filter((q) => q.eq(q.field('isTrashed'), true))
      .collect()

    let totalSizeDeleted = 0

    // Delete all trashed files
    for (const file of trashedFiles) {
      // Delete from storage if it has a storageId
      if (file.storageId) {
        await ctx.storage.delete(file.storageId)
      }
      totalSizeDeleted += file.size
      await ctx.db.delete(file._id)
    }

    // Delete all trashed folders
    for (const folder of trashedFolders) {
      await ctx.db.delete(folder._id)
    }

    // Update user's storage used
    const user = await ctx.db.get(args.ownerId)
    if (user) {
      await ctx.db.patch(args.ownerId, {
        storageUsed: Math.max(0, user.storageUsed - totalSizeDeleted),
      })
    }

    return { success: true, deletedFiles: trashedFiles.length, deletedFolders: trashedFolders.length }
  },
})
