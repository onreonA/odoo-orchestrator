/**
 * Simple In-Memory Cache Utility
 *
 * API route'lar için basit caching mekanizması
 * Production'da Redis gibi bir cache service kullanılabilir
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL: number = 60 * 1000 // 60 seconds default

  /**
   * Cache'den veri getir
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Expired check
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Cache'e veri ekle
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs || this.defaultTTL
    const expiresAt = Date.now() + ttl

    this.cache.set(key, {
      data,
      expiresAt,
    })
  }

  /**
   * Cache'den veri sil
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Belirli bir pattern'e uyan tüm key'leri sil
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Tüm cache'i temizle
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Expired entry'leri temizle
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
   * Cache size
   */
  size(): number {
    return this.cache.size
  }
}

// Singleton instance
const cache = new SimpleCache()

// Periodic cleanup (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      cache.cleanup()
    },
    5 * 60 * 1000
  )
}

/**
 * Cache key generator helpers
 */
export const CacheKeys = {
  template: (id: string) => `template:${id}`,
  templateAnalytics: (id: string, range?: string) => `template:analytics:${id}:${range || '30'}`,
  templateFeedback: (id: string) => `template:feedback:${id}`,
  instance: (id: string) => `instance:${id}`,
  instanceHealth: (id: string) => `instance:health:${id}`,
  userProfile: (id: string) => `user:profile:${id}`,
  adminStats: (userId: string, companyId?: string) =>
    `admin:stats:${userId}${companyId ? `:${companyId}` : ''}`,
}

/**
 * Cache wrapper for async functions
 */
export async function cached<T>(key: string, fn: () => Promise<T>, ttlMs?: number): Promise<T> {
  // Check cache first
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Execute function and cache result
  const result = await fn()
  cache.set(key, result, ttlMs)

  return result
}

export default cache
