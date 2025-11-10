/**
 * Chatbot Service
 * 
 * AI Chatbot için servis - Knowledge base ile entegre
 */

import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatContext {
  companyId?: string
  projectId?: string
  userId?: string
  conversationHistory?: ChatMessage[]
}

export interface ChatResponse {
  message: string
  sources?: Array<{
    id: string
    title: string
    content: string
    relevance_score?: number
  }>
  suggestedActions?: string[]
  confidence?: number
}

export class ChatbotService {
  /**
   * Chat mesajına yanıt oluştur (RAG ile)
   */
  static async generateResponse(
    userMessage: string,
    context?: ChatContext
  ): Promise<{ data: ChatResponse | null; error: any }> {
    try {
      const supabase = await createClient()

      // Get user's company_id if not provided
      if (!context?.companyId) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
          if (profile?.company_id) {
            context = { ...context, companyId: profile.company_id, userId: user.id }
          }
        }
      }

      // Search knowledge base for relevant content (RAG)
      const relevantDocs = await this.searchKnowledgeBase(userMessage, context?.companyId)

      // Build context from knowledge base
      const knowledgeContext = relevantDocs
        .map((doc) => `Title: ${doc.title}\nContent: ${doc.content}`)
        .join('\n\n')

      // Build system prompt
      const systemPrompt = `Sen Odoo Orchestrator AI asistanısın. Müşterilere Odoo kullanımı, proje durumu ve teknik konularda yardımcı oluyorsun.

${knowledgeContext ? `İlgili bilgiler:\n${knowledgeContext}\n\n` : ''}

Kurallar:
- Türkçe yanıt ver
- Kısa ve öz ol
- Eğer bilmiyorsan, bilmediğini söyle
- Müşteriyi destek sistemine yönlendir gerekirse
- Proje durumu hakkında bilgi verirken güncel verileri kullan

${context?.companyId ? `Müşteri firma ID: ${context.companyId}` : ''}`

      // Get conversation history
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...(context?.conversationHistory || []),
        { role: 'user', content: userMessage },
      ]

      // Generate response using OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 500,
      })

      const assistantMessage = completion.choices[0]?.message?.content || 'Üzgünüm, yanıt oluşturamadım.'

      // Extract suggested actions (if any)
      const suggestedActions = this.extractSuggestedActions(assistantMessage)

      return {
        data: {
          message: assistantMessage,
          sources: relevantDocs.map((doc) => ({
            id: doc.id,
            title: doc.title,
            content: doc.content.substring(0, 200),
            relevance_score: doc.relevance_score,
          })),
          suggestedActions,
          confidence: relevantDocs.length > 0 ? 0.8 : 0.5,
        },
        error: null,
      }
    } catch (error: any) {
      console.error('Chatbot error:', error)
      return {
        data: null,
        error: { message: error.message || 'Chatbot hatası oluştu' },
      }
    }
  }

  /**
   * Knowledge base'de arama yap (RAG)
   */
  private static async searchKnowledgeBase(
    query: string,
    companyId?: string
  ): Promise<Array<{ id: string; title: string; content: string; relevance_score?: number }>> {
    try {
      const supabase = await createClient()

      // Simple text search for now (can be enhanced with vector search later)
      let searchQuery = supabase
        .from('knowledge_base')
        .select('id, title, content')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(5)

      // Filter by company if provided
      if (companyId) {
        searchQuery = searchQuery.or(`company_id.eq.${companyId},company_id.is.null`)
      } else {
        searchQuery = searchQuery.is('company_id', null) // Only global knowledge
      }

      const { data, error } = await searchQuery

      if (error || !data) {
        return []
      }

      // Return results with relevance score (simple keyword matching)
      return data.map((doc) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        relevance_score: this.calculateRelevance(query, doc.title, doc.content),
      }))
    } catch (error) {
      console.error('Knowledge base search error:', error)
      return []
    }
  }

  /**
   * Basit relevance hesaplama (keyword matching)
   */
  private static calculateRelevance(query: string, title: string, content: string): number {
    const queryLower = query.toLowerCase()
    const titleLower = title.toLowerCase()
    const contentLower = content.toLowerCase()

    let score = 0

    // Title matches are more important
    if (titleLower.includes(queryLower)) {
      score += 0.5
    }

    // Content matches
    const contentMatches = (contentLower.match(new RegExp(queryLower, 'g')) || []).length
    score += Math.min(contentMatches * 0.1, 0.5)

    return Math.min(score, 1.0)
  }

  /**
   * Suggested actions çıkar (mesajdan)
   */
  private static extractSuggestedActions(message: string): string[] {
    const actions: string[] = []

    // Look for common action patterns
    if (message.toLowerCase().includes('destek') || message.toLowerCase().includes('ticket')) {
      actions.push('Destek talebi oluştur')
    }

    if (message.toLowerCase().includes('doküman') || message.toLowerCase().includes('belge')) {
      actions.push('Dokümanları görüntüle')
    }

    if (message.toLowerCase().includes('eğitim') || message.toLowerCase().includes('training')) {
      actions.push('Eğitim materyallerini görüntüle')
    }

    return actions
  }

  /**
   * Proje durumu hakkında bilgi getir
   */
  static async getProjectInfo(companyId: string): Promise<string> {
    try {
      const supabase = await createClient()

      const { data: projects } = await supabase
        .from('projects')
        .select('name, status, phase, completion_percentage')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (!projects || projects.length === 0) {
        return 'Henüz aktif proje bulunmuyor.'
      }

      const projectInfo = projects
        .map(
          (p) =>
            `- ${p.name}: ${p.status} durumunda, ${p.phase} fazında, %${p.completion_percentage || 0} tamamlanmış`
        )
        .join('\n')

      return `Aktif projeler:\n${projectInfo}`
    } catch (error) {
      return 'Proje bilgileri alınamadı.'
    }
  }
}

