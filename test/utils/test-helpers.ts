/**
 * Test Helper Utilities
 * Ortak test fonksiyonları ve mock'lar
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { vi } from 'vitest'

/**
 * Mock Supabase User
 */
export const createMockUser = (overrides?: Partial<any>) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
  ...overrides,
})

/**
 * Mock Profile
 */
export const createMockProfile = (overrides?: Partial<any>) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'super_admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

/**
 * Mock Company
 */
export const createMockCompany = (overrides?: Partial<any>) => ({
  id: 'test-company-id',
  name: 'Test Company',
  industry: 'furniture',
  size: 'medium',
  status: 'discovery',
  health_score: 85,
  contact_person: 'John Doe',
  contact_email: 'contact@test.com',
  contact_phone: '+90 555 123 4567',
  address: 'Test Address',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'test-user-id',
  ...overrides,
})

/**
 * Mock Project
 */
export const createMockProject = (overrides?: Partial<any>) => ({
  id: 'test-project-id',
  name: 'Test Project',
  company_id: 'test-company-id',
  type: 'implementation',
  status: 'planning',
  completion_percentage: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'test-user-id',
  ...overrides,
})

/**
 * Mock Supabase Client
 */
export const createMockSupabaseClient = () => {
  const mockData: any[] = []
  const mockError: any = null

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: createMockProfile(),
            error: null,
          }),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        single: vi.fn().mockResolvedValue({
          data: createMockProfile(),
          error: null,
        }),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: createMockCompany(),
            error: null,
          }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })),
    })),
  }
}

/**
 * Custom Render with Providers
 */
export const renderWithProviders = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  return render(ui, {
    ...options,
  })
}

/**
 * Wait for async operations
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

/**
 * Mock Next.js Router
 */
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
}

/**
 * Mock Next.js Pathname
 */
export const mockPathname = '/dashboard'

/**
 * Mock Next.js Search Params
 */
export const mockSearchParams = new URLSearchParams()
