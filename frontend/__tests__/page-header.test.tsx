import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHeader } from '../src/components/page-header'

describe('PageHeader', () => {
  it('renders the title and description', () => {
    render(<PageHeader />)
    expect(screen.getByRole('heading', { name: 'Feature Flags' })).toBeInTheDocument()
    expect(screen.getByText('Manage and toggle features across environments.')).toBeInTheDocument()
  })
})
