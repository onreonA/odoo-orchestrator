/**
 * Public API - Companies
 * 
 * Public API endpoint for companies
 * Sprint 5
 */

import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/middleware/api-auth'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/v1/companies
 * List companies (requires API key)
 */
export const GET = withApiAuth(async (request: NextRequest, { apiKey }) => {
  const supabase = await createClient()

  // Check scopes
  if (!apiKey.scopes.includes('read:companies') && !apiKey.scopes.includes('*')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Build query
  let query = supabase.from('companies').select('*').order('created_at', { ascending: false })

  // Filter by company_id if API key is company-scoped
  if (apiKey.company_id) {
    query = query.eq('id', apiKey.company_id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, data })
})

/**
 * POST /api/v1/companies
 * Create company (requires API key)
 */
export const POST = withApiAuth(async (request: NextRequest, { apiKey }) => {
  // Check scopes
  if (!apiKey.scopes.includes('write:companies') && !apiKey.scopes.includes('*')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json()
  const supabase = await createClient()

  // Create company
  const { data, error } = await supabase
    .from('companies')
    .insert({
      ...body,
      created_by: apiKey.user_id, // Use API key owner as creator
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
})

