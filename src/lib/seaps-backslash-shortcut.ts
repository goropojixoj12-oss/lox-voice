/** Exact replacement when five `\` keys are pressed within the window. */
export const SEAPS_BACKSLASH_SHORTCUT_REPLACEMENT =
  "South East Asian Property Services";

export const SEAPS_BACKSLASH_SHORTCUT_COUNT = 5;
export const SEAPS_BACKSLASH_SHORTCUT_WINDOW_MS = 5000;

export const SEAPS_BACKSLASH_SHORTCUT_EXCLUDE_ATTR = "data-seaps-no-backslash-shortcut";

const MODIFIER_KEYS = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "NumLock",
  "ScrollLock",
  "ContextMenu",
]);

export function isBackslashKey(event: KeyboardEvent): boolean {
  return event.key === "\\" || event.code === "Backslash";
}

export function isModifierOnlyKey(event: KeyboardEvent): boolean {
  return MODIFIER_KEYS.has(event.key);
}

export function isShortcutExcludedTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return true;
  }
  return Boolean(target.closest(`[${SEAPS_BACKSLASH_SHORTCUT_EXCLUDE_ATTR}]`));
}

export function isEditableTextTarget(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (isShortcutExcludedTarget(target)) {
    return false;
  }

  if (target instanceof HTMLTextAreaElement) {
    return !target.disabled && !target.readOnly;
  }

  if (target instanceof HTMLInputElement) {
    if (target.disabled || target.readOnly) {
      return false;
    }
    const type = (target.type || "text").toLowerCase();
    if (type === "hidden" || type === "checkbox" || type === "radio" || type === "file") {
      return false;
    }
    return true;
  }

  if (target.isContentEditable) {
    return true;
  }

  return false;
}

export function shouldResetSequenceDueToTimeout(
  firstPressAt: number | null,
  now: number,
  windowMs: number = SEAPS_BACKSLASH_SHORTCUT_WINDOW_MS,
): boolean {
  if (firstPressAt === null) {
    return false;
  }
  return now - firstPressAt > windowMs;
}

export function applyBackslashShortcutToInputElement(
  element: HTMLInputElement | HTMLTextAreaElement,
  replacement: string = SEAPS_BACKSLASH_SHORTCUT_REPLACEMENT,
): boolean {
  const start = element.selectionStart;
  const end = element.selectionEnd;
  if (start === null || end === null || start !== end) {
    return false;
  }

  const fourBackslashes = String.raw`\\\\`;
  const value = element.value;
  const before = value.slice(0, start);
  if (!before.endsWith(fourBackslashes)) {
    return false;
  }

  const newBefore = before.slice(0, -fourBackslashes.length);
  const after = value.slice(end);
  const newValue = newBefore + replacement + after;
  element.value = newValue;
  const caret = newBefore.length + replacement.length;
  element.setSelectionRange(caret, caret);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

function getTextNodeAndOffsetAtCaret(
  root: HTMLElement,
): { node: Text; offset: number } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  const range = selection.getRangeAt(0);
  if (!range.collapsed || !root.contains(range.startContainer)) {
    return null;
  }

  let node: Node = range.startContainer;
  let offset = range.startOffset;

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const child = el.childNodes[offset - 1] ?? el.childNodes[offset];
    if (child?.nodeType === Node.TEXT_NODE) {
      node = child;
      offset = offset > 0 ? (child as Text).length : 0;
    } else {
      return null;
    }
  }

  if (node.nodeType !== Node.TEXT_NODE) {
    return null;
  }

  return { node: node as Text, offset };
}

export function applyBackslashShortcutToContentEditable(
  root: HTMLElement,
  replacement: string = SEAPS_BACKSLASH_SHORTCUT_REPLACEMENT,
): boolean {
  const caret = getTextNodeAndOffsetAtCaret(root);
  if (!caret) {
    return false;
  }

  const fourBackslashes = String.raw`\\\\`;
  const { node, offset } = caret;
  const before = node.data.slice(0, offset);
  if (!before.endsWith(fourBackslashes)) {
    return false;
  }

  const newBefore = before.slice(0, -fourBackslashes.length);
  node.data = newBefore + replacement + node.data.slice(offset);
  const newOffset = newBefore.length + replacement.length;

  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.setStart(node, newOffset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  root.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

export function applyBackslashShortcut(
  target: HTMLElement,
  replacement: string = SEAPS_BACKSLASH_SHORTCUT_REPLACEMENT,
): boolean {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return applyBackslashShortcutToInputElement(target, replacement);
  }
  if (target.isContentEditable) {
    return applyBackslashShortcutToContentEditable(target, replacement);
  }
  return false;
}
