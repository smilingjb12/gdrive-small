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

    return await ctx.db.get(userId)
  },
})
