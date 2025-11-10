/**
 * Test Schedule API
 * 
 * Zamanlanmış testleri yönetir
 */

import { NextRequest, NextResponse } from 'next/server'
import { TestSchedulerService } from '@/lib/services/test-scheduler-service'

export async function GET(request: NextRequest) {
  try {
    const schedules = Array.from(TestSchedulerService.getAllSchedules().entries()).map(([id, config]) => ({
      id,
      ...config,
    }))

    return NextResponse.json({ success: true, data: schedules })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, testType, schedule, enabled } = body

    if (!id || !testType || !schedule) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    TestSchedulerService.addSchedule(id, {
      testType,
      schedule,
      enabled: enabled ?? false,
    })

    return NextResponse.json({ success: true, message: 'Schedule added' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Schedule ID required' }, { status: 400 })
    }

    TestSchedulerService.removeSchedule(id)

    return NextResponse.json({ success: true, message: 'Schedule removed' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

