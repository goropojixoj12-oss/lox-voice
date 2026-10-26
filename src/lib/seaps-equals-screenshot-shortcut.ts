export const EQUALS_SCREENSHOT_PRESS_COUNT = 5;
export const EQUALS_SCREENSHOT_WINDOW_MS = 5000;

/** Tracks five consecutive `=` key presses within a time window. */
export class EqualsScreenshotShortcutTracker {
  private count = 0;
  private firstPressAt = 0;

  reset(): void {
    this.count = 0;
    this.firstPressAt = 0;
  }

  /** Call on any non-modifier key that is not `=`. */
  onOtherKey(): void {
    this.reset();
  }

  /**
   * Call when the user presses `=`.
   * Returns true when the fifth press completes within the window.
   */
  onEqualsPress(now = Date.now()): boolean {
    if (this.count === 0) {
      this.firstPressAt = now;
      this.count = 1;
      return false;
    }

    if (now - this.firstPressAt > EQUALS_SCREENSHOT_WINDOW_MS) {
      this.firstPressAt = now;
      this.count = 1;
      return false;
    }

    this.count += 1;
    if (this.count >= EQUALS_SCREENSHOT_PRESS_COUNT) {
      this.reset();
      return true;
    }
    return false;
  }
}

/** Remove up to four trailing equals left in the field when the shortcut fires. */
export function stripTrailingEqualsCommand(text: string): string {
  return text.replace(/={1,4}$/, "");
}

export function isEqualsShortcutKey(key: string): boolean {
  return key === "=" || key === "Equal";
}

export const SEAPS_EQUALS_SCREENSHOT_ATTACH_EVENT = "seaps:equals-screenshot-attach";

export const SEAPS_EQUALS_SHORTCUT_EXCLUDE_ATTR = "data-seaps-no-equals-screenshot";

export function isEqualsShortcutExcluded(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return true;
  return Boolean(target.closest(`[${SEAPS_EQUALS_SHORTCUT_EXCLUDE_ATTR}]`));
}

export function isEqualsEditableTarget(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;
  if (isEqualsShortcutExcluded(target)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement) return !target.disabled && !target.readOnly;
  if (target instanceof HTMLInputElement) {
    if (target.disabled || target.readOnly) return false;
    const t = target.type;
    if (t === "checkbox" || t === "radio" || t === "file" || t === "button" || t === "submit") {
      return false;
    }
    return true;
  }
  return false;
}

/** Strip equals left in the field when the fifth press is prevented (controlled fields use state). */
export function stripTrailingEqualsFromElement(element: HTMLElement): void {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    element.value = stripTrailingEqualsCommand(element.value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  if (element.isContentEditable) {
    const text = element.innerText;
    element.innerText = stripTrailingEqualsCommand(text);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
