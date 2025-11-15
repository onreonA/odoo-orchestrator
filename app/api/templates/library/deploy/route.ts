import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TemplateLibraryService } from '@/lib/services/template-library-service'
import { TemplateDeploymentEngine } from '@/lib/services/template-deployment-engine'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { template_id, company_id, project_id } = body

    if (!template_id || !company_id || !project_id) {
      return NextResponse.json(
        { success: false, error: 'template_id, company_id ve project_id gerekli' },
        { status: 400 }
      )
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get template from library
    const templateLibraryService = new TemplateLibraryService(supabase)
    const { data: template, error: templateError } = await templateLibraryService.getTemplateById(
      template_id
    )

    if (templateError || !template) {
      return NextResponse.json(
        { success: false, error: 'Template bulunamadı' },
        { status: 404 }
      )
    }

    // Get project and verify company match
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('company_id', company_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Proje bulunamadı veya firma eşleşmiyor' },
        { status: 404 }
      )
    }

    // Get company to find Odoo instance
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: 'Firma bulunamadı' },
        { status: 404 }
      )
    }

    // Get Odoo instance by company's odoo_instance_url or create a virtual instance
    // For now, we'll use the company's odoo info to create a deployment config
    // In the future, we should have a proper odoo_instances table with foreign keys
    let odooInstance: any = null
    
    if (company.odoo_instance_url) {
      // Try to find existing instance
      const { data: existingInstance } = await supabase
        .from('odoo_instances')
        .select('*')
        .eq('url', company.odoo_instance_url)
        .eq('company_id', company_id)
        .maybeSingle()

      if (existingInstance) {
        odooInstance = existingInstance
      } else {
        // Create a virtual instance record for deployment
        // This is a temporary solution until proper instance management is implemented
        odooInstance = {
          id: `temp-${company.id}`,
          company_id: company.id,
          url: company.odoo_instance_url,
          database: company.odoo_db_name || 'odoo',
        }
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Firma için Odoo instance bulunamadı. Lütfen önce Odoo instance ekleyin.' },
        { status: 400 }
      )
    }

    // Deploy template
    const deploymentEngine = new TemplateDeploymentEngine()
    const deploymentConfig = {
      instanceId: odooInstance.id,
      templateId: template.id,
      templateType: template.type as any,
      customizations: {},
      userId: user.id,
    }

    const deploymentProgress = await deploymentEngine.deployTemplate(deploymentConfig)

    // Increment usage count
    await templateLibraryService.incrementUsage(template_id)

    return NextResponse.json({
      success: true,
      data: {
        deployment_id: deploymentProgress.deploymentId,
        status: deploymentProgress.status,
        progress: deploymentProgress.progress,
      },
    })
  } catch (error: any) {
    console.error('Template deployment error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Template deployment hatası' },
      { status: 500 }
    )
  }
}

