import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '../src/components/sidebar'

describe('Sidebar', () => {
  it('renders navigation links and the create-flag trigger', () => {
    render(<Sidebar />)

    expect(screen.getByRole('link', { name: /overview/i })).toBeInTheDocument()

    const docsLink = screen.getByRole('link', { name: /documentation/i })
    expect(docsLink).toHaveAttribute('href', 'https://github.com/epic-dev/safelaunch')

    const createButton = screen.getByRole('button', { name: /create flag/i })
    expect(createButton).toHaveAttribute('commandfor', 'create-flag-modal')
    expect(createButton).toHaveAttribute('command', 'show-modal')
  })
})
