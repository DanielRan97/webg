/**
 * Asks the live preview to scroll to one of the site's sections. Any form control can call it; the
 * preview pane (and, on small screens, the form/preview switch) listen for it on window.
 */
export const PREVIEW_SCROLL_EVENT = "webg:show-in-preview";

export function showInPreview(section: string) {
  window.dispatchEvent(new CustomEvent<string>(PREVIEW_SCROLL_EVENT, { detail: section }));
}
