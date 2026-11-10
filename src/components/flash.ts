/**
 * One-shot success message handed from the create/edit form to the list page.
 * The form stores it before redirecting; the list shows it once.
 * sessionStorage survives the client-side navigation and is scoped to the tab.
 *
 * Storage access can throw (e.g. when the browser blocks site data). The message
 * is only a nicety, so failures are ignored: they must never break a save.
 */
const KEY = "task-manager:flash";

export function setFlash(message: string): void {
  try {
    sessionStorage.setItem(KEY, message);
  } catch {
    // Storage unavailable: skip the message.
  }
}

/** Reads the pending message and clears it, so it is shown only once. */
export function takeFlash(): string | null {
  try {
    const message = sessionStorage.getItem(KEY);
    if (message) sessionStorage.removeItem(KEY);
    return message;
  } catch {
    return null;
  }
}
