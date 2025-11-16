/**
 * Chatbot Chat API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chatbot/chat/route'

// Mock dependencies
vi.mock('@/lib/services/chatbot-service', () => ({
  ChatbotService: {
    generateResponse: vi.fn(),
  },
}))
vi.mock('openai', () => ({
  default: class MockOpenAI {
    constructor() {
      // Mock constructor
    }
  },
}))

import { ChatbotService } from '@/lib/services/chatbot-service'

describe('Chatbot Chat API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/chatbot/chat', () => {
    it('should generate chat response successfully', async () => {
      vi.mocked(ChatbotService.generateResponse).mockResolvedValue({
        data: {
          message: 'Test response',
          sources: [
            {
              id: 'kb-1',
              title: 'Test Knowledge',
              content: 'Test content',
            },
          ],
          confidence: 0.8,
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/chatbot/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test message',
          conversationHistory: [],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.message).toBe('Test response')
      expect(data.data.sources).toBeDefined()
    })

    it('should include conversation history', async () => {
      vi.mocked(ChatbotService.generateResponse).mockResolvedValue({
        data: {
          message: 'Response',
          sources: [],
          confidence: 0.5,
        },
        error: null,
      })

      const conversationHistory = [
        { role: 'user', content: 'Previous' },
        { role: 'assistant', content: 'Previous response' },
      ]

      const request = new NextRequest('http://localhost:3001/api/chatbot/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'New message',
          conversationHistory,
        }),
      })

      await POST(request)

      expect(ChatbotService.generateResponse).toHaveBeenCalledWith('New message', {
        conversationHistory,
      })
    })

    it('should return 400 if message missing', async () => {
      const request = new NextRequest('http://localhost:3001/api/chatbot/chat', {
        method: 'POST',
        body: JSON.stringify({
          conversationHistory: [],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Message is required')
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(ChatbotService.generateResponse).mockResolvedValue({
        data: null,
        error: 'Chatbot error',
      })

      const request = new NextRequest('http://localhost:3001/api/chatbot/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Chatbot error')
    })
  })
})
