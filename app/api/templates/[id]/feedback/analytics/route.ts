import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id: templateId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get feedback with date grouping
    const { data: feedback, error } = await supabase
      .from('template_feedback')
      .select('rating, sentiment, created_at')
      .eq('template_id', templateId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by date
    const dailyData: Record<string, { count: number; avgRating: number; sentiments: any }> = {}

    feedback?.forEach(f => {
      const date = new Date(f.created_at).toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = {
          count: 0,
          avgRating: 0,
          sentiments: { positive: 0, neutral: 0, negative: 0 },
        }
      }
      dailyData[date].count++
      dailyData[date].avgRating += f.rating
      if (f.sentiment) {
        dailyData[date].sentiments[f.sentiment] = (dailyData[date].sentiments[f.sentiment] || 0) + 1
      }
    })

    // Calculate averages
    Object.keys(dailyData).forEach(date => {
      dailyData[date].avgRating =
        Math.round((dailyData[date].avgRating / dailyData[date].count) * 100) / 100
    })

    // Convert to array format
    const analytics = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Overall trends
    const totalFeedback = feedback?.length || 0
    const avgRating =
      totalFeedback > 0
        ? Math.round((feedback!.reduce((sum, f) => sum + f.rating, 0) / totalFeedback) * 100) / 100
        : 0

    const positiveCount = feedback?.filter(f => f.sentiment === 'positive').length || 0
    const negativeCount = feedback?.filter(f => f.sentiment === 'negative').length || 0
    const satisfactionRate = totalFeedback > 0 ? (positiveCount / totalFeedback) * 100 : 0

    return NextResponse.json({
      analytics,
      trends: {
        totalFeedback,
        avgRating,
        satisfactionRate: Math.round(satisfactionRate * 100) / 100,
        positiveCount,
        negativeCount,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

