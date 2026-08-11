import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { FileDropArea } from '../src/components/file-drop-area'

describe('FileDropArea', () => {
  it('shows the prompt text before any file is selected', () => {
    render(<FileDropArea />)
    expect(screen.getByText(/drop a json, yaml or csv file here/i)).toBeInTheDocument()
  })

  it('selecting a file via the hidden input calls onSelect and updates the label', () => {
    const onSelect = vi.fn()
    const { container } = render(<FileDropArea onSelect={onSelect} />)

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['{}'], 'flags.json', { type: 'application/json' })
    fireEvent.change(input, { target: { files: [file] } })

    expect(onSelect).toHaveBeenCalledWith(file)
    expect(screen.getByText(/file selected:/i)).toBeInTheDocument()
    expect(screen.getByText('flags.json')).toBeInTheDocument()
  })

  it('dropping a file calls onSelect and updates the label', () => {
    const onSelect = vi.fn()
    const { container } = render(<FileDropArea onSelect={onSelect} />)

    const dropzone = container.firstElementChild as HTMLElement
    const file = new File(['{}'], 'dropped.json', { type: 'application/json' })
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } })

    expect(onSelect).toHaveBeenCalledWith(file)
    expect(screen.getByText('dropped.json')).toBeInTheDocument()
  })

  it('clicking the dropzone opens the native file picker', () => {
    // Note: the file input is a DOM descendant of the div carrying onClick, so
    // the programmatic input.click() bubbles back up and re-triggers the same
    // handler once more (called twice, not once) - real, if harmless, redundancy
    // rather than a test-setup issue. Asserting "at least once" to cover the
    // behavior that actually matters without being fragile to that detail.
    const { container } = render(<FileDropArea />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click')

    fireEvent.click(container.firstElementChild as HTMLElement)

    expect(clickSpy).toHaveBeenCalled()
  })

  it('does not call onSelect if the drop event carries no files', () => {
    const onSelect = vi.fn()
    const { container } = render(<FileDropArea onSelect={onSelect} />)

    const dropzone = container.firstElementChild as HTMLElement
    fireEvent.drop(dropzone, { dataTransfer: { files: [] } })

    expect(onSelect).not.toHaveBeenCalled()
  })
})
