"use client";

import { useState } from "react";
import { CareersApplicationModal } from "@/components/careers/careers-application-modal";
import { Button } from "@/components/ui/button";

/** Gold apply CTA + careers modal with CV upload — bottom of Careers page. */
export function CareersApplyCta() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mt-16 flex flex-col items-center border-t border-[rgba(212,175,55,0.35)] pt-12 text-center">
        <p className="max-w-lg text-base leading-relaxed text-[var(--color-muted)]">
          Ready to take the next step? Submit your CV and a brief introduction to express your
          interest in joining the SEAPS team.
        </p>
        <Button
          type="button"
          variant="accent"
          size="lg"
          className="seaps-btn-gold mt-6 min-w-[14rem] px-8 text-base shadow-[0_12px_40px_rgba(212,175,55,0.28)]"
          onClick={() => setOpen(true)}
        >
          Submit application
        </Button>
      </div>
      <CareersApplicationModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
