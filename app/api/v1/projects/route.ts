/**
 * Public API - Projects
 * 
 * Public API endpoint for projects
 * Sprint 5
 */

import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/middleware/api-auth'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/v1/projects
 * List projects (requires API key)
 */
export const GET = withApiAuth(async (request: NextRequest, { apiKey }) => {
  const supabase = await createClient()

  // Check scopes
  if (!apiKey.scopes.includes('read:projects') && !apiKey.scopes.includes('*')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')

  // Build query
  let query = supabase.from('projects').select('*').order('created_at', { ascending: false })

  // Filter by company_id
  if (apiKey.company_id) {
    query = query.eq('company_id', apiKey.company_id)
  } else if (companyId) {
    query = query.eq('company_id', companyId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, data })
})

/**
 * POST /api/v1/projects
 * Create project (requires API key)
 */
export const POST = withApiAuth(async (request: NextRequest, { apiKey }) => {
  // Check scopes
  if (!apiKey.scopes.includes('write:projects') && !apiKey.scopes.includes('*')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json()
  const supabase = await createClient()

  // Ensure company_id matches API key scope
  if (apiKey.company_id && body.company_id !== apiKey.company_id) {
    return NextResponse.json({ error: 'Invalid company_id' }, { status: 403 })
  }

  // Create project
  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...body,
      created_by: apiKey.user_id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
})

