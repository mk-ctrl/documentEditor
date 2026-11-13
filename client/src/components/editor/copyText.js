/** Absolute link to a document, as people would paste it into chat. */
export const docLink = (docId) => `${window.location.origin}/d/${docId}`;

/**
 * Copy text to the clipboard. Uses the async Clipboard API when it's available (secure contexts),
 * and falls back to a hidden textarea + execCommand('copy') for plain-http hosts and older browsers.
 * Resolves to true when the copy worked.
 */
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // permission denied or unsupported: fall through to the legacy path
  }

  const previousFocus = document.activeElement;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  // selecting the textarea moved focus; give it back (matters inside the share dialog)
  if (previousFocus instanceof HTMLElement) previousFocus.focus();
  return ok;
}
