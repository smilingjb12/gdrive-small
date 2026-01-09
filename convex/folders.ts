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

// Soft delete a folder and all its children (folders and files)
export const softDeleteFolder = mutation({
  args: {
    folderId: v.id('folders'),
  },
  handler: async (ctx, args) => {
    // Check if the folder exists
    const folder = await ctx.db.get(args.folderId)
    if (!folder) {
      throw new Error('Folder not found')
    }

    // Check if already trashed
    if (folder.isTrashed) {
      return { success: true, deletedFolders: 0 }
    }

    const now = Date.now()

    // Helper function to recursively collect all descendant folder IDs
    async function getDescendantFolderIds(
      folderId: typeof args.folderId
    ): Promise<typeof args.folderId[]> {
      const childFolders = await ctx.db
        .query('folders')
        .withIndex('by_parent', (q) => q.eq('parentId', folderId))
        .filter((q) => q.eq(q.field('isTrashed'), false))
        .collect()

      const descendantIds: typeof args.folderId[] = []
      for (const child of childFolders) {
        descendantIds.push(child._id)
        const childDescendants = await getDescendantFolderIds(child._id)
        descendantIds.push(...childDescendants)
      }
      return descendantIds
    }

    // Get all folder IDs to soft delete (the folder itself + all descendants)
    const folderIdsToDelete = [args.folderId]
    const descendantIds = await getDescendantFolderIds(args.folderId)
    folderIdsToDelete.push(...descendantIds)

    // Soft delete all folders
    for (const folderId of folderIdsToDelete) {
      await ctx.db.patch(folderId, {
        isTrashed: true,
        updatedAt: now,
      })
    }

    // Soft delete all files in the deleted folders
    for (const folderId of folderIdsToDelete) {
      const filesInFolder = await ctx.db
        .query('files')
        .withIndex('by_folder', (q) => q.eq('folderId', folderId))
        .filter((q) => q.eq(q.field('isTrashed'), false))
        .collect()

      for (const file of filesInFolder) {
        await ctx.db.patch(file._id, {
          isTrashed: true,
          updatedAt: now,
        })
      }
    }

    return { success: true, deletedFolders: folderIdsToDelete.length }
  },
})

// Search folders by name (case-insensitive, trimmed)
export const searchFolders = query({
  args: {
    ownerId: v.id('users'),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmedSearchTerm = args.searchTerm.trim().toLowerCase()
    if (!trimmedSearchTerm) {
      return []
    }

    // Get all non-trashed folders for the user and filter by name
    const allFolders = await ctx.db
      .query('folders')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.ownerId))
      .filter((q) => q.eq(q.field('isTrashed'), false))
      .collect()

    // Filter by name containing search term (case-insensitive)
    return allFolders.filter((folder) =>
      folder.name.toLowerCase().includes(trimmedSearchTerm)
    )
  },
})

// Rename a folder
export const renameFolder = mutation({
  args: {
    folderId: v.id('folders'),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if the folder exists
    const folder = await ctx.db.get(args.folderId)
    if (!folder) {
      throw new Error('Folder not found')
    }

    // Validate the new name
    const trimmedName = args.newName.trim()
    if (!trimmedName) {
      throw new Error('Folder name cannot be empty')
    }

    const now = Date.now()

    // Update the folder name
    await ctx.db.patch(args.folderId, {
      name: trimmedName,
      updatedAt: now,
    })

    return { success: true }
  },
})

// Restore a folder from trash (and all its children)
export const restoreFolder = mutation({
  args: {
    folderId: v.id('folders'),
  },
  handler: async (ctx, args) => {
    // Check if the folder exists
    const folder = await ctx.db.get(args.folderId)
    if (!folder) {
      throw new Error('Folder not found')
    }

    // Check if already not trashed
    if (!folder.isTrashed) {
      return { success: true, restoredFolders: 0 }
    }

    const now = Date.now()

    // Helper function to recursively collect all descendant folder IDs (including trashed)
    async function getDescendantFolderIds(
      folderId: typeof args.folderId
    ): Promise<typeof args.folderId[]> {
      const childFolders = await ctx.db
        .query('folders')
        .withIndex('by_parent', (q) => q.eq('parentId', folderId))
        .collect()

      const descendantIds: typeof args.folderId[] = []
      for (const child of childFolders) {
        descendantIds.push(child._id)
        const childDescendants = await getDescendantFolderIds(child._id)
        descendantIds.push(...childDescendants)
      }
      return descendantIds
    }

    // Get all folder IDs to restore (the folder itself + all descendants)
    const folderIdsToRestore = [args.folderId]
    const descendantIds = await getDescendantFolderIds(args.folderId)
    folderIdsToRestore.push(...descendantIds)

    // Restore all folders
    for (const folderId of folderIdsToRestore) {
      await ctx.db.patch(folderId, {
        isTrashed: false,
        updatedAt: now,
      })
    }

    // Restore all files in the restored folders
    for (const folderId of folderIdsToRestore) {
      const filesInFolder = await ctx.db
        .query('files')
        .withIndex('by_folder', (q) => q.eq('folderId', folderId))
        .filter((q) => q.eq(q.field('isTrashed'), true))
        .collect()

      for (const file of filesInFolder) {
        await ctx.db.patch(file._id, {
          isTrashed: false,
          updatedAt: now,
        })
      }
    }

    return { success: true, restoredFolders: folderIdsToRestore.length }
  },
})

// Permanently delete a folder and all its contents
export const permanentDeleteFolder = mutation({
  args: {
    folderId: v.id('folders'),
  },
  handler: async (ctx, args) => {
    // Check if the folder exists
    const folder = await ctx.db.get(args.folderId)
    if (!folder) {
      throw new Error('Folder not found')
    }

    // Helper function to recursively collect all descendant folder IDs
    async function getDescendantFolderIds(
      folderId: typeof args.folderId
    ): Promise<typeof args.folderId[]> {
      const childFolders = await ctx.db
        .query('folders')
        .withIndex('by_parent', (q) => q.eq('parentId', folderId))
        .collect()

      const descendantIds: typeof args.folderId[] = []
      for (const child of childFolders) {
        descendantIds.push(child._id)
        const childDescendants = await getDescendantFolderIds(child._id)
        descendantIds.push(...childDescendants)
      }
      return descendantIds
    }

    // Get all folder IDs to delete (the folder itself + all descendants)
    const folderIdsToDelete = [args.folderId]
    const descendantIds = await getDescendantFolderIds(args.folderId)
    folderIdsToDelete.push(...descendantIds)

    let totalSizeDeleted = 0

    // Delete all files in the folders
    for (const folderId of folderIdsToDelete) {
      const filesInFolder = await ctx.db
        .query('files')
        .withIndex('by_folder', (q) => q.eq('folderId', folderId))
        .collect()

      for (const file of filesInFolder) {
        // Delete from storage if it has a storageId
        if (file.storageId) {
          await ctx.storage.delete(file.storageId)
        }
        totalSizeDeleted += file.size
        await ctx.db.delete(file._id)
      }
    }

    // Delete all folders (in reverse order to delete children first)
    for (const folderId of folderIdsToDelete.reverse()) {
      await ctx.db.delete(folderId)
    }

    // Update user's storage used
    const user = await ctx.db.get(folder.ownerId)
    if (user) {
      await ctx.db.patch(folder.ownerId, {
        storageUsed: Math.max(0, user.storageUsed - totalSizeDeleted),
      })
    }

    return { success: true, deletedFolders: folderIdsToDelete.length }
  },
})
