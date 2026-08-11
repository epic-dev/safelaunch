import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeatureFlagsList } from '../src/components/feature-flags-list'
import type { FeatureFlag } from '../src/types/feature-flag'

function flag(overrides: Partial<FeatureFlag> = {}): FeatureFlag {
  return {
    id: 1,
    key: 'flag-a',
    description: 'desc',
    enabled: false,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

function mockFetchSequence(responses: Array<{ ok: boolean; body?: unknown }>) {
  const fetchMock = vi.fn()
  for (const { ok, body } of responses) {
    fetchMock.mockResolvedValueOnce({ ok, json: async () => body ?? {} })
  }
  return fetchMock
}

// jsdom doesn't implement showModal()/close(), so opening CreateFlagModal/DeleteFlagModal
// for interaction has to be done manually - same reasoning as renderDialog.tsx, applied
// here to dialogs rendered as siblings by FeatureFlagsList rather than the top-level element.
function openDialog(id: string) {
  const dialog = document.getElementById(id) as HTMLDialogElement
  dialog.open = true
  dialog.close = () => {
    dialog.open = false
  }
}

describe('FeatureFlagsList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the fetched flags', async () => {
    const fetchMock = mockFetchSequence([
      {
        ok: true,
        body: { featureFlags: [flag({ id: 1, key: 'flag-a' }), flag({ id: 2, key: 'flag-b' })], total: 2 },
      },
    ])
    vi.stubGlobal('fetch', fetchMock)

    // The initial mount synchronously suspends (the lazy-initialized dataPromise
    // isn't settled yet); render()'s own internal act() wrap is synchronous, so
    // without an awaited act() here the eventual resolution update is scheduled
    // outside any act scope and React warns / the DOM never updates in tests.
    await act(async () => {
      render(<FeatureFlagsList />)
    })

    expect(await screen.findByDisplayValue('flag-a')).toBeInTheDocument()
    expect(screen.getByDisplayValue('flag-b')).toBeInTheDocument()
  })

  it('renders the empty state when there are no flags', async () => {
    const fetchMock = mockFetchSequence([{ ok: true, body: { featureFlags: [], total: 0 } }])
    vi.stubGlobal('fetch', fetchMock)

    // The initial mount synchronously suspends (the lazy-initialized dataPromise
    // isn't settled yet); render()'s own internal act() wrap is synchronous, so
    // without an awaited act() here the eventual resolution update is scheduled
    // outside any act scope and React warns / the DOM never updates in tests.
    await act(async () => {
      render(<FeatureFlagsList />)
    })

    expect(await screen.findByText('No flags found')).toBeInTheDocument()
  })

  it('shows the error fallback on fetch failure and recovers via retry', async () => {
    const fetchMock = mockFetchSequence([{ ok: false }, { ok: true, body: { featureFlags: [flag()], total: 1 } }])
    vi.stubGlobal('fetch', fetchMock)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    // The initial mount synchronously suspends (the lazy-initialized dataPromise
    // isn't settled yet); render()'s own internal act() wrap is synchronous, so
    // without an awaited act() here the eventual resolution update is scheduled
    // outside any act scope and React warns / the DOM never updates in tests.
    await act(async () => {
      render(<FeatureFlagsList />)
    })

    expect(await screen.findByText('Failed to fetch feature flags :(')).toBeInTheDocument()

    // Same reasoning as the initial-mount act() wrap: clicking Retry triggers a
    // second suspend, and userEvent's own act wrapping doesn't cover that
    // follow-up promise's resolution.
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    })

    expect(await screen.findByDisplayValue('flag-a')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    consoleError.mockRestore()
  })

  it('changing page triggers a refetch with the new offset', async () => {
    const fetchMock = mockFetchSequence([
      { ok: true, body: { featureFlags: [flag({ id: 1, key: 'page-1-flag' })], total: 25 } },
      { ok: true, body: { featureFlags: [flag({ id: 2, key: 'page-2-flag' })], total: 25 } },
    ])
    vi.stubGlobal('fetch', fetchMock)

    // The initial mount synchronously suspends (the lazy-initialized dataPromise
    // isn't settled yet); render()'s own internal act() wrap is synchronous, so
    // without an awaited act() here the eventual resolution update is scheduled
    // outside any act scope and React warns / the DOM never updates in tests.
    await act(async () => {
      render(<FeatureFlagsList />)
    })
    expect(await screen.findByDisplayValue('page-1-flag')).toBeInTheDocument()

    // Same reasoning as the initial-mount act() wrap: the page change goes
    // through startTransition and suspends again, and userEvent's own act
    // wrapping doesn't cover that follow-up promise's resolution.
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'chevron_right' }))
    })

    expect(await screen.findByDisplayValue('page-2-flag')).toBeInTheDocument()
    const secondCallUrl = fetchMock.mock.calls[1][0] as string
    expect(secondCallUrl).toContain('offset=10')
  })

  it('creating a flag refetches the list', async () => {
    const fetchMock = mockFetchSequence([
      { ok: true, body: { featureFlags: [flag({ id: 1, key: 'flag-a' })], total: 1 } },
      { ok: true, body: {} },
      {
        ok: true,
        body: { featureFlags: [flag({ id: 1, key: 'flag-a' }), flag({ id: 2, key: 'flag-b' })], total: 2 },
      },
    ])
    vi.stubGlobal('fetch', fetchMock)

    // The initial mount synchronously suspends (the lazy-initialized dataPromise
    // isn't settled yet); render()'s own internal act() wrap is synchronous, so
    // without an awaited act() here the eventual resolution update is scheduled
    // outside any act scope and React warns / the DOM never updates in tests.
    await act(async () => {
      render(<FeatureFlagsList />)
    })
    expect(await screen.findByDisplayValue('flag-a')).toBeInTheDocument()

    openDialog('create-flag-modal')
    await userEvent.type(screen.getByPlaceholderText('e.g. new-dashboard-layout'), 'flag-b')
    await userEvent.click(screen.getByRole('button', { name: 'Create Flag' }))

    expect(await screen.findByDisplayValue('flag-b')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('deleting a flag refetches the list', async () => {
    const fetchMock = mockFetchSequence([
      {
        ok: true,
        body: { featureFlags: [flag({ id: 1, key: 'flag-a' }), flag({ id: 2, key: 'flag-b' })], total: 2 },
      },
      { ok: true },
      { ok: true, body: { featureFlags: [flag({ id: 2, key: 'flag-b' })], total: 1 } },
    ])
    vi.stubGlobal('fetch', fetchMock)

    // The initial mount synchronously suspends (the lazy-initialized dataPromise
    // isn't settled yet); render()'s own internal act() wrap is synchronous, so
    // without an awaited act() here the eventual resolution update is scheduled
    // outside any act scope and React warns / the DOM never updates in tests.
    await act(async () => {
      render(<FeatureFlagsList />)
    })
    expect(await screen.findByDisplayValue('flag-a')).toBeInTheDocument()

    openDialog('delete-flag-modal')
    const deleteButtons = screen.getAllByTitle('Delete Flag')
    await userEvent.click(deleteButtons[0])
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))

    await waitFor(() => expect(screen.queryByDisplayValue('flag-a')).not.toBeInTheDocument())
    expect(screen.getByDisplayValue('flag-b')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
