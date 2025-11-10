/**
 * Template Service
 * 
 * Template kaydetme, uygulama ve yönetim servisi
 */

import { createClient } from '@/lib/supabase/server'
import { OdooClient } from '@/lib/odoo/client'

export interface TemplateModule {
  name: string
  technical_name: string
  category: string
  config?: Record<string, any>
}

export interface TemplateConfiguration {
  type: 'model' | 'view' | 'report' | 'workflow' | 'security'
  name: string
  code?: string
  settings?: Record<string, any>
}

export interface TemplateWorkflow {
  name: string
  steps: Array<{
    name: string
    action: string
    conditions?: Record<string, any>
  }>
  conditions?: Record<string, any>
}

export interface TemplateCustomField {
  model: string
  field_name: string
  field_type: string
  options?: Record<string, any>
}

export interface TemplateReport {
  name: string
  template: string
  format: 'pdf' | 'xlsx' | 'html'
}

export interface CreateTemplateInput {
  name: string
  description?: string
  industry: string
  modules: TemplateModule[]
  configurations?: TemplateConfiguration[]
  workflows?: TemplateWorkflow[]
  custom_fields?: TemplateCustomField[]
  reports?: TemplateReport[]
  source_company_id?: string
  source_project_id?: string
}

export interface ApplyTemplateInput {
  template_id: string
  company_id: string
  project_id?: string
  odoo_config: {
    url: string
    database: string
    username: string
    password: string
  }
  customizations?: Record<string, any>
}

export class TemplateService {
  /**
   * Template oluştur
   */
  static async createTemplate(input: CreateTemplateInput, userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('templates')
      .insert({
        name: input.name,
        description: input.description,
        industry: input.industry,
        modules: input.modules,
        configurations: input.configurations || [],
        workflows: input.workflows || [],
        custom_fields: input.custom_fields || [],
        reports: input.reports || [],
        source_company_id: input.source_company_id || null,
        source_project_id: input.source_project_id || null,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Template creation failed: ${error.message}`)
    }

    return data
  }

  /**
   * Template'leri listele
   */
  static async listTemplates(filters?: { industry?: string; is_active?: boolean }) {
    const supabase = await createClient()

    let query = supabase.from('templates').select('*')

    if (filters?.industry) {
      query = query.eq('industry', filters.industry) as any
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active) as any
    } else {
      query = query.eq('is_active', true) as any
    }

    const { data, error } = await (query as any).order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to list templates: ${error.message}`)
    }

    return data || []
  }

  /**
   * Template'i ID ile getir
   */
  static async getTemplateById(templateId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error) {
      throw new Error(`Template not found: ${error.message}`)
    }

    return data
  }

  /**
   * Template'i firmaya uygula
   */
  static async applyTemplate(input: ApplyTemplateInput, userId: string) {
    const supabase = await createClient()

    // 1. Template'i getir
    const template = await this.getTemplateById(input.template_id)

    // 2. Application kaydı oluştur
    const { data: application, error: appError } = await supabase
      .from('template_applications')
      .insert({
        template_id: input.template_id,
        company_id: input.company_id,
        project_id: input.project_id || null,
        status: 'applying',
        applied_by: userId,
        customizations: input.customizations || {},
      })
      .select()
      .single()

    if (appError) {
      throw new Error(`Failed to create application: ${appError.message}`)
    }

    try {
      // 3. Odoo'ya bağlan
      const odooClient = new OdooClient(input.odoo_config)
      await odooClient.connect()

      // 4. Modülleri yükle
      const appliedModules: any[] = []
      for (const module of template.modules as TemplateModule[]) {
        try {
          await odooClient.installModule(module.technical_name)
          appliedModules.push({
            technical_name: module.technical_name,
            status: 'installed',
          })
        } catch (error: any) {
          appliedModules.push({
            technical_name: module.technical_name,
            status: 'failed',
            error: error.message,
          })
        }
      }

      // 5. Konfigürasyonları uygula (basit versiyon - ileride genişletilebilir)
      const appliedConfigurations: any[] = []
      for (const config of (template.configurations || []) as TemplateConfiguration[]) {
        // Bu kısım ileride AI agent ile kod üretip deploy edilecek
        appliedConfigurations.push({
          type: config.type,
          name: config.name,
          status: 'pending', // İleride AI agent tarafından işlenecek
        })
      }

      // 6. Application'ı tamamla
      const { error: updateError } = await supabase
        .from('template_applications')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          applied_modules: appliedModules,
          applied_configurations: appliedConfigurations,
        })
        .eq('id', application.id)

      if (updateError) {
        throw new Error(`Failed to update application: ${updateError.message}`)
      }

      // 7. Template kullanım sayısını artır
      await supabase
        .from('templates')
        .update({
          usage_count: (template.usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', input.template_id)

      return {
        ...application,
        applied_modules: appliedModules,
        applied_configurations: appliedConfigurations,
      }
    } catch (error: any) {
      // Hata durumunda application'ı güncelle
      await supabase
        .from('template_applications')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', application.id)

      throw error
    }
  }

  /**
   * Template'i firmadan oluştur (mevcut konfigürasyonu template'e dönüştür)
   */
  static async createTemplateFromCompany(
    companyId: string,
    projectId: string | undefined,
    templateName: string,
    industry: string,
    userId: string
  ) {
    const supabase = await createClient()

    // 1. Company'nin Odoo modüllerini getir
    const { data: modules } = await supabase
      .from('odoo_modules')
      .select('*')
      .eq('company_id', companyId)

    // 2. Konfigürasyonları getir
    const { data: configurations } = await supabase
      .from('configurations')
      .select('*')
      .eq('company_id', companyId)

    // 3. Template oluştur
    const templateModules: TemplateModule[] =
      modules?.map(m => ({
        name: m.name,
        technical_name: m.technical_name,
        category: m.category || '',
        config: {
          customization_level: m.customization_level,
          configuration_notes: m.configuration_notes,
        },
      })) || []

    const templateConfigurations: TemplateConfiguration[] =
      configurations?.map(c => ({
        type: c.type as any,
        name: c.name,
        code: c.generated_code || undefined,
        settings: c.requirements || {},
      })) || []

    return this.createTemplate(
      {
        name: templateName,
        industry,
        modules: templateModules,
        configurations: templateConfigurations,
        source_company_id: companyId,
        source_project_id: projectId,
      },
      userId
    )
  }
}

