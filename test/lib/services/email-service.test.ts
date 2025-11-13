import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmailService } from '@/lib/services/email-service'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Create a chainable query mock
const createChainableQuery = (finalResult: any) => {
  const query = {
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    select: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(finalResult)),
    gte: vi.fn(() => query),
    lte: vi.fn(() => query),
    or: vi.fn(() => query),
  }
  // Make query methods return promises when awaited
  query.order.mockImplementation(() => Promise.resolve(finalResult))
  query.eq.mockImplementation(() => query)
  query.gte.mockImplementation(() => query)
  query.lte.mockImplementation(() => query)
  query.or.mockImplementation(() => query)
  // When awaited, return the final result
  Object.defineProperty(query, 'then', {
    value: (resolve: any) => resolve(finalResult),
    writable: true,
  })
  return query
}

const createMockSupabase = () => {
  const mockSupabase = {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  }
  return mockSupabase
}

describe('EmailService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('getEmailAccounts', () => {
    it('should fetch email accounts for user', async () => {
      const mockAccounts = [
        {
          id: 'account-1',
          user_id: 'user-123',
          email_address: 'test@example.com',
          provider: 'gmail',
        },
      ]

      const query = createChainableQuery({ data: mockAccounts, error: null })
      mockSupabase.from.mockReturnValue(query)

      const result = await EmailService.getEmailAccounts('user-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('email_accounts')
      expect(query.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result.data).toEqual(mockAccounts)
      expect(result.error).toBeNull()
    })
  })

  describe('getEmails', () => {
    it('should fetch emails with filters', async () => {
      const mockEmails = [
        {
          id: 'email-1',
          account_id: 'account-1',
          subject: 'Test Email',
          body: 'Test body',
          from_address: 'sender@example.com',
        },
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const query = createChainableQuery({ data: mockEmails, error: null })
      mockSupabase.from.mockReturnValue(query)

      const result = await EmailService.getEmails('account-1', {
        status: 'received',
        limit: 10,
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('emails')
      expect(result.data).toEqual(mockEmails)
    })
  })

  describe('createEmailAccount', () => {
    it('should create email account', async () => {
      const input = {
        email_address: 'test@example.com',
        provider: 'gmail',
        imap_host: 'imap.gmail.com',
        imap_port: 993,
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
      }

      const mockAccount = { id: 'account-1', ...input }

      const query = createChainableQuery({ data: mockAccount, error: null })
      mockSupabase.from.mockReturnValue(query)

      const result = await EmailService.createEmailAccount(input, 'user-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('email_accounts')
      expect(query.insert).toHaveBeenCalled()
      expect(result.data).toEqual(mockAccount)
    })
  })

  describe('createEmail', () => {
    it('should create email', async () => {
      const input = {
        account_id: 'account-1',
        subject: 'Test',
        body_text: 'Test body',
        to_addresses: ['recipient@example.com'],
      }

      // Mock account fetch (getEmailAccountById) - needs single() call
      const accountQuery = createChainableQuery({
        data: { user_id: 'user-123', email_address: 'test@example.com' },
        error: null,
      })
      accountQuery.single.mockResolvedValue({
        data: { user_id: 'user-123', email_address: 'test@example.com' },
        error: null,
      })
      mockSupabase.from.mockReturnValueOnce(accountQuery)

      // Mock email insert (createEmail) - needs select().single() chain
      const mockEmail = {
        id: 'email-1',
        ...input,
        from_address: 'test@example.com',
        email_status: 'draft' as const,
        email_priority: 'normal' as const,
        read: false,
        starred: false,
      }
      const emailQuery = createChainableQuery({ data: mockEmail, error: null })
      emailQuery.select.mockReturnValue(emailQuery)
      emailQuery.single.mockResolvedValue({ data: mockEmail, error: null })
      mockSupabase.from.mockReturnValueOnce(emailQuery)

      const result = await EmailService.createEmail(input, 'user-123')

      expect(result.data).toEqual(mockEmail)
    })
  })
})
