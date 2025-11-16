// Cache utilities
export const cacheKeys = {
  companies: 'companies',
  company: (id: string) => `company:${id}`,
  companyProjects: (id: string) => `company:${id}:projects`,
  companyStats: (id: string) => `company:${id}:stats`,
}

export function cache<T>(key: string, value: T, ttl?: number): void {
  // Placeholder implementation
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify({ value, expires: ttl ? Date.now() + ttl : null }))
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

export function getCache<T>(key: string): T | null {
  // Placeholder implementation
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null
      const { value, expires } = JSON.parse(item)
      if (expires && Date.now() > expires) {
        localStorage.removeItem(key)
        return null
      }
      return value as T
    } catch (e) {
      return null
    }
  }
  return null
}

export function deleteCache(key: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      // Ignore errors
    }
  }
}

export function clearCache(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.clear()
    } catch (e) {
      // Ignore errors
    }
  }
}
