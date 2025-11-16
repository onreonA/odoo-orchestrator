import { createClient } from '@/lib/supabase/server'
import { ConfigurationGeneratorAgent } from '@/lib/ai/agents/configuration-generator-agent'

export interface KickoffAnswers {
  modules: Array<{
    name: string
    answers: Record<string, any>
  }>
  companyInfo: {
    name: string
    industry: string
    subCategory?: string
    businessModel?: string
  }
}

export interface CompanyInfo {
  name: string
  industry: string
  subCategory?: string
  businessModel?: string
  size?: string
}

/**
 * Service to generate configurations from kick-off answers
 */
export class KickoffConfigurationService {
  private supabase: Awaited<ReturnType<typeof createClient>> | null = null

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Extract kick-off answers from discovery data
   */
  async extractKickoffAnswers(
    companyId: string,
    discoveryId?: string
  ): Promise<KickoffAnswers | null> {
    const supabase = await this.getSupabase()

    // Get company info
    const { data: company } = await supabase
      .from('companies')
      .select('name, industry, size')
      .eq('id', companyId)
      .single()

    if (!company) {
      return null
    }

    // Get discovery data if discoveryId provided
    let discoveryData: any = null
    if (discoveryId) {
      const { data: discovery } = await supabase
        .from('discoveries')
        .select('*')
        .eq('id', discoveryId)
        .single()

      discoveryData = discovery
    } else {
      // Get latest discovery for this company
      const { data: latestDiscovery } = await supabase
        .from('discoveries')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      discoveryData = latestDiscovery
    }

    // Extract module answers from discovery data
    const modules: Array<{ name: string; answers: Record<string, any> }> = []

    if (discoveryData?.extracted_requirements) {
      const requirements = discoveryData.extracted_requirements

      // Map requirements to modules
      if (requirements.crm || requirements.sales) {
        modules.push({
          name: 'CRM & Satış',
          answers: requirements.crm || requirements.sales || {},
        })
      }

      if (requirements.mrp || requirements.manufacturing) {
        modules.push({
          name: 'Üretim (MRP)',
          answers: requirements.mrp || requirements.manufacturing || {},
        })
      }

      if (requirements.stock || requirements.inventory) {
        modules.push({
          name: 'Stok Yönetimi',
          answers: requirements.stock || requirements.inventory || {},
        })
      }

      if (requirements.purchase || requirements.procurement) {
        modules.push({
          name: 'Satınalma',
          answers: requirements.purchase || requirements.procurement || {},
        })
      }

      if (requirements.accounting || requirements.finance) {
        modules.push({
          name: 'Muhasebe',
          answers: requirements.accounting || requirements.finance || {},
        })
      }

      if (requirements.hr || requirements.human_resources) {
        modules.push({
          name: 'İnsan Kaynakları',
          answers: requirements.hr || requirements.human_resources || {},
        })
      }

      if (requirements.project || requirements.project_management) {
        modules.push({
          name: 'Proje Yönetimi',
          answers: requirements.project || requirements.project_management || {},
        })
      }

      if (requirements.quality || requirements.quality_control) {
        modules.push({
          name: 'Kalite Kontrol',
          answers: requirements.quality || requirements.quality_control || {},
        })
      }
    }

    // If no modules found, create default structure from AI summary
    if (modules.length === 0 && discoveryData?.ai_summary) {
      const aiSummary = discoveryData.ai_summary
      if (aiSummary.suggested_modules) {
        for (const moduleName of aiSummary.suggested_modules) {
          modules.push({
            name: moduleName,
            answers: {},
          })
        }
      }
    }

    return {
      modules,
      companyInfo: {
        name: company.name,
        industry: company.industry || '',
      },
    }
  }

  /**
   * Generate all configurations from kick-off answers
   */
  async generateAllConfigurations(
    companyId: string,
    instanceId: string,
    discoveryId?: string
  ): Promise<Array<{ configurationId: string; type: string; name: string }>> {
    const supabase = await this.getSupabase()

    // Extract kick-off answers
    const kickoffAnswers = await this.extractKickoffAnswers(companyId, discoveryId)

    if (!kickoffAnswers || kickoffAnswers.modules.length === 0) {
      console.log('[Kickoff Configuration] No kick-off answers found, skipping configuration generation')
      return []
    }

    const generatorAgent = new ConfigurationGeneratorAgent(companyId)
    const generatedConfigurations: Array<{
      configurationId: string
      type: string
      name: string
    }> = []

    // Generate configurations for each module
    for (const module of kickoffAnswers.modules) {
      try {
        // Create natural language input from module answers
        const naturalLanguageInput = this.createNaturalLanguageInput(
          module.name,
          module.answers,
          kickoffAnswers.companyInfo
        )

        // Generate configuration
        const generatedConfig = await generatorAgent.generateFromNaturalLanguage(
          naturalLanguageInput,
          {
            companyId,
            requirements: Object.keys(module.answers),
          }
        )

        generatedConfigurations.push({
          configurationId: generatedConfig.configurationId,
          type: generatedConfig.type,
          name: generatedConfig.name,
        })

        console.log(
          `[Kickoff Configuration] Generated ${generatedConfig.type} configuration: ${generatedConfig.name}`
        )
      } catch (error: any) {
        console.error(
          `[Kickoff Configuration] Failed to generate configuration for module ${module.name}:`,
          error
        )
        // Continue with other modules
      }
    }

    return generatedConfigurations
  }

  /**
   * Create natural language input from module answers
   */
  private createNaturalLanguageInput(
    moduleName: string,
    answers: Record<string, any>,
    companyInfo: CompanyInfo
  ): string {
    const parts: string[] = []

    parts.push(`${companyInfo.name} firması için ${moduleName} modülü konfigürasyonu.`)

    if (companyInfo.industry) {
      parts.push(`Sektör: ${companyInfo.industry}.`)
    }

    if (companyInfo.subCategory) {
      parts.push(`Alt kategori: ${companyInfo.subCategory}.`)
    }

    parts.push('Gereksinimler:')

    for (const [key, value] of Object.entries(answers)) {
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object') {
          parts.push(`- ${key}: ${JSON.stringify(value)}`)
        } else {
          parts.push(`- ${key}: ${value}`)
        }
      }
    }

    return parts.join('\n')
  }
}

let kickoffConfigurationServiceInstance: KickoffConfigurationService | null = null

export function getKickoffConfigurationService(): KickoffConfigurationService {
  if (!kickoffConfigurationServiceInstance) {
    kickoffConfigurationServiceInstance = new KickoffConfigurationService()
  }
  return kickoffConfigurationServiceInstance
}

