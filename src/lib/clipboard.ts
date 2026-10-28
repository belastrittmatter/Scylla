/**
 * Safely copy text to clipboard with fallback to document.execCommand("copy")
 * when navigator.clipboard.writeText is unavailable or rejects (e.g. unfocused window/iframe permissions).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // 1. Try modern navigator.clipboard.writeText first
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Modern writeText rejected (e.g. NotAllowedError when unfocused)
      // Fall through to execCommand fallback
    }
  }

  // 2. Fallback to document.execCommand("copy")
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.setAttribute("readonly", "");
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
