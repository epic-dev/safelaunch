import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToggleButton } from '../src/components/toggle-button'

describe('ToggleButton', () => {
  it('reflects the enabled state on the underlying checkbox', () => {
    const { container, rerender } = render(<ToggleButton enabled={true} onToggle={vi.fn()} name="enabled" />)
    expect(container.querySelector('input[type="checkbox"]')).toBeChecked()

    rerender(<ToggleButton enabled={false} onToggle={vi.fn()} name="enabled" />)
    expect(container.querySelector('input[type="checkbox"]')).not.toBeChecked()
  })

  it('calls onToggle when the visible switch is clicked', async () => {
    // Note: the checkbox is visually hidden (styled label + span instead), and
    // jsdom does not perform the native "click toggles checked" activation
    // behavior for display:none form controls (verified: real browsers do,
    // jsdom does not) - so we can assert the handler fires with the right
    // target, but not the post-click `checked` value here.
    const onToggle = vi.fn()
    const { container } = render(<ToggleButton enabled={false} onToggle={onToggle} name="enabled" />)

    const label = container.querySelector('label')
    expect(label).not.toBeNull()
    await userEvent.click(label!)

    expect(onToggle).toHaveBeenCalledTimes(1)
    const event = onToggle.mock.calls[0][0]
    expect(event.target).toBe(container.querySelector('input[type="checkbox"]'))
    expect(event.target.name).toBe('enabled')
  })

  it('sets the checkbox name so form data / event.target.name is correct', () => {
    const { container } = render(<ToggleButton enabled={false} onToggle={vi.fn()} name="my-flag" />)
    expect(container.querySelector('input[type="checkbox"]')).toHaveAttribute('name', 'my-flag')
  })
})
