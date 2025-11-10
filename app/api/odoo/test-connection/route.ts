import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OdooClient } from '@/lib/odoo/client'

/**
 * POST /api/odoo/test-connection
 * Odoo bağlantısını test et
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
    const { url, database, username, password, companyId } = body

    if (!url || !database || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: url, database, username, password' },
        { status: 400 }
      )
    }

    // Test connection
    const odooClient = new OdooClient({
      url,
      database,
      username,
      password,
    })

    const result = await odooClient.testConnection()

    if (result.success && companyId) {
      // Update company with Odoo connection info
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          odoo_instance_url: url,
          odoo_db_name: database,
          odoo_version: result.version || '19.0',
        })
        .eq('id', companyId)

      if (updateError) {
        console.error('Failed to update company:', updateError)
        // Don't fail the request, connection test succeeded
      }
    }

    return NextResponse.json({
      success: result.success,
      version: result.version,
      error: result.error,
    })
  } catch (error: any) {
    console.error('Odoo connection test error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Connection test failed' },
      { status: 500 }
    )
  }
}




