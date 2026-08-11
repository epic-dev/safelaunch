import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from '../src/components/pagination'

describe('Pagination', () => {
  it('displays the item range for the current page', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={47}
        itemsPerPage={10}
        onPageChange={vi.fn()}
        onItemsPerPageChange={vi.fn()}
      />,
    )
    expect(screen.getByText('Showing 11-20 of 47 flag(-s)')).toBeInTheDocument()
  })

  it('clamps the end of the range to the total item count on the last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        totalItems={47}
        itemsPerPage={10}
        onPageChange={vi.fn()}
        onItemsPerPageChange={vi.fn()}
      />,
    )
    expect(screen.getByText('Showing 41-47 of 47 flag(-s)')).toBeInTheDocument()
  })

  it('disables Previous on the first page and calls onPageChange(page - 1) otherwise', async () => {
    const onPageChange = vi.fn()
    const { rerender } = render(
      <Pagination currentPage={1} totalPages={3} totalItems={30} onPageChange={onPageChange} onItemsPerPageChange={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: 'chevron_left' })).toBeDisabled()

    rerender(
      <Pagination currentPage={2} totalPages={3} totalItems={30} onPageChange={onPageChange} onItemsPerPageChange={vi.fn()} />,
    )
    const prevButton = screen.getByRole('button', { name: 'chevron_left' })
    expect(prevButton).not.toBeDisabled()
    await userEvent.click(prevButton)
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('disables Next on the last page and calls onPageChange(page + 1) otherwise', async () => {
    const onPageChange = vi.fn()
    const { rerender } = render(
      <Pagination currentPage={3} totalPages={3} totalItems={30} onPageChange={onPageChange} onItemsPerPageChange={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: 'chevron_right' })).toBeDisabled()

    rerender(
      <Pagination currentPage={2} totalPages={3} totalItems={30} onPageChange={onPageChange} onItemsPerPageChange={vi.fn()} />,
    )
    const nextButton = screen.getByRole('button', { name: 'chevron_right' })
    expect(nextButton).not.toBeDisabled()
    await userEvent.click(nextButton)
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('changing items-per-page resets to page 1 and reports the new size', async () => {
    const onPageChange = vi.fn()
    const onItemsPerPageChange = vi.fn()
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        totalItems={100}
        itemsPerPage={10}
        onPageChange={onPageChange}
        onItemsPerPageChange={onItemsPerPageChange}
      />,
    )

    await userEvent.selectOptions(screen.getByRole('combobox'), '20')

    expect(onPageChange).toHaveBeenCalledWith(1)
    expect(onItemsPerPageChange).toHaveBeenCalledWith(20)
  })
})
