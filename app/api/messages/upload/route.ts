import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/messages/upload
 * Upload a file attachment for messages
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
    const threadId = formData.get('threadId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Get filename - try multiple ways to handle test environment
    let fileName = 'file'
    if (file instanceof File) {
      fileName = file.name
    } else if ((file as any).name) {
      fileName = (file as any).name
    } else {
      // Try to get from formData entry
      const fileEntry = formData.get('file')
      if (fileEntry instanceof File) {
        fileName = fileEntry.name
      }
    }

    if (!threadId) {
      return NextResponse.json({ error: 'No threadId provided' }, { status: 400 })
    }

    // Verify user has access to thread
    const { data: thread } = await supabase
      .from('message_threads')
      .select('id, participants')
      .eq('id', threadId)
      .single()

    if (!thread || !thread.participants.includes(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Upload to Supabase Storage
    const originalFileName = fileName
    const fileExt = originalFileName.split('.').pop() || 'bin'
    const storageFileName = `${user.id}/${threadId}/${Date.now()}.${fileExt}`
    const filePath = `message-attachments/${storageFileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 400 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('attachments').getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      data: {
        name: originalFileName,
        url: publicUrl,
        size: (file as any).size || 0,
        type: (file as any).type || 'application/octet-stream',
        path: filePath,
      },
    })
  } catch (error: any) {
    console.error('File Upload Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
