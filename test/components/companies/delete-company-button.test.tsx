import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteCompanyButton } from '@/components/companies/delete-company-button'

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock fetch
global.fetch = vi.fn()

describe('DeleteCompanyButton Component', () => {
  const companyId = 'test-company-id'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('renders delete button initially', () => {
    render(<DeleteCompanyButton companyId={companyId} />)
    expect(screen.getByText('Sil')).toBeInTheDocument()
  })

  it('shows confirmation dialog on first click', async () => {
    const user = userEvent.setup()
    render(<DeleteCompanyButton companyId={companyId} />)

    const deleteButton = screen.getByText('Sil')
    await user.click(deleteButton)

    expect(screen.getByText('İptal')).toBeInTheDocument()
    expect(screen.getByText('Evet, Sil')).toBeInTheDocument()
  })

  it('cancels deletion when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<DeleteCompanyButton companyId={companyId} />)

    // Click delete to show confirmation
    await user.click(screen.getByText('Sil'))

    // Click cancel
    await user.click(screen.getByText('İptal'))

    // Should show delete button again
    expect(screen.getByText('Sil')).toBeInTheDocument()
    expect(screen.queryByText('İptal')).not.toBeInTheDocument()
  })

  it('calls delete API on confirmation', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<DeleteCompanyButton companyId={companyId} />)

    // Click delete to show confirmation
    await user.click(screen.getByText('Sil'))

    // Click confirm
    await user.click(screen.getByText('Evet, Sil'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/companies/${companyId}`,
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    expect(mockPush).toHaveBeenCalledWith('/companies')
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('shows error alert when API call fails', async () => {
    const user = userEvent.setup()
    const alertSpy = vi.spyOn(window, 'alert')
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Delete failed' }),
    })

    render(<DeleteCompanyButton companyId={companyId} />)

    // Click delete to show confirmation
    await user.click(screen.getByText('Sil'))

    // Click confirm
    await user.click(screen.getByText('Evet, Sil'))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Delete failed')
    })

    // After error, should reset to initial state (delete button)
    await waitFor(() => {
      expect(screen.getByText('Sil')).toBeInTheDocument()
    })
  })

  it('shows loading state during deletion', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ success: true }),
              }),
            100
          )
        )
    )

    render(<DeleteCompanyButton companyId={companyId} />)

    // Click delete to show confirmation
    await user.click(screen.getByText('Sil'))

    // Click confirm
    const confirmButton = screen.getByText('Evet, Sil')
    await user.click(confirmButton)

    // Should show loading state
    expect(screen.getByText('Siliniyor...')).toBeInTheDocument()
    expect(confirmButton).toBeDisabled()
  })
})
