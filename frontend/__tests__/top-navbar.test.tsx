import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TopNavBar } from '../src/components/top-navbar'

describe('TopNavBar', () => {
  it('renders the search input and icon buttons', () => {
    render(<TopNavBar />)

    expect(screen.getByPlaceholderText('Search flags...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'notifications' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'settings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'help' })).toBeInTheDocument()
    expect(screen.getByAltText('User avatar')).toBeInTheDocument()
  })
})
