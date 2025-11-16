import { createClient } from '@/lib/supabase/server'

// Lazy load OpenAI to avoid issues with test mocks
function getOpenAI() {
  // Use dynamic import to allow test mocks to work
  const OpenAI = require('openai').default
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'test-key',
  })
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface GenerateResponseOptions {
  conversationHistory?: ConversationMessage[]
}

interface Source {
  id: string
  title: string
  content: string
}

interface GenerateResponseResult {
  message: string
  sources: Source[]
  confidence: number
}

export class ChatbotService {
  /**
   * Generate chatbot response
   */
  static async generateResponse(
    message: string,
    options?: GenerateResponseOptions
  ): Promise<{ data: GenerateResponseResult | null; error: string | null }> {
    try {
      const supabase = await createClient()

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return { data: null, error: 'Unauthorized' }
      }

      // Get user profile to get company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        return { data: null, error: 'User profile not found' }
      }

      // Get knowledge base entries
      const { data: knowledgeEntries } = await supabase
        .from('knowledge_base')
        .select('id, title, content')
        .or(`company_id.eq.${profile.company_id},company_id.is.null`)
        .limit(5)

      // Build context from knowledge base
      const context =
        knowledgeEntries?.map(kb => `Title: ${kb.title}\nContent: ${kb.content}`).join('\n\n') || ''

      // Build messages for OpenAI
      const messages: ConversationMessage[] = [
        {
          role: 'system',
          content: `You are a helpful assistant for Odoo implementation projects. Use the following knowledge base context to answer questions accurately:

${context}

If the context doesn't contain relevant information, answer based on your general knowledge about Odoo and ERP systems.`,
        },
        ...(options?.conversationHistory || []),
        {
          role: 'user',
          content: message,
        },
      ]

      // Call OpenAI
      const openai = getOpenAI()
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages as any,
        temperature: 0.7,
      })

      const responseMessage = completion.choices[0]?.message?.content || 'No response generated'

      // Map knowledge entries to sources
      const sources: Source[] =
        knowledgeEntries?.map(kb => ({
          id: kb.id,
          title: kb.title,
          content: kb.content.substring(0, 200), // Truncate for response
        })) || []

      return {
        data: {
          message: responseMessage,
          sources,
          confidence: sources.length > 0 ? 0.8 : 0.5,
        },
        error: null,
      }
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to generate response' }
    }
  }

  /**
   * Get project information for a company
   */
  static async getProjectInfo(companyId: string): Promise<string> {
    try {
      const supabase = await createClient()

      const { data: projects } = await supabase
        .from('projects')
        .select('name, status, phase, completion_percentage')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!projects || projects.length === 0) {
        return 'Henüz aktif proje bulunmuyor.'
      }

      const projectInfo = projects
        .map(
          p =>
            `- ${p.name}: ${p.status} (${p.phase || 'N/A'}), %${p.completion_percentage || 0} tamamlandı`
        )
        .join('\n')

      return `Aktif Projeler:\n${projectInfo}`
    } catch (error: any) {
      return 'Proje bilgileri alınamadı.'
    }
  }
}
