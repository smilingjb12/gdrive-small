import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

// Get user by ID
export const getUser = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId)
  },
})

// Get user by email
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first()
  },
})

// Get user storage info
export const getStorageInfo = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) return null

    return {
      used: user.storageUsed,
      limit: user.storageLimit,
      percentage: (user.storageUsed / user.storageLimit) * 100,
    }
  },
})

// Demo user email constant
const DEMO_USER_EMAIL = 'demo@driveclone.local'

// Demo folder names
const DEMO_FOLDERS = ['Documents', 'Images', 'Projects']

// Demo file data for seeding
const DEMO_FILES = [
  { name: 'Report.pdf', type: 'pdf' as const, mimeType: 'application/pdf', size: 1024 * 100 },
  { name: 'Notes.txt', type: 'document' as const, mimeType: 'text/plain', size: 1024 * 5 },
  { name: 'Photo.jpg', type: 'image' as const, mimeType: 'image/jpeg', size: 1024 * 500 },
  { name: 'Video.mp4', type: 'video' as const, mimeType: 'video/mp4', size: 1024 * 1024 * 10 },
  { name: 'Song.mp3', type: 'audio' as const, mimeType: 'audio/mpeg', size: 1024 * 1024 * 3 },
  { name: 'Archive.zip', type: 'archive' as const, mimeType: 'application/zip', size: 1024 * 1024 * 2 },
  { name: 'Data.xlsx', type: 'spreadsheet' as const, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 1024 * 50 },
  { name: 'Slides.pptx', type: 'presentation' as const, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 1024 * 200 },
  { name: 'Script.js', type: 'code' as const, mimeType: 'text/javascript', size: 1024 * 2 },
]

// Get or create demo user for testing
export const getOrCreateDemoUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if demo user exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', DEMO_USER_EMAIL))
      .first()

    if (existingUser) {
      return existingUser
    }

    // Create demo user
    const userId = await ctx.db.insert('users', {
      name: 'Demo User',
      email: DEMO_USER_EMAIL,
      storageUsed: 0,
      storageLimit: 10 * 1024 * 1024 * 1024, // 10 GB
    })

    const now = Date.now()

    // Create demo folders
    for (const folderName of DEMO_FOLDERS) {
      await ctx.db.insert('folders', {
        name: folderName,
        parentId: undefined,
        ownerId: userId,
        isStarred: false,
        isTrashed: false,
        createdAt: now,
        updatedAt: now,
      })
    }

    // Create demo files in root folder
    let totalSize = 0
    for (const fileData of DEMO_FILES) {
      await ctx.db.insert('files', {
        name: fileData.name,
        type: fileData.type,
        mimeType: fileData.mimeType,
        size: fileData.size,
        storageId: undefined,
        folderId: undefined,
        ownerId: userId,
        isStarred: false,
        isTrashed: false,
        createdAt: now,
        updatedAt: now,
      })
      totalSize += fileData.size
    }

    // Update user's storage used
    await ctx.db.patch(userId, {
      storageUsed: totalSize,
    })

    return await ctx.db.get(userId)
  },
})
