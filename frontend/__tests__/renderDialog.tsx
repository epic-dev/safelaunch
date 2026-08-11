import type { ReactElement } from 'react'
import { render } from '@testing-library/react'

// jsdom implements neither HTMLDialogElement.showModal() nor .close(), and
// @testing-library's accessibility-aware queries treat a <dialog> without [open]
// as hidden (matching the real `dialog:not([open]) { display: none }` UA rule).
// This opens the dialog the way a real showModal() call would, and polyfills
// close() with the minimal behavior components here actually rely on.
export function renderOpenDialog(ui: ReactElement) {
  const utils = render(ui)
  const dialog = utils.container.querySelector('dialog') as HTMLDialogElement
  dialog.open = true
  dialog.close = () => {
    dialog.open = false
  }
  return { ...utils, dialog }
}
