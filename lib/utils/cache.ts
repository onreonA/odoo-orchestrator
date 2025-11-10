/**
 * Cache Utility
 * 
 * Simple in-memory cache with TTL support
 * Sprint 5 - Performance Optimization
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class Cache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private maxSize: number = 1000

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    const expiresAt = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { data, expiresAt })
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
}

// Singleton instance
export const cache = new Cache()

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup()
  }, 5 * 60 * 1000)
}

/**
 * Cache decorator for functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttlSeconds: number = 300,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : `cache:${fn.name}:${JSON.stringify(args)}`

    // Try cache first
    const cached = cache.get(key)
    if (cached !== null) {
      return cached
    }

    // Execute function
    const result = await fn(...args)

    // Cache result
    cache.set(key, result, ttlSeconds)

    return result
  }) as T
}

/**
 * Cache key generators
 */
export const cacheKeys = {
  company: (id: string) => `company:${id}`,
  companyProjects: (id: string) => `company:${id}:projects`,
  companyStats: (id: string) => `company:${id}:stats`,
  userProfile: (id: string) => `user:${id}:profile`,
  userPermissions: (id: string) => `user:${id}:permissions`,
  project: (id: string) => `project:${id}`,
  module: (slug: string) => `module:${slug}`,
  modules: (filters?: string) => `modules:${filters || 'all'}`,
}

