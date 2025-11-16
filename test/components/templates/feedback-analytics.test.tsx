import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { FeedbackAnalytics } from '@/components/templates/feedback-analytics'

// Mock fetch
global.fetch = vi.fn()

describe('FeedbackAnalytics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {})) // Never resolves

    const { container } = render(<FeedbackAnalytics templateId="template-123" />)

    // Check for loading spinner (spinning div)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should display feedback statistics', async () => {
    const mockStats = {
      total: 10,
      avgRating: 4.5,
      recentAvgRating: 4.7,
      ratingDistribution: {
        5: 5,
        4: 3,
        3: 1,
        2: 1,
        1: 0,
      },
      sentimentDistribution: {
        positive: 8,
        neutral: 1,
        negative: 1,
      },
      commonIssues: [
        { type: 'error', count: 3 },
        { type: 'bug', count: 2 },
      ],
      commonSuggestions: [{ type: 'improvement', count: 5 }],
      recentCount: 5,
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stats: mockStats }),
    } as Response)

    render(<FeedbackAnalytics templateId="template-123" />)

    await waitFor(() => {
      expect(screen.getByText('Feedback Analytics')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument() // Total
      expect(screen.getByText('4.5')).toBeInTheDocument() // Avg rating
    })
  })

  it('should display error message on fetch failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    render(<FeedbackAnalytics templateId="template-123" />)

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument()
    })
  })

  it('should display rating distribution', async () => {
    const mockStats = {
      total: 5,
      avgRating: 4.0,
      recentAvgRating: 4.0,
      ratingDistribution: {
        5: 3,
        4: 1,
        3: 1,
        2: 0,
        1: 0,
      },
      sentimentDistribution: {
        positive: 4,
        neutral: 1,
        negative: 0,
      },
      commonIssues: [],
      commonSuggestions: [],
      recentCount: 5,
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stats: mockStats }),
    } as Response)

    render(<FeedbackAnalytics templateId="template-123" />)

    await waitFor(() => {
      expect(screen.getByText('Rating Dağılımı')).toBeInTheDocument()
      expect(screen.getByText('5 Yıldız')).toBeInTheDocument()
    })
  })

  it('should display sentiment distribution', async () => {
    const mockStats = {
      total: 10,
      avgRating: 4.0,
      recentAvgRating: 4.0,
      ratingDistribution: {
        5: 5,
        4: 3,
        3: 1,
        2: 1,
        1: 0,
      },
      sentimentDistribution: {
        positive: 8,
        neutral: 1,
        negative: 1,
      },
      commonIssues: [],
      commonSuggestions: [],
      recentCount: 10,
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stats: mockStats }),
    } as Response)

    render(<FeedbackAnalytics templateId="template-123" />)

    await waitFor(
      () => {
        expect(screen.getByText('Sentiment Dağılımı')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const positiveElements = screen.getAllByText('Pozitif')
    const negativeElements = screen.getAllByText('Negatif')
    expect(positiveElements.length).toBeGreaterThan(0)
    expect(negativeElements.length).toBeGreaterThan(0)
  })
})
