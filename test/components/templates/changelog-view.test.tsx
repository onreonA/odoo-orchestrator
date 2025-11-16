import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChangelogView } from '@/components/templates/changelog-view'

describe('ChangelogView Component', () => {
  const mockVersions = [
    {
      id: 'version-1',
      version: '1.0.0',
      changelog: 'Initial release',
      created_at: '2025-11-15T10:00:00Z',
      created_by_user: {
        full_name: 'Test User',
        email: 'test@example.com',
      },
      is_current: true,
    },
    {
      id: 'version-2',
      version: '1.1.0',
      changelog: 'Added new features',
      created_at: '2025-11-16T10:00:00Z',
      created_by_user: {
        full_name: 'Test User 2',
        email: 'test2@example.com',
      },
      is_current: false,
    },
  ]

  it('should render changelog view', () => {
    render(<ChangelogView templateId="template-123" versions={mockVersions} />)

    expect(screen.getByText('Changelog')).toBeInTheDocument()
    expect(screen.getByText('v1.0.0')).toBeInTheDocument()
    expect(screen.getByText('v1.1.0')).toBeInTheDocument()
  })

  it('should display changelog content', () => {
    render(<ChangelogView templateId="template-123" versions={mockVersions} />)

    expect(screen.getByText('Initial release')).toBeInTheDocument()
    expect(screen.getByText('Added new features')).toBeInTheDocument()
  })

  it('should show active version badge', () => {
    render(<ChangelogView templateId="template-123" versions={mockVersions} />)

    const activeBadges = screen.getAllByText('Aktif')
    expect(activeBadges.length).toBeGreaterThan(0)
  })

  it('should display user information', () => {
    render(<ChangelogView templateId="template-123" versions={mockVersions} />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Test User 2')).toBeInTheDocument()
  })

  it('should handle empty versions', () => {
    render(<ChangelogView templateId="template-123" versions={[]} />)

    expect(screen.getByText('Henüz changelog kaydı yok')).toBeInTheDocument()
  })

  it('should handle missing changelog', () => {
    const versionsWithoutChangelog = [
      {
        ...mockVersions[0],
        changelog: null,
      },
    ]

    render(<ChangelogView templateId="template-123" versions={versionsWithoutChangelog} />)

    expect(screen.getByText('Changelog bilgisi yok')).toBeInTheDocument()
  })

  it('should sort versions correctly (newest first)', () => {
    render(<ChangelogView templateId="template-123" versions={mockVersions} />)

    const versionElements = screen.getAllByText(/v\d+\.\d+\.\d+/)
    // Should be sorted newest first (1.1.0 before 1.0.0)
    expect(versionElements[0].textContent).toContain('1.1.0')
  })
})
