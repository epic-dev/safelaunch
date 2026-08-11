import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteFlagModal } from '../src/components/delete-flag-modal'
import { renderOpenDialog } from './renderDialog'

describe('DeleteFlagModal', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('DELETEs the given flag id and calls onDeleted on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    const onDeleted = vi.fn()

    renderOpenDialog(<DeleteFlagModal flagId={42} onDeleted={onDeleted} />)

    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toContain('/42')
    expect(options.method).toBe('DELETE')

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1))
  })

  it('does nothing when there is no flag id to delete', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const onDeleted = vi.fn()

    renderOpenDialog(<DeleteFlagModal flagId={null} onDeleted={onDeleted} />)

    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it('shows an error and does not call onDeleted when the request fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false })
    vi.stubGlobal('fetch', fetchMock)
    const onDeleted = vi.fn()

    renderOpenDialog(<DeleteFlagModal flagId={7} onDeleted={onDeleted} />)

    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))

    expect(await screen.findByText('Unable to delete feature flag')).toBeInTheDocument()
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it('disables the Yes button while the request is in flight', async () => {
    let resolveFetch!: (value: { ok: boolean }) => void
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    renderOpenDialog(<DeleteFlagModal flagId={7} />)

    const yesButton = screen.getByRole('button', { name: 'Yes' })
    await userEvent.click(yesButton)

    await waitFor(() => expect(yesButton).toBeDisabled())

    resolveFetch({ ok: true })
    await waitFor(() => expect(yesButton).not.toBeDisabled())
  })
})
