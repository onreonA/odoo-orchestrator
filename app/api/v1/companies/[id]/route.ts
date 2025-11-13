/**
 * Public API - Company Detail
 *
 * Public API endpoint for single company
 * Sprint 5
 */

import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/middleware/api-auth'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/v1/companies/[id]
 * Get company (requires API key)
 */
export const GET = withApiAuth(
  async (request: NextRequest, { apiKey }, routeContext?: { params?: Promise<{ id: string }> }) => {
    const supabase = await createClient()
    const { id } = await routeContext?.params!

    // Check scopes
    if (!apiKey.scopes.includes('read:companies') && !apiKey.scopes.includes('*')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Build query
    const query = supabase.from('companies').select('*').eq('id', id).single()

    // Filter by company_id if API key is company-scoped
    if (apiKey.company_id && apiKey.company_id !== id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  }
)

/**
 * PUT /api/v1/companies/[id]
 * Update company (requires API key)
 */
export const PUT = withApiAuth(
  async (request: NextRequest, { apiKey }, routeContext?: { params?: Promise<{ id: string }> }) => {
    // Check scopes
    if (!apiKey.scopes.includes('write:companies') && !apiKey.scopes.includes('*')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await routeContext?.params!
    const body = await request.json()
    const supabase = await createClient()

    // Check company access
    if (apiKey.company_id && apiKey.company_id !== id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Update company
    const { data, error } = await supabase
      .from('companies')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  }
)

/**
 * DELETE /api/v1/companies/[id]
 * Delete company (requires API key)
 */
export const DELETE = withApiAuth(
  async (request: NextRequest, { apiKey }, routeContext?: { params?: Promise<{ id: string }> }) => {
    // Check scopes
    if (!apiKey.scopes.includes('write:companies') && !apiKey.scopes.includes('*')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await routeContext?.params!
    const supabase = await createClient()

    // Check company access
    if (apiKey.company_id && apiKey.company_id !== id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Delete company
    const { error } = await supabase.from('companies').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  }
)
