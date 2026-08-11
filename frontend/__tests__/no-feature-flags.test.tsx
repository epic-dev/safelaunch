import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NoFeatureFlags } from '../src/components/no-feature-flags'

describe('NoFeatureFlags', () => {
  it('renders the empty-state heading and call to action', () => {
    render(<NoFeatureFlags />)
    expect(screen.getByText('No flags found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create flag/i })).toBeInTheDocument()
  })
})
