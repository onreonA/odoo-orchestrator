import { openai } from '../openai'

/**
 * Calendar Agent - Takvim optimizasyonu için AI agent
 *
 * Görevleri:
 * 1. Optimal randevu zamanı bul
 * 2. Toplantı hazırlığı yap
 * 3. Enerji seviyesini optimize et
 * 4. Çakışmaları çöz
 */
export class CalendarAgent {
  /**
   * Optimal randevu zamanı öner
   */
  async suggestOptimalTime(request: {
    duration: number // dakika
    preferredTimes?: string[] // Örnek: ["09:00-12:00", "14:00-17:00"]
    requiredAttendees?: string[]
    meetingType: 'discovery' | 'review' | 'support' | 'planning'
    companyId?: string
  }): Promise<{
    suggestedTimes: Array<{
      start: string // ISO datetime
      end: string
      score: number // 0-100
      reason: string
    }>
    bestTime: {
      start: string
      end: string
      reason: string
    }
  }> {
    const prompt = `
Aşağıdaki kriterlere göre optimal toplantı zamanı öner:

Süre: ${request.duration} dakika
Toplantı Tipi: ${request.meetingType}
Tercih Edilen Saatler: ${request.preferredTimes?.join(', ') || 'Yok'}
Gerekli Katılımcılar: ${request.requiredAttendees?.join(', ') || 'Yok'}

Dikkate alınacak faktörler:
- Enerji seviyesi (sabah: yüksek, öğleden sonra: orta)
- Toplantı tipine göre optimal zaman
- Çakışmalar
- Müşteri zaman dilimi

JSON formatında döndür:
{
  "suggestedTimes": [
    {
      "start": "2024-11-10T09:00:00Z",
      "end": "2024-11-10T10:00:00Z",
      "score": 95,
      "reason": "Sabah yüksek enerji, müşteri için uygun"
    }
  ],
  "bestTime": {
    "start": "2024-11-10T09:00:00Z",
    "end": "2024-11-10T10:00:00Z",
    "reason": "En optimal zaman"
  }
}
    `.trim()

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Sen bir takvim optimizasyon uzmanısın. Optimal toplantı zamanları öneriyorsun.',
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
   * Toplantı hazırlığı yap
   */
  async prepareMeeting(context: {
    companyId: string
    meetingType: 'discovery' | 'review' | 'support' | 'planning'
    attendees: string[]
    previousMeetings?: Array<{
      date: string
      notes: string
    }>
  }): Promise<{
    agenda: string[]
    keyPoints: string[]
    questions: string[]
    documents: string[]
    preparationTime: number // dakika
  }> {
    const prompt = `
Aşağıdaki bilgilere göre toplantı hazırlığı yap:

Firma ID: ${context.companyId}
Toplantı Tipi: ${context.meetingType}
Katılımcılar: ${context.attendees.join(', ')}

${
  context.previousMeetings
    ? `Önceki Toplantılar:\n${context.previousMeetings.map(m => `- ${m.date}: ${m.notes.substring(0, 100)}...`).join('\n')}`
    : 'Önceki toplantı yok'
}

Lütfen hazırla:
1. Gündem maddeleri
2. Önemli noktalar
3. Sorulacak sorular
4. Gerekli dokümanlar
5. Hazırlık süresi (dakika)

JSON formatında döndür.
    `.trim()

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'Sen bir toplantı hazırlık uzmanısın. Toplantılar için detaylı hazırlık yapıyorsun.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  }

  /**
   * Günlük takvim optimizasyonu
   */
  async optimizeDailySchedule(
    day: string,
    meetings: Array<{
      id: string
      start: string
      end: string
      type: string
      priority: 'high' | 'medium' | 'low'
      companyId?: string
    }>
  ): Promise<{
    optimizedSchedule: Array<{
      id: string
      suggestedStart: string
      suggestedEnd: string
      reason: string
    }>
    energyLevels: Array<{
      time: string
      level: 'high' | 'medium' | 'low'
    }>
    recommendations: string[]
  }> {
    const prompt = `
Aşağıdaki günlük takvimi optimize et:

Tarih: ${day}
Toplantılar:
${meetings.map(m => `- ${m.id}: ${m.start} - ${m.end} (${m.type}, ${m.priority})`).join('\n')}

Optimizasyon kriterleri:
- Enerji seviyesine göre sıralama
- Kritik toplantılar için en iyi zaman
- Mola süreleri
- Geçiş süreleri

JSON formatında döndür:
{
  "optimizedSchedule": [...],
  "energyLevels": [...],
  "recommendations": [...]
}
    `.trim()

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Sen bir takvim optimizasyon uzmanısın. Günlük takvimleri optimize ediyorsun.',
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
}
