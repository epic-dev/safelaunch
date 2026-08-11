import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { LoadingDots } from '../src/components/loading-dots'

describe('LoadingDots', () => {
  it('renders "Loading" followed by three animated dots', () => {
    const { container } = render(<LoadingDots />)
    expect(container.textContent).toBe('Loading...')

    const dotsWrapper = container.querySelector('span > span')
    expect(dotsWrapper?.children).toHaveLength(3)
    for (const dot of Array.from(dotsWrapper?.children ?? [])) {
      expect(dot.textContent).toBe('.')
    }
  })
})
