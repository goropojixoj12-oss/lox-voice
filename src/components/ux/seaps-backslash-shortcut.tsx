"use client";

import { useEffect } from "react";
import {
  SEAPS_BACKSLASH_SHORTCUT_COUNT,
  SEAPS_BACKSLASH_SHORTCUT_WINDOW_MS,
  applyBackslashShortcut,
  isBackslashKey,
  isEditableTextTarget,
  isModifierOnlyKey,
  shouldResetSequenceDueToTimeout,
} from "@/lib/seaps-backslash-shortcut";

export function SeapsBackslashShortcut() {
  useEffect(() => {
    let count = 0;
    let firstPressAt: number | null = null;
    let sequenceTarget: HTMLElement | null = null;

    function resetSequence() {
      count = 0;
      firstPressAt = null;
      sequenceTarget = null;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.isComposing) {
        resetSequence();
        return;
      }

      if (isModifierOnlyKey(event)) {
        return;
      }

      const target = event.target;

      if (isBackslashKey(event)) {
        if (!isEditableTextTarget(target)) {
          resetSequence();
          return;
        }

        const now = event.timeStamp || Date.now();

        if (
          sequenceTarget !== target ||
          shouldResetSequenceDueToTimeout(firstPressAt, now)
        ) {
          count = 0;
          firstPressAt = now;
          sequenceTarget = target;
        }

        count += 1;

        if (count >= SEAPS_BACKSLASH_SHORTCUT_COUNT) {
          event.preventDefault();
          applyBackslashShortcut(target);
          resetSequence();
        }

        return;
      }

      resetSequence();
    }

    function onBlur() {
      resetSequence();
    }

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusout", onBlur, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusout", onBlur, true);
    };
  }, []);

  return null;
}
