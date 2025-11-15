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

    // Get Odoo instance from odoo_instances table
    // First try to get active instance, if not found, get any instance for the company
    let { data: odooInstance, error: instanceError } = await supabase
      .from('odoo_instances')
      .select('*')
      .eq('company_id', company_id)
      .eq('status', 'active')
      .maybeSingle()

    // If no active instance found, try to get any instance for the company
    if (!odooInstance) {
      const { data: anyInstance, error: anyInstanceError } = await supabase
        .from('odoo_instances')
        .select('*')
        .eq('company_id', company_id)
        .maybeSingle()
      
      if (!anyInstanceError && anyInstance) {
        odooInstance = anyInstance
        instanceError = null
      }
    }

    if (instanceError) {
      console.error('Error fetching Odoo instance:', instanceError)
      return NextResponse.json(
        { success: false, error: 'Odoo instance sorgulanırken hata oluştu' },
        { status: 500 }
      )
    }

    if (!odooInstance) {
      // Fallback: Check if company has odoo_instance_url (legacy support)
      if (company.odoo_instance_url) {
        // Create a virtual instance record for deployment
        // This is a temporary solution for companies that haven't migrated to odoo_instances table
        const virtualInstance = {
          id: `temp-${company.id}`,
          company_id: company.id,
          instance_url: company.odoo_instance_url,
          database_name: company.odoo_db_name || 'odoo',
          version: company.odoo_version || '19.0',
        }
        
        // Use virtual instance
        const deploymentEngine = new TemplateDeploymentEngine()
        const deploymentConfig = {
          instanceId: virtualInstance.id,
          templateId: template.template_id, // Use template_id (TEXT) not id (UUID)
          templateType: template.type as any,
          customizations: {},
          userId: user.id,
        }

        const deploymentProgress = await deploymentEngine.deployTemplate(deploymentConfig)
        await templateLibraryService.incrementUsage(template_id)

        return NextResponse.json({
          success: true,
          data: {
            deployment_id: deploymentProgress.deploymentId,
            status: deploymentProgress.status,
            progress: deploymentProgress.progress,
          },
        })
      } else {
        return NextResponse.json(
          { success: false, error: 'Firma için Odoo instance bulunamadı. Lütfen önce Odoo instance ekleyin.' },
          { status: 400 }
        )
      }
    }

    // Deploy template
    const deploymentEngine = new TemplateDeploymentEngine()
    const deploymentConfig = {
      instanceId: odooInstance.id,
      templateId: template.template_id, // Use template_id (TEXT) not id (UUID)
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

