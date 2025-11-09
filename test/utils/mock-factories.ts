/**
 * Mock Data Factories
 * Test verileri için factory fonksiyonları
 */

/**
 * Basit mock factory'ler
 * Faker kullanmadan rastgele veri üretir
 */

export const mockFactories = {
  /**
   * Random string generator
   */
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  /**
   * Random email generator
   */
  randomEmail: () => `test-${mockFactories.randomString(8)}@example.com`,

  /**
   * Random phone generator
   */
  randomPhone: () =>
    `+90 555 ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`,

  /**
   * Random date generator
   */
  randomDate: (daysAgo = 0) => {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    return date.toISOString()
  },

  /**
   * Company factory
   */
  company: (overrides?: any) => ({
    id: `company-${mockFactories.randomString(8)}`,
    name: `Company ${mockFactories.randomString(6)}`,
    industry: ['furniture', 'defense', 'metal', 'ecommerce', 'other'][
      Math.floor(Math.random() * 5)
    ],
    size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)],
    status: ['discovery', 'planning', 'implementation', 'live', 'support'][
      Math.floor(Math.random() * 5)
    ],
    health_score: Math.floor(Math.random() * 40) + 60, // 60-100
    contact_person: `Person ${mockFactories.randomString(6)}`,
    contact_email: mockFactories.randomEmail(),
    contact_phone: mockFactories.randomPhone(),
    address: `Address ${mockFactories.randomString(10)}`,
    created_at: mockFactories.randomDate(Math.floor(Math.random() * 30)),
    updated_at: mockFactories.randomDate(Math.floor(Math.random() * 7)),
    created_by: `user-${mockFactories.randomString(8)}`,
    ...overrides,
  }),

  /**
   * User factory
   */
  user: (overrides?: any) => ({
    id: `user-${mockFactories.randomString(8)}`,
    email: mockFactories.randomEmail(),
    user_metadata: {
      full_name: `User ${mockFactories.randomString(6)}`,
    },
    ...overrides,
  }),

  /**
   * Profile factory
   */
  profile: (overrides?: any) => ({
    id: `user-${mockFactories.randomString(8)}`,
    email: mockFactories.randomEmail(),
    full_name: `User ${mockFactories.randomString(6)}`,
    role: ['super_admin', 'company_admin', 'company_user'][Math.floor(Math.random() * 3)],
    created_at: mockFactories.randomDate(Math.floor(Math.random() * 30)),
    updated_at: mockFactories.randomDate(Math.floor(Math.random() * 7)),
    ...overrides,
  }),

  /**
   * Project factory
   */
  project: (overrides?: any) => ({
    id: `project-${mockFactories.randomString(8)}`,
    name: `Project ${mockFactories.randomString(6)}`,
    company_id: `company-${mockFactories.randomString(8)}`,
    type: ['discovery', 'planning', 'implementation', 'support'][Math.floor(Math.random() * 4)],
    status: ['planning', 'in_progress', 'completed', 'on_hold'][Math.floor(Math.random() * 4)],
    completion_percentage: Math.floor(Math.random() * 100),
    created_at: mockFactories.randomDate(Math.floor(Math.random() * 30)),
    updated_at: mockFactories.randomDate(Math.floor(Math.random() * 7)),
    created_by: `user-${mockFactories.randomString(8)}`,
    ...overrides,
  }),
}
