import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTemplateVersionMergeService } from '@/lib/services/template-version-merge-service'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: baseVersionId } = await params
  const body = await request.json()
  const { source_version_id, target_version_id, conflict_resolutions } = body

  if (!source_version_id || !target_version_id) {
    return NextResponse.json(
      { error: 'Missing source_version_id or target_version_id' },
      { status: 400 }
    )
  }

  try {
    const mergeService = getTemplateVersionMergeService()
    const result = await mergeService.mergeVersions(
      baseVersionId,
      source_version_id,
      target_version_id,
      conflict_resolutions
    )

    return NextResponse.json({ result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}





