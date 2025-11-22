import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OdooClient } from '@/lib/odoo/client'

/**
 * POST /api/odoo/test-connection
 * Test Odoo connection
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { url, database, username, password } = body

    // Validate required fields
    if (!url || !database || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: url, database, username, password' },
        { status: 400 }
      )
    }

    // Create Odoo client and test connection
    const odooClient = new OdooClient({
      url,
      database,
      username,
      password,
    })

    const result = await odooClient.testConnection()

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Connection failed',
        },
        { status: 200 } // Return 200 but with success: false
      )
    }

    return NextResponse.json({
      success: true,
      version: result.version,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Connection failed',
      },
      { status: 200 } // Return 200 but with success: false
    )
  }
}



