import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTemplateVersionTestService } from '@/lib/services/template-version-test-service'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: versionId } = await params

  try {
    const testService = getTemplateVersionTestService()
    const testSuite = await testService.runTests(versionId)

    return NextResponse.json({ testSuite })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: versionId } = await params

  try {
    const testService = getTemplateVersionTestService()
    const testResults = await testService.getTestResults(versionId)

    return NextResponse.json({ testResults })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

