"use client";

import { useEffect } from "react";
import {
  EqualsScreenshotShortcutTracker,
  SEAPS_EQUALS_SCREENSHOT_ATTACH_EVENT,
  isEqualsEditableTarget,
  isEqualsShortcutKey,
  stripTrailingEqualsFromElement,
} from "@/lib/seaps-equals-screenshot-shortcut";
import { loadSiteChangeDraft, saveSiteChangeDraft } from "@/lib/site-change-draft";
import { resolveLatestScreenshotFile } from "@/lib/site-change-screenshot-access";

export function SeapsEqualsScreenshotShortcut() {
  useEffect(() => {
    const tracker = new EqualsScreenshotShortcutTracker();

    async function queueScreenshotInDraft(): Promise<void> {
      const result = await resolveLatestScreenshotFile();
      if (!result.ok) return;
      const draft = await loadSiteChangeDraft();
      await saveSiteChangeDraft(draft?.message ?? "", result.file);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.isComposing) {
        tracker.reset();
        return;
      }

      if (!isEqualsShortcutKey(event.key)) {
        if (!event.metaKey && !event.ctrlKey && !event.altKey && event.key.length === 1) {
          tracker.onOtherKey();
        }
        return;
      }

      const target = event.target;
      if (!isEqualsEditableTarget(target)) {
        tracker.reset();
        return;
      }

      if (tracker.onEqualsPress(event.timeStamp || Date.now())) {
        event.preventDefault();
        if (!target.hasAttribute("data-seaps-equals-controlled")) {
          stripTrailingEqualsFromElement(target);
        }
        const onComposerPage = Boolean(
          document.querySelector("[data-seaps-site-change-composer]"),
        );
        if (onComposerPage) {
          window.dispatchEvent(
            new CustomEvent(SEAPS_EQUALS_SCREENSHOT_ATTACH_EVENT, {
              detail: { target },
            }),
          );
        } else {
          void queueScreenshotInDraft();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, []);

  return null;
}
