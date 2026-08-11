import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateFlagModal } from '../src/components/create-flag-modal'
import { renderOpenDialog as renderOpen } from './renderDialog'

describe('CreateFlagModal', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('submits a manually-created flag as JSON and calls onCreated on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    const onCreated = vi.fn()

    renderOpen(<CreateFlagModal onCreated={onCreated} />)

    await userEvent.type(screen.getByPlaceholderText('e.g. new-dashboard-layout'), 'my-new-flag')
    await userEvent.type(screen.getByPlaceholderText('Describe the purpose of this flag...'), 'a description')
    await userEvent.click(screen.getByRole('button', { name: 'Create Flag' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toContain('feature-flags')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({
      key: 'my-new-flag',
      description: 'a description',
      enabled: false,
    })

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
  })

  it('shows an error message and does not call onCreated when the request fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false })
    vi.stubGlobal('fetch', fetchMock)
    const onCreated = vi.fn()

    renderOpen(<CreateFlagModal onCreated={onCreated} />)

    await userEvent.type(screen.getByPlaceholderText('e.g. new-dashboard-layout'), 'my-flag')
    await userEvent.click(screen.getByRole('button', { name: 'Create Flag' }))

    expect(await screen.findByText('Failed to add feature flag')).toBeInTheDocument()
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('submits a selected file as multipart form data instead of JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    const onCreated = vi.fn()

    const { container } = renderOpen(<CreateFlagModal onCreated={onCreated} />)

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['[]'], 'flags.json', { type: 'application/json' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await userEvent.click(screen.getByRole('button', { name: 'Create Flag' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toContain('import')
    expect(options.method).toBe('POST')
    expect(options.body).toBeInstanceOf(FormData)

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
  })

  it('disables the submit button while the request is in flight', async () => {
    let resolveFetch!: (value: { ok: boolean; json: () => Promise<unknown> }) => void
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    renderOpen(<CreateFlagModal />)

    await userEvent.type(screen.getByPlaceholderText('e.g. new-dashboard-layout'), 'my-flag')
    const submitButton = screen.getByRole('button', { name: 'Create Flag' })
    await userEvent.click(submitButton)

    await waitFor(() => expect(submitButton).toBeDisabled())

    resolveFetch({ ok: true, json: async () => ({}) })
    await waitFor(() => expect(submitButton).not.toBeDisabled())
  })
})
