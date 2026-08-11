import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeatureFlagItem } from '../src/components/feature-flag-item'
import type { FeatureFlag } from '../src/types/feature-flag'

const baseFlag: FeatureFlag = {
  id: 1,
  key: 'my-flag',
  description: 'a test flag',
  enabled: false,
  created_at: new Date().toISOString(),
}

describe('FeatureFlagItem', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the flag key and description', () => {
    render(<FeatureFlagItem flag={baseFlag} onDelete={vi.fn()} />)
    expect(screen.getByDisplayValue('my-flag')).toBeInTheDocument()
    expect(screen.getByDisplayValue('a test flag')).toBeInTheDocument()
  })

  it('calls onDelete with the flag id when the delete button is clicked', async () => {
    const onDelete = vi.fn()
    render(<FeatureFlagItem flag={baseFlag} onDelete={onDelete} />)

    await userEvent.click(screen.getByTitle('Delete Flag'))

    expect(onDelete).toHaveBeenCalledWith(1)
  })

  it('PATCHes the changed field on blur when the value actually changed', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    render(<FeatureFlagItem flag={baseFlag} onDelete={vi.fn()} />)
    const keyInput = screen.getByDisplayValue('my-flag')

    fireEvent.change(keyInput, { target: { value: 'renamed-flag' } })
    fireEvent.blur(keyInput)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toContain('/1')
    expect(options.method).toBe('PATCH')
    expect(JSON.parse(options.body)).toEqual({ key: 'renamed-flag' })
  })

  it('does not PATCH on blur when the value is unchanged', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(<FeatureFlagItem flag={baseFlag} onDelete={vi.fn()} />)
    const keyInput = screen.getByDisplayValue('my-flag')

    fireEvent.blur(keyInput)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reverts the field to the original value if the PATCH fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false })
    vi.stubGlobal('fetch', fetchMock)

    render(<FeatureFlagItem flag={baseFlag} onDelete={vi.fn()} />)
    const keyInput = screen.getByDisplayValue('my-flag')

    fireEvent.change(keyInput, { target: { value: 'will-fail' } })
    fireEvent.blur(keyInput)

    await waitFor(() => expect(screen.getByDisplayValue('my-flag')).toBeInTheDocument())
  })

  it('disables the editable inputs while a PATCH is in flight', async () => {
    let resolveFetch!: (value: { ok: boolean; json: () => Promise<unknown> }) => void
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<FeatureFlagItem flag={baseFlag} onDelete={vi.fn()} />)
    const keyInput = screen.getByDisplayValue('my-flag')

    fireEvent.change(keyInput, { target: { value: 'in-flight' } })
    fireEvent.blur(keyInput)

    await waitFor(() => expect(keyInput).toBeDisabled())

    resolveFetch({ ok: true, json: async () => ({}) })
    await waitFor(() => expect(keyInput).not.toBeDisabled())
  })

  it('toggling the switch PATCHes the "enabled" field', async () => {
    // Note: the underlying checkbox is visually hidden (see toggle-button.test.tsx) -
    // jsdom doesn't reliably reproduce the native checked-flip for a display:none
    // input, so we can verify the request fires against the right field, but not
    // pin down the exact boolean value it carries in this environment.
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    const { container } = render(<FeatureFlagItem flag={baseFlag} onDelete={vi.fn()} />)
    const label = container.querySelector('label')!

    await userEvent.click(label)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toContain('/1')
    expect(options.method).toBe('PATCH')
    expect(Object.keys(JSON.parse(options.body))).toEqual(['enabled'])
  })
})
