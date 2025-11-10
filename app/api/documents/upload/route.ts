/**
 * Document Upload API
 * 
 * Doküman yükleme endpoint'i
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DocumentService } from '@/lib/services/document-service'

/**
 * POST /api/documents/upload
 * Doküman yükle ve kaydet
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string | null
    const category = formData.get('category') as string || 'general'
    const projectId = formData.get('projectId') as string | null
    const tags = formData.get('tags')?.toString().split(',').filter(Boolean) || []
    const isPublic = formData.get('isPublic') === 'true'

    if (!file || !title) {
      return NextResponse.json({ error: 'File and title are required' }, { status: 400 })
    }

    // Get user's company_id
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'User company not found' }, { status: 400 })
    }

    // Upload file to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `${profile.company_id}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath)

    // Create document record
    const { data: document, error: docError } = await DocumentService.createDocument({
      company_id: profile.company_id,
      project_id: projectId || undefined,
      title,
      description: description || undefined,
      category,
      file_name: file.name,
      file_path: `documents/${filePath}`,
      file_size: file.size,
      file_type: file.type.split('/')[1] || 'other',
      mime_type: file.type,
      tags: tags.length > 0 ? tags : undefined,
      is_public: isPublic,
      access_level: projectId ? 'project' : 'company',
    })

    if (docError) {
      // Rollback: delete uploaded file
      await supabase.storage.from('documents').remove([filePath])
      return NextResponse.json({ error: docError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...document,
        url: urlData.publicUrl,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

