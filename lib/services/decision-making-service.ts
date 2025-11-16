/**
 * Decision Making Service
 *
 * Bu servis, öğrenilmiş pattern'lere göre otonom kararlar verir.
 */

import { LearningService, DecisionContext } from './learning-service'

export interface Decision {
  id: string
  level: 'automatic' | 'suggestion' | 'consultation'
  context: DecisionContext
  decision: string
  confidence: number
  reasoning: string
  requiresApproval: boolean
  timestamp: Date
}

export interface DecisionRule {
  id: string
  name: string
  condition: (context: DecisionContext) => boolean
  action: (context: DecisionContext) => Decision
  priority: number
}

export class DecisionMakingService {
  private static rules: DecisionRule[] = []
  private static initialized = false

  /**
   * Servisi başlat (varsayılan kuralları yükle)
   */
  static initialize(): void {
    if (this.initialized) return
    this.initializeDefaultRules()
    this.initialized = true
  }

  /**
   * Karar seviyesini belirle
   */
  static determineDecisionLevel(context: DecisionContext, confidence: number): Decision['level'] {
    // Yüksek güven ve rutin işler -> Otomatik
    if (confidence > 0.8 && this.isRoutineTask(context)) {
      return 'automatic'
    }

    // Orta güven -> Öneri
    if (confidence > 0.6) {
      return 'suggestion'
    }

    // Düşük güven veya kritik -> Danışma
    return 'consultation'
  }

  /**
   * Rutin görev mi kontrol et
   */
  private static isRoutineTask(context: DecisionContext): boolean {
    const routineTypes = ['email', 'calendar']
    return routineTypes.includes(context.type)
  }

  /**
   * Karar ver
   */
  static async makeDecision(userId: string, context: DecisionContext): Promise<Decision | null> {
    // Öğrenilmiş pattern'den öneri al
    const suggestion = await LearningService.suggestDecision(userId, context)

    if (!suggestion) {
      return null
    }

    // Karar seviyesini belirle
    const level = this.determineDecisionLevel(context, suggestion.confidence)

    // Karar oluştur
    const decision: Decision = {
      id: `decision-${Date.now()}`,
      level,
      context,
      decision: suggestion.suggestion,
      confidence: suggestion.confidence,
      reasoning: suggestion.reasoning,
      requiresApproval: level === 'consultation' || level === 'suggestion',
      timestamp: new Date(),
    }

    return decision
  }

  /**
   * Otomatik karar ver ve uygula
   */
  static async executeAutomaticDecision(
    userId: string,
    context: DecisionContext
  ): Promise<{
    success: boolean
    decision?: Decision
    error?: string
  }> {
    const decision = await DecisionMakingService.makeDecision(userId, context)

    if (!decision) {
      return { success: false, error: 'No decision pattern found' }
    }

    if (decision.level !== 'automatic') {
      return { success: false, error: 'Decision requires approval', decision }
    }

    // Kararı uygula (context tipine göre)
    try {
      switch (context.type) {
        case 'email':
          // Email otomatik cevaplama
          // TODO: Email service'e entegre et
          break
        case 'calendar':
          // Takvim otomatik planlama
          // TODO: Calendar service'e entegre et
          break
        default:
          return {
            success: false,
            error: 'Automatic execution not supported for this context type',
          }
      }

      // Kararı kaydet
      LearningService.recordDecision(userId, context, decision.decision, 'success')

      return { success: true, decision }
    } catch (error: any) {
      LearningService.recordDecision(userId, context, decision.decision, 'failure')
      return { success: false, error: error.message, decision }
    }
  }

  /**
   * Öneri oluştur
   */
  static async generateSuggestion(userId: string, context: DecisionContext): Promise<Decision | null> {
    const decision = await DecisionMakingService.makeDecision(userId, context)

    if (!decision || decision.level === 'automatic') {
      return decision
    }

    return decision
  }

  /**
   * Karar kuralları ekle
   */
  static addRule(rule: DecisionRule): void {
    this.rules.push(rule)
    this.rules.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Kuralları uygula
   */
  static applyRules(context: DecisionContext): Decision | null {
    for (const rule of this.rules) {
      if (rule.condition(context)) {
        return rule.action(context)
      }
    }
    return null
  }

  /**
   * Varsayılan kuralları oluştur
   */
  static initializeDefaultRules(): void {
    // Email kuralları
    this.addRule({
      id: 'email-routine-response',
      name: 'Rutin Email Cevaplama',
      priority: 10,
      condition: context => context.type === 'email' && context.data?.category === 'routine',
      action: context => ({
        id: `auto-${Date.now()}`,
        level: 'automatic',
        context,
        decision: 'auto-reply',
        confidence: 0.9,
        reasoning: 'Rutin email, otomatik cevaplanabilir',
        requiresApproval: false,
        timestamp: new Date(),
      }),
    })

    // Calendar kuralları
    this.addRule({
      id: 'calendar-optimal-time',
      name: 'Optimal Zaman Önerisi',
      priority: 8,
      condition: context => context.type === 'calendar' && context.data?.action === 'schedule',
      action: context => ({
        id: `suggestion-${Date.now()}`,
        level: 'suggestion',
        context,
        decision: 'suggest-optimal-time',
        confidence: 0.75,
        reasoning: 'Geçmiş tercihlerinize göre optimal zaman önerisi',
        requiresApproval: true,
        timestamp: new Date(),
      }),
    })
  }
}
