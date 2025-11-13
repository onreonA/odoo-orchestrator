import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MessagingService } from '@/lib/services/messaging-service'
import { openai } from '@/lib/ai/openai'

/**
 * POST /api/messages/ai
 * Handle AI chat commands and generate AI responses
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { threadId, message, context } = body

    if (!threadId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: threadId, message' },
        { status: 400 }
      )
    }

    // Verify user has access to thread
    const { data: thread } = await MessagingService.getThreadById(threadId)
    if (!thread || !thread.participants.includes(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get thread context (company, project, previous messages)
    let companyInfo = null
    if (thread.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('id, name, industry')
        .eq('id', thread.company_id)
        .single()
      companyInfo = company
    }

    // Get recent messages for context
    const { data: recentMessages } = await MessagingService.getMessages(threadId, { limit: 10 })

    // Build AI prompt
    const systemPrompt = `Sen bir Odoo proje yönetim asistanısın. Kullanıcılara Odoo projeleri, süreçler, modüller ve teknik konularda yardımcı oluyorsun.

${companyInfo ? `Mevcut Firma: ${companyInfo.name} (${companyInfo.industry || 'Bilinmiyor'})` : ''}

Kullanıcı mesajlarına profesyonel, yardımcı ve Türkçe cevap ver. Eğer bir şey bilmiyorsan dürüst ol ve bilmediğini söyle.`

    const conversationHistory =
      recentMessages
        ?.slice(-5)
        .map(m => {
          const isUser = m.sender_id === user.id
          return `${isUser ? 'Kullanıcı' : 'AI'}: ${m.content}`
        })
        .join('\n') || ''

    const userPrompt = `${conversationHistory ? `Önceki Konuşma:\n${conversationHistory}\n\n` : ''}Kullanıcı: ${message}

AI:`

    // Generate AI response
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const aiResponse = response.choices[0].message.content || ''

    // Create AI message in thread
    const { data: aiMessage, error: messageError } = await MessagingService.createMessage(
      {
        thread_id: threadId,
        content: aiResponse,
        message_type: 'ai_response',
      },
      user.id // AI messages are sent by the user who requested them
    )

    if (messageError) {
      return NextResponse.json({ error: messageError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        message: aiMessage,
        response: aiResponse,
      },
    })
  } catch (error: any) {
    console.error('AI Chat Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
