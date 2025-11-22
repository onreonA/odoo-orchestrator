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

  try {
    // Get all feedback for this template
    const { data: feedback, error } = await supabase
      .from('template_feedback')
      .select('rating, sentiment, created_at, issues, suggestions')
      .eq('template_id', templateId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate statistics
    const total = feedback?.length || 0
    const ratings = feedback?.map(f => f.rating) || []
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

    // Rating distribution
    const ratingDistribution = {
      5: ratings.filter(r => r === 5).length,
      4: ratings.filter(r => r === 4).length,
      3: ratings.filter(r => r === 3).length,
      2: ratings.filter(r => r === 2).length,
      1: ratings.filter(r => r === 1).length,
    }

    // Sentiment distribution
    const sentimentDistribution = {
      positive: feedback?.filter(f => f.sentiment === 'positive').length || 0,
      neutral: feedback?.filter(f => f.sentiment === 'neutral').length || 0,
      negative: feedback?.filter(f => f.sentiment === 'negative').length || 0,
    }

    // Common issues
    const allIssues: any[] = []
    feedback?.forEach(f => {
      if (f.issues && Array.isArray(f.issues)) {
        allIssues.push(...f.issues)
      }
    })

    const issueCounts: Record<string, number> = {}
    allIssues.forEach(issue => {
      const key = issue.type || 'unknown'
      issueCounts[key] = (issueCounts[key] || 0) + 1
    })

    const commonIssues = Object.entries(issueCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Common suggestions
    const allSuggestions: any[] = []
    feedback?.forEach(f => {
      if (f.suggestions && Array.isArray(f.suggestions)) {
        allSuggestions.push(...f.suggestions)
      }
    })

    const suggestionCounts: Record<string, number> = {}
    allSuggestions.forEach(suggestion => {
      const key = suggestion.type || 'unknown'
      suggestionCounts[key] = (suggestionCounts[key] || 0) + 1
    })

    const commonSuggestions = Object.entries(suggestionCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Recent feedback trend (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentFeedback = feedback?.filter(f => new Date(f.created_at) >= thirtyDaysAgo) || []

    const recentAvgRating =
      recentFeedback.length > 0
        ? recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length
        : 0

    return NextResponse.json({
      stats: {
        total,
        avgRating: Math.round(avgRating * 100) / 100,
        recentAvgRating: Math.round(recentAvgRating * 100) / 100,
        ratingDistribution,
        sentimentDistribution,
        commonIssues,
        commonSuggestions,
        recentCount: recentFeedback.length,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

