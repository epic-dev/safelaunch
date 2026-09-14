import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiKeyGate } from '../src/components/api-key-gate'
import { UNAUTHORIZED_EVENT } from '../src/utils/api-fetch'

function statusResponse(body: { authRequired: boolean; authenticated: boolean }) {
  return { ok: true, status: 200, json: async () => body }
}

describe('ApiKeyGate', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders children once the session is authenticated', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      statusResponse({ authRequired: true, authenticated: true }),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<ApiKeyGate><p>dashboard</p></ApiKeyGate>)

    expect(await screen.findByText('dashboard')).toBeInTheDocument()
    expect(screen.queryByLabelText('API Key')).not.toBeInTheDocument()
  })

  it('asks for a key when the session is not authenticated', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      statusResponse({ authRequired: true, authenticated: false }),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<ApiKeyGate><p>dashboard</p></ApiKeyGate>)

    expect(await screen.findByLabelText('API Key')).toBeInTheDocument()
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument()
  })

  // Auth switched off server-side (development) must not put a prompt in the way.
  it('renders children without prompting when auth is not required', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      statusResponse({ authRequired: false, authenticated: true }),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<ApiKeyGate><p>dashboard</p></ApiKeyGate>)

    expect(await screen.findByText('dashboard')).toBeInTheDocument()
  })

  it('exchanges a submitted key for a session and then renders children', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(statusResponse({ authRequired: true, authenticated: false }))
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) })
      .mockResolvedValueOnce(statusResponse({ authRequired: true, authenticated: true }))
    vi.stubGlobal('fetch', fetchMock)

    render(<ApiKeyGate><p>dashboard</p></ApiKeyGate>)

    await userEvent.type(await screen.findByLabelText('API Key'), 'the-secret-key')
    await userEvent.click(screen.getByRole('button', { name: 'Unlock' }))

    expect(await screen.findByText('dashboard')).toBeInTheDocument()

    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe('/api/v1/auth/session')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ apiKey: 'the-secret-key' })
  })

  it('reports a rejected key and keeps prompting', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(statusResponse({ authRequired: true, authenticated: false }))
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    render(<ApiKeyGate><p>dashboard</p></ApiKeyGate>)

    await userEvent.type(await screen.findByLabelText('API Key'), 'wrong-key')
    await userEvent.click(screen.getByRole('button', { name: 'Unlock' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('That API key was not accepted')
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument()
  })

  // A 401 from any other call means the 12-hour session lapsed mid-use.
  it('returns to the prompt when a request elsewhere reports unauthorized', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      statusResponse({ authRequired: true, authenticated: true }),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<ApiKeyGate><p>dashboard</p></ApiKeyGate>)
    expect(await screen.findByText('dashboard')).toBeInTheDocument()

    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))

    await waitFor(() => {
      expect(screen.getByLabelText('API Key')).toBeInTheDocument()
    })
  })

  // An unreachable server is a different failure from an unauthorized one - a key prompt
  // would be misleading, so the app renders and surfaces the real error instead.
  it('renders children when the session check fails outright', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)

    render(<ApiKeyGate><p>dashboard</p></ApiKeyGate>)

    expect(await screen.findByText('dashboard')).toBeInTheDocument()
  })
})
