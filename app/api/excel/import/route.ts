import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ExcelImportService } from '@/lib/services/excel-import-service'

/**
 * POST /api/excel/import
 * Excel dosyasını Odoo'ya import et
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

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const importType = formData.get('import_type') as string | null // 'products', 'bom', 'employees', 'custom'
    const companyId = formData.get('company_id') as string | null
    const odooUrl = formData.get('odoo_url') as string | null
    const odooDatabase = formData.get('odoo_database') as string | null
    const odooUsername = formData.get('odoo_username') as string | null
    const odooPassword = formData.get('odoo_password') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!importType || !companyId || !odooUrl || !odooDatabase || !odooUsername || !odooPassword) {
      return NextResponse.json(
        { error: 'Missing required fields: import_type, company_id, odoo_config' },
        { status: 400 }
      )
    }

    // Get company Odoo config if not provided
    let finalOdooConfig = {
      url: odooUrl,
      database: odooDatabase,
      username: odooUsername,
      password: odooPassword,
    }

    // If company has Odoo config, use it
    if (companyId) {
      const { data: company } = await supabase
        .from('companies')
        .select('odoo_instance_url, odoo_db_name')
        .eq('id', companyId)
        .single()

      if (company?.odoo_instance_url && company?.odoo_db_name) {
        finalOdooConfig = {
          url: company.odoo_instance_url,
          database: company.odoo_db_name,
          username: odooUsername,
          password: odooPassword,
        }
      }
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Import based on type
    let result
    switch (importType) {
      case 'products':
        result = await ExcelImportService.importProducts(buffer, finalOdooConfig)
        break
      case 'bom':
        result = await ExcelImportService.importBOM(buffer, finalOdooConfig)
        break
      case 'employees':
        result = await ExcelImportService.importEmployees(buffer, finalOdooConfig)
        break
      default:
        return NextResponse.json({ error: 'Invalid import type' }, { status: 400 })
    }

    return NextResponse.json({ success: result.success, data: result })
  } catch (error: any) {
    console.error('Excel import error:', error)
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 })
  }
}




