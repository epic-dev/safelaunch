import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from '../src/components/error-boundary'

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('boom')
  }
  return <div>safe content</div>
}

describe('ErrorBoundary', () => {
  // React (and this component's own componentDidCatch) log intentionally-thrown
  // errors to console.error - silence that noise for these tests only.
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <div>safe content</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('safe content')).toBeInTheDocument()
  })

  it('renders the default fallback with the error message and a Retry button', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('boom')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('calls a custom fallback render-prop with the error and a reset function', () => {
    const fallback = vi.fn((error: Error, reset: () => void) => (
      <div>
        <p>custom: {error.message}</p>
        <button onClick={reset}>custom retry</button>
      </div>
    ))

    render(
      <ErrorBoundary fallback={fallback}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('custom: boom')).toBeInTheDocument()
    expect(fallback).toHaveBeenCalledWith(expect.any(Error), expect.any(Function))
  })

  it('reset() clears the caught error and re-renders children on the next render', async () => {
    function Wrapper() {
      const [shouldThrow, setShouldThrow] = useState(true)
      return (
        <div>
          <button onClick={() => setShouldThrow(false)}>fix bomb</button>
          <ErrorBoundary>
            <Bomb shouldThrow={shouldThrow} />
          </ErrorBoundary>
        </div>
      )
    }

    render(<Wrapper />)
    expect(screen.getByText('boom')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'fix bomb' }))
    // Boundary still shows the cached error until reset() runs, even though
    // the children prop has already changed underneath it.
    expect(screen.getByText('boom')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(screen.getByText('safe content')).toBeInTheDocument()
  })
})
