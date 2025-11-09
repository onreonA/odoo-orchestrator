import { openai } from '../openai'
import { claude } from '../claude'

/**
 * Email Handler Agent - Email yönetimi için AI agent
 *
 * Görevleri:
 * 1. Email'leri kategorize et
 * 2. Öncelik belirle
 * 3. Otomatik cevap yaz
 * 4. Acil durumları tespit et
 */
export class EmailHandlerAgent {
  /**
   * Email'i analiz et ve kategorize et
   */
  async categorizeEmail(email: {
    subject: string
    body: string
    from: string
    date: string
  }): Promise<{
    category: 'support' | 'sales' | 'urgent' | 'info' | 'spam'
    priority: 'high' | 'medium' | 'low'
    sentiment: 'positive' | 'neutral' | 'negative'
    requiresResponse: boolean
    estimatedResponseTime: number // dakika
  }> {
    const prompt = `
Aşağıdaki email'i analiz et ve kategorize et:

Konu: ${email.subject}
Gönderen: ${email.from}
Tarih: ${email.date}
İçerik:
${email.body}

Lütfen şunları belirle:
1. Kategori: support, sales, urgent, info, spam
2. Öncelik: high, medium, low
3. Duygu: positive, neutral, negative
4. Cevap gerekiyor mu: true/false
5. Tahmini cevap süresi (dakika)

JSON formatında döndür.
    `.trim()

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: "Sen bir email yönetim uzmanısın. Email'leri analiz edip kategorize ediyorsun.",
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  }

  /**
   * Email için otomatik cevap önerisi oluştur
   */
  async generateResponse(
    email: {
      subject: string
      body: string
      from: string
    },
    context?: {
      companyName?: string
      previousEmails?: Array<{ subject: string; body: string }>
    }
  ): Promise<{
    response: string
    tone: 'professional' | 'friendly' | 'formal'
    suggestedActions: string[]
  }> {
    const contextPrompt = context?.companyName ? `Firma: ${context.companyName}\n` : ''

    const previousEmailsPrompt = context?.previousEmails
      ? `Önceki Email'ler:\n${context.previousEmails.map(e => `- ${e.subject}: ${e.body.substring(0, 100)}...`).join('\n')}\n`
      : ''

    const prompt = `
Aşağıdaki email'e profesyonel bir cevap yaz:

${contextPrompt}
${previousEmailsPrompt}
Konu: ${email.subject}
Gönderen: ${email.from}
İçerik:
${email.body}

Cevap:
- Profesyonel ve yardımcı olmalı
- Türkçe yazılmalı
- Kısa ve öz olmalı
- Önerilen aksiyonlar belirtilmeli

JSON formatında döndür:
{
  "response": "cevap metni",
  "tone": "professional|friendly|formal",
  "suggestedActions": ["aksiyon1", "aksiyon2"]
}
    `.trim()

    const response = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      try {
        return JSON.parse(content.text)
      } catch {
        // Eğer JSON değilse, direkt metin olarak döndür
        return {
          response: content.text,
          tone: 'professional' as const,
          suggestedActions: [],
        }
      }
    }

    throw new Error('Failed to generate response')
  }

  /**
   * Acil durumları tespit et
   */
  async detectUrgency(email: { subject: string; body: string; from: string }): Promise<{
    isUrgent: boolean
    urgencyLevel: 'critical' | 'high' | 'medium' | 'low'
    reason: string
    suggestedAction: string
  }> {
    const prompt = `
Aşağıdaki email'in aciliyet seviyesini belirle:

Konu: ${email.subject}
Gönderen: ${email.from}
İçerik:
${email.body}

Acil durum göstergeleri:
- Production sistem hatası
- Kritik müşteri sorunu
- Güvenlik ihlali
- Yasal sorun
- Deadline yaklaşıyor

JSON formatında döndür:
{
  "isUrgent": true/false,
  "urgencyLevel": "critical|high|medium|low",
  "reason": "neden",
  "suggestedAction": "ne yapılmalı"
}
    `.trim()

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            "Sen bir acil durum analisti. Email'lerdeki aciliyet seviyesini tespit ediyorsun.",
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  }

  /**
   * Toplu email analizi
   */
  async batchProcessEmails(
    emails: Array<{
      id: string
      subject: string
      body: string
      from: string
      date: string
    }>
  ): Promise<
    Array<{
      id: string
      category: string
      priority: string
      isUrgent: boolean
      suggestedResponse?: string
    }>
  > {
    const results = await Promise.all(
      emails.map(async email => {
        const [category, urgency] = await Promise.all([
          this.categorizeEmail(email),
          this.detectUrgency(email),
        ])

        return {
          id: email.id,
          category: category.category,
          priority: category.priority,
          isUrgent: urgency.isUrgent,
        }
      })
    )

    // Öncelik sırasına göre sırala
    return results.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1
      if (!a.isUrgent && b.isUrgent) return 1
      if (a.priority === 'high' && b.priority !== 'high') return -1
      if (a.priority !== 'high' && b.priority === 'high') return 1
      return 0
    })
  }
}
