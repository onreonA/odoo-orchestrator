import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getMeetingPreparationService } from '@/lib/services/meeting-preparation-service'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: meetingId } = await params

  try {
    const preparationService = getMeetingPreparationService()
    const preparation = await preparationService.prepareMeeting(meetingId)

    return NextResponse.json({ preparation })
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

  const { id: meetingId } = await params

  try {
    const preparationService = getMeetingPreparationService()
    const preparation = await preparationService.getPreparation(meetingId)

    if (!preparation) {
      return NextResponse.json({ error: 'Preparation not found' }, { status: 404 })
    }

    return NextResponse.json({ preparation })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

