import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmailHandlerAgent } from '@/lib/ai/agents/email-handler-agent'
import { openai } from '@/lib/ai/openai'
import { claude } from '@/lib/ai/claude'

vi.mock('@/lib/ai/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}))

vi.mock('@/lib/ai/claude', () => ({
  claude: {
    messages: {
      create: vi.fn(),
    },
  },
}))

describe('EmailHandlerAgent', () => {
  let agent: EmailHandlerAgent

  beforeEach(() => {
    agent = new EmailHandlerAgent()
    vi.clearAllMocks()
  })

  describe('categorizeEmail', () => {
    it('should categorize email correctly', async () => {
      const mockResponse = {
        category: 'support',
        priority: 'high',
        sentiment: 'negative',
        requiresResponse: true,
        estimatedResponseTime: 30,
      }

      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
            },
          },
        ],
      } as any)

      const result = await agent.categorizeEmail({
        subject: 'Urgent: Need help with product',
        body: 'I am having issues with the product and need immediate assistance.',
        from: 'customer@example.com',
        date: '2024-01-15T10:00:00Z',
      })

      expect(result.category).toBe('support')
      expect(result.priority).toBe('high')
      expect(result.sentiment).toBe('negative')
      expect(result.requiresResponse).toBe(true)
      expect(openai.chat.completions.create).toHaveBeenCalled()
    })

    it('should handle spam emails', async () => {
      const mockResponse = {
        category: 'spam',
        priority: 'low',
        sentiment: 'neutral',
        requiresResponse: false,
        estimatedResponseTime: 0,
      }

      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
            },
          },
        ],
      } as any)

      const result = await agent.categorizeEmail({
        subject: 'Win $1000 Now!',
        body: 'Click here to claim your prize!',
        from: 'spam@example.com',
        date: '2024-01-15T10:00:00Z',
      })

      expect(result.category).toBe('spam')
      expect(result.requiresResponse).toBe(false)
    })
  })

  describe('generateResponse', () => {
    it('should generate response draft', async () => {
      const mockResponse = {
        response: 'Thank you for your email. We will get back to you soon.',
        tone: 'professional',
        suggestedActions: ['review', 'follow-up'],
      }

      vi.mocked(claude.messages.create).mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResponse),
          },
        ],
      } as any)

      const result = await agent.generateResponse(
        {
          subject: 'Question about product',
          body: 'I have a question about your product.',
          from: 'customer@example.com',
        },
        {
          companyName: 'Test Company',
        }
      )

      expect(result.response).toBeDefined()
      expect(result.tone).toBe('professional')
      expect(claude.messages.create).toHaveBeenCalled()
    })

    it('should use context from previous emails', async () => {
      const mockResponse = {
        response: 'Following up on our previous conversation...',
        tone: 'friendly',
        suggestedActions: ['review', 'follow-up'],
      }

      vi.mocked(claude.messages.create).mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResponse),
          },
        ],
      } as any)

      const result = await agent.generateResponse(
        {
          subject: 'Re: Question about product',
          body: 'Thank you for your response.',
          from: 'customer@example.com',
        },
        {
          previousEmails: [
            {
              subject: 'Question about product',
              body: 'I have a question.',
            },
          ],
        }
      )

      expect(result.response).toBeDefined()
      expect(claude.messages.create).toHaveBeenCalled()
    })
  })

  describe('detectUrgency', () => {
    it('should detect urgent emails', async () => {
      const mockResponse = {
        isUrgent: true,
        urgencyLevel: 'critical',
        reason: 'Contains urgent keywords and negative sentiment',
        suggestedAction: 'respond_immediately',
      }

      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
            },
          },
        ],
      } as any)

      const result = await agent.detectUrgency({
        subject: 'URGENT: System Down',
        body: 'Our system is down and we need immediate help!',
        from: 'admin@example.com',
      })

      expect(result.isUrgent).toBe(true)
      expect(result.urgencyLevel).toBe('critical')
      expect(openai.chat.completions.create).toHaveBeenCalled()
    })

    it('should not flag normal emails as urgent', async () => {
      const mockResponse = {
        isUrgent: false,
        urgencyLevel: 'low',
        reason: 'Normal business communication',
        suggestedAction: 'respond_normal',
      }

      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
            },
          },
        ],
      } as any)

      const result = await agent.detectUrgency({
        subject: 'Monthly Newsletter',
        body: 'Here is our monthly newsletter with updates.',
        from: 'newsletter@example.com',
      })

      expect(result.isUrgent).toBe(false)
      expect(result.urgencyLevel).toBe('low')
    })
  })
})

