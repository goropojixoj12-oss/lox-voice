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
