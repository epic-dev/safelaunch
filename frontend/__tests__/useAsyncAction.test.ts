import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAsyncAction } from '../src/hooks/useAsyncAction'

describe('useAsyncAction', () => {
  it('starts with pending=false and error=null', () => {
    const { result } = renderHook(() => useAsyncAction(async () => {}))
    expect(result.current.pending).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('resolves successfully: pending returns to false, error stays null', async () => {
    const action = vi.fn(async () => {})
    const { result } = renderHook(() => useAsyncAction(action))

    await act(async () => {
      await result.current.run()
    })

    expect(action).toHaveBeenCalledTimes(1)
    expect(result.current.pending).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets pending=true while the action is in flight, then false after it settles', async () => {
    let resolveAction: () => void = () => {}
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve
        }),
    )
    const { result } = renderHook(() => useAsyncAction(action))

    let runPromise!: Promise<void>
    act(() => {
      runPromise = result.current.run()
    })

    expect(result.current.pending).toBe(true)

    await act(async () => {
      resolveAction()
      await runPromise
    })

    expect(result.current.pending).toBe(false)
  })

  it('captures an Error message on failure', async () => {
    const action = vi.fn(async () => {
      throw new Error('boom')
    })
    const { result } = renderHook(() => useAsyncAction(action))

    await act(async () => {
      await result.current.run()
    })

    expect(result.current.pending).toBe(false)
    expect(result.current.error).toBe('boom')
  })

  it('falls back to a generic message for a non-Error throw', async () => {
    const action = vi.fn(async () => {
      throw 'not an Error instance'
    })
    const { result } = renderHook(() => useAsyncAction(action))

    await act(async () => {
      await result.current.run()
    })

    expect(result.current.error).toBe('Something went wrong')
  })

  it('passes arguments through to the action', async () => {
    const action = vi.fn(async () => {})
    const { result } = renderHook(() => useAsyncAction(action))

    await act(async () => {
      await result.current.run(42, 'hello')
    })

    expect(action).toHaveBeenCalledWith(42, 'hello')
  })

  it('clears a previous error at the start of a new run', async () => {
    const action = vi.fn(async () => {
      throw new Error('first failure')
    })
    const { result } = renderHook(() => useAsyncAction(action))

    await act(async () => {
      await result.current.run()
    })
    expect(result.current.error).toBe('first failure')

    action.mockImplementationOnce(async () => {})
    await act(async () => {
      await result.current.run()
    })
    expect(result.current.error).toBeNull()
  })

  it('exposes setError to clear the error manually', async () => {
    const action = vi.fn(async () => {
      throw new Error('boom')
    })
    const { result } = renderHook(() => useAsyncAction(action))

    await act(async () => {
      await result.current.run()
    })
    expect(result.current.error).toBe('boom')

    act(() => {
      result.current.setError(null)
    })
    expect(result.current.error).toBeNull()
  })
})
