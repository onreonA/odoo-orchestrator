/**
 * Learning Service
 * 
 * Bu servis, kullanıcı davranışlarını öğrenir ve pattern'leri tespit eder.
 */

export interface UserDecision {
  id: string
  userId: string
  context: DecisionContext
  decision: string
  outcome?: 'success' | 'failure' | 'partial'
  timestamp: Date
  confidence?: number
}

export interface DecisionContext {
  type: 'email' | 'calendar' | 'project' | 'company' | 'pricing' | 'other'
  data: any
  options?: string[]
  constraints?: any
}

export interface LearnedPattern {
  id: string
  userId: string
  patternType: 'decision' | 'communication' | 'priority' | 'time_preference'
  pattern: any
  confidence: number
  frequency: number
  lastSeen: Date
  examples: string[]
}

export interface CommunicationStyle {
  formality: 'formal' | 'casual' | 'mixed'
  length: 'short' | 'medium' | 'long'
  tone: 'professional' | 'friendly' | 'direct'
  commonPhrases: string[]
  signatureStyle?: string
}

export class LearningService {
  private static decisions: Map<string, UserDecision[]> = new Map()
  private static patterns: Map<string, LearnedPattern[]> = new Map()

  /**
   * Karar kaydet
   */
  static recordDecision(userId: string, context: DecisionContext, decision: string, outcome?: UserDecision['outcome']): UserDecision {
    const decisionRecord: UserDecision = {
      id: `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      context,
      decision,
      outcome,
      timestamp: new Date(),
    }

    const userDecisions = this.decisions.get(userId) || []
    userDecisions.push(decisionRecord)
    this.decisions.set(userId, userDecisions)

    // Pattern'i güncelle
    this.updatePatterns(userId, decisionRecord)

    return decisionRecord
  }

  /**
   * Pattern'leri güncelle
   */
  private static updatePatterns(userId: string, decision: UserDecision): void {
    const userPatterns = this.patterns.get(userId) || []

    // Decision pattern'ini bul veya oluştur
    let decisionPattern = userPatterns.find(
      (p) => p.patternType === 'decision' && p.pattern.contextType === decision.context.type
    )

    if (!decisionPattern) {
      decisionPattern = {
        id: `pattern-${Date.now()}`,
        userId,
        patternType: 'decision',
        pattern: {
          contextType: decision.context.type,
          commonDecisions: [],
        },
        confidence: 0.5,
        frequency: 0,
        lastSeen: new Date(),
        examples: [],
      }
      userPatterns.push(decisionPattern)
    }

    // Pattern'i güncelle
    decisionPattern.frequency++
    decisionPattern.lastSeen = new Date()
    decisionPattern.examples.push(decision.id)

    // Common decisions listesini güncelle
    const commonDecisions = decisionPattern.pattern.commonDecisions || []
    const existingDecision = commonDecisions.find((d: any) => d.decision === decision.decision)
    if (existingDecision) {
      existingDecision.count++
      if (decision.outcome === 'success') {
        existingDecision.successCount = (existingDecision.successCount || 0) + 1
      }
    } else {
      commonDecisions.push({
        decision: decision.decision,
        count: 1,
        successCount: decision.outcome === 'success' ? 1 : 0,
      })
    }

    // Confidence hesapla
    const totalDecisions = commonDecisions.reduce((sum: number, d: any) => sum + d.count, 0)
    const successRate = commonDecisions.reduce((sum: number, d: any) => sum + (d.successCount || 0), 0) / totalDecisions
    decisionPattern.confidence = Math.min(0.95, 0.5 + successRate * 0.45)

    this.patterns.set(userId, userPatterns)
  }

  /**
   * Kullanıcının karar paternlerini getir
   */
  static getDecisionPatterns(userId: string, contextType?: string): LearnedPattern[] {
    const userPatterns = this.patterns.get(userId) || []
    return userPatterns.filter((p) => {
      if (p.patternType !== 'decision') return false
      if (contextType && p.pattern.contextType !== contextType) return false
      return true
    })
  }

  /**
   * Benzer durumlar için öneri oluştur
   */
  static suggestDecision(userId: string, context: DecisionContext): {
    suggestion: string
    confidence: number
    reasoning: string
  } | null {
    const patterns = this.getDecisionPatterns(userId, context.type)

    if (patterns.length === 0) {
      return null
    }

    // En güvenilir pattern'i bul
    const bestPattern = patterns.sort((a, b) => b.confidence - a.confidence)[0]
    const commonDecisions = bestPattern.pattern.commonDecisions || []

    if (commonDecisions.length === 0) {
      return null
    }

    // En sık kullanılan ve başarılı kararı bul
    const bestDecision = commonDecisions.sort((a: any, b: any) => {
      const aScore = a.count * (a.successCount / a.count)
      const bScore = b.count * (b.successCount / b.count)
      return bScore - aScore
    })[0]

    return {
      suggestion: bestDecision.decision,
      confidence: bestPattern.confidence,
      reasoning: `Geçmiş ${bestPattern.frequency} benzer durumda bu kararı verdiniz ve %${Math.round((bestDecision.successCount / bestDecision.count) * 100)} başarı oranıyla sonuçlandı.`,
    }
  }

  /**
   * İletişim tarzını öğren
   */
  static learnCommunicationStyle(userId: string, email: { subject: string; body: string; recipient?: string }): CommunicationStyle {
    const body = email.body.toLowerCase()
    const subject = email.subject.toLowerCase()

    // Formality analizi
    const formalWords = ['sayın', 'saygılar', 'saygılarımla', 'mümkünse', 'rica ederim']
    const casualWords = ['merhaba', 'selam', 'hey', 'teşekkürler', 'sağol']
    const formalCount = formalWords.filter((w) => body.includes(w) || subject.includes(w)).length
    const casualCount = casualWords.filter((w) => body.includes(w) || subject.includes(w)).length

    let formality: CommunicationStyle['formality'] = 'mixed'
    if (formalCount > casualCount * 2) {
      formality = 'formal'
    } else if (casualCount > formalCount * 2) {
      formality = 'casual'
    }

    // Length analizi
    const wordCount = body.split(/\s+/).length
    let length: CommunicationStyle['length'] = 'medium'
    if (wordCount < 50) {
      length = 'short'
    } else if (wordCount > 200) {
      length = 'long'
    }

    // Tone analizi
    const professionalWords = ['proje', 'süreç', 'rapor', 'analiz', 'strateji']
    const friendlyWords = ['teşekkür', 'güzel', 'harika', 'mükemmel']
    const professionalCount = professionalWords.filter((w) => body.includes(w)).length
    const friendlyCount = friendlyWords.filter((w) => body.includes(w)).length

    let tone: CommunicationStyle['tone'] = 'professional'
    if (friendlyCount > professionalCount) {
      tone = 'friendly'
    } else if (body.includes('lütfen') || body.includes('acil')) {
      tone = 'direct'
    }

    return {
      formality,
      length,
      tone,
      commonPhrases: this.extractCommonPhrases(body),
    }
  }

  /**
   * Yaygın ifadeleri çıkar
   */
  private static extractCommonPhrases(text: string): string[] {
    // Basit bir yaklaşım: en sık kullanılan kelime kombinasyonları
    const words = text.split(/\s+/)
    const phrases: Map<string, number> = new Map()

    // 2-3 kelimelik kombinasyonlar
    for (let i = 0; i < words.length - 1; i++) {
      const phrase2 = `${words[i]} ${words[i + 1]}`
      phrases.set(phrase2, (phrases.get(phrase2) || 0) + 1)

      if (i < words.length - 2) {
        const phrase3 = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
        phrases.set(phrase3, (phrases.get(phrase3) || 0) + 1)
      }
    }

    // En sık kullanılan 5 ifadeyi döndür
    return Array.from(phrases.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phrase]) => phrase)
  }

  /**
   * Öncelik paternlerini öğren
   */
  static learnPriorityPattern(userId: string, tasks: Array<{ id: string; priority: string; completed: boolean; deadline?: Date }>): {
    highPriorityPatterns: string[]
    mediumPriorityPatterns: string[]
    lowPriorityPatterns: string[]
  } {
    const highPriority = tasks.filter((t) => t.priority === 'high' || t.priority === 'urgent')
    const mediumPriority = tasks.filter((t) => t.priority === 'medium' || t.priority === 'normal')
    const lowPriority = tasks.filter((t) => t.priority === 'low')

    return {
      highPriorityPatterns: highPriority.map((t) => t.id),
      mediumPriorityPatterns: mediumPriority.map((t) => t.id),
      lowPriorityPatterns: lowPriority.map((t) => t.id),
    }
  }

  /**
   * Zaman tercihlerini öğren
   */
  static learnTimePreferences(userId: string, meetings: Array<{ startTime: Date; duration: number; type: string }>): {
    preferredHours: number[]
    preferredDays: number[]
    averageMeetingDuration: number
  } {
    const hours = meetings.map((m) => m.startTime.getHours())
    const days = meetings.map((m) => m.startTime.getDay())
    const durations = meetings.map((m) => m.duration)

    // En sık kullanılan saatler
    const hourFrequency = new Map<number, number>()
    hours.forEach((h) => {
      hourFrequency.set(h, (hourFrequency.get(h) || 0) + 1)
    })
    const preferredHours = Array.from(hourFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour)

    // En sık kullanılan günler
    const dayFrequency = new Map<number, number>()
    days.forEach((d) => {
      dayFrequency.set(d, (dayFrequency.get(d) || 0) + 1)
    })
    const preferredDays = Array.from(dayFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day)

    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length

    return {
      preferredHours,
      preferredDays,
      averageMeetingDuration: averageDuration,
    }
  }

  /**
   * Kullanıcının öğrenilmiş pattern'lerini getir
   */
  static getUserPatterns(userId: string): LearnedPattern[] {
    return this.patterns.get(userId) || []
  }

  /**
   * Pattern confidence'ını güncelle
   */
  static updatePatternConfidence(userId: string, patternId: string, newConfidence: number): void {
    const userPatterns = this.patterns.get(userId) || []
    const pattern = userPatterns.find((p) => p.id === patternId)
    if (pattern) {
      pattern.confidence = Math.max(0, Math.min(1, newConfidence))
      this.patterns.set(userId, userPatterns)
    }
  }
}

