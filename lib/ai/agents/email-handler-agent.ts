import { openai } from '@/lib/ai/openai'
import { claude } from '@/lib/ai/claude'

export interface EmailInput {
  subject: string
  body: string
  from: string
  date?: string
}

export interface EmailCategory {
  category: 'support' | 'sales' | 'spam' | 'general' | 'complaint'
  priority: 'low' | 'medium' | 'high' | 'critical'
  sentiment: 'positive' | 'neutral' | 'negative'
  requiresResponse: boolean
  estimatedResponseTime: number
}

export interface EmailResponse {
  response: string
  tone: 'professional' | 'friendly' | 'formal' | 'casual'
  suggestedActions: string[]
}

export interface UrgencyDetection {
  isUrgent: boolean
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  reason: string
  suggestedAction: string
}

export interface GenerateResponseOptions {
  companyName?: string
  previousEmails?: Array<{ subject: string; body: string }>
}

export class EmailHandlerAgent {
  /**
   * Categorize an email
   */
  async categorizeEmail(email: EmailInput): Promise<EmailCategory> {
    const prompt = `Analyze the following email and categorize it:
Subject: ${email.subject}
Body: ${email.body}
From: ${email.from}

Return a JSON object with:
- category: one of "support", "sales", "spam", "general", "complaint"
- priority: one of "low", "medium", "high", "critical"
- sentiment: one of "positive", "neutral", "negative"
- requiresResponse: boolean
- estimatedResponseTime: number in minutes`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an email categorization assistant. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    return JSON.parse(responseText) as EmailCategory
  }

  /**
   * Generate response draft for an email
   */
  async generateResponse(
    email: EmailInput,
    options?: GenerateResponseOptions
  ): Promise<EmailResponse> {
    let context = `Generate a professional email response for:
Subject: ${email.subject}
Body: ${email.body}
From: ${email.from}`

    if (options?.companyName) {
      context += `\nCompany: ${options.companyName}`
    }

    if (options?.previousEmails && options.previousEmails.length > 0) {
      context += `\n\nPrevious emails in this thread:`
      options.previousEmails.forEach((prev, idx) => {
        context += `\n${idx + 1}. Subject: ${prev.subject}\n   Body: ${prev.body}`
      })
    }

    const response = await claude.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: context,
        },
      ],
    })

    const responseText =
      response.content[0]?.type === 'text'
        ? response.content[0].text
        : JSON.stringify({
            response: 'Thank you for your email.',
            tone: 'professional',
            suggestedActions: [],
          })

    try {
      return JSON.parse(responseText) as EmailResponse
    } catch {
      // If not JSON, return as plain response
      return {
        response: responseText,
        tone: 'professional',
        suggestedActions: ['review'],
      }
    }
  }

  /**
   * Detect urgency of an email
   */
  async detectUrgency(email: EmailInput): Promise<UrgencyDetection> {
    const prompt = `Analyze the urgency of this email:
Subject: ${email.subject}
Body: ${email.body}
From: ${email.from}

Return a JSON object with:
- isUrgent: boolean
- urgencyLevel: one of "low", "medium", "high", "critical"
- reason: string explaining why
- suggestedAction: string`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an email urgency detection assistant. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    return JSON.parse(responseText) as UrgencyDetection
  }
}
