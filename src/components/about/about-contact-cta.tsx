"use client";

import { useState } from "react";
import { ContactUsModal } from "@/components/about/contact-us-modal";
import { Button } from "@/components/ui/button";

/** Gold Contact Us CTA + modal — used at the bottom of About Us. */
export function AboutContactCta() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mt-16 flex flex-col items-center border-t border-[rgba(212,175,55,0.35)] pt-12 text-center">
        <p className="max-w-md text-base text-[var(--color-muted)]">
          Ready to speak with South East Asia Property Services about your next move?
        </p>
        <Button
          type="button"
          variant="accent"
          size="lg"
          className="seaps-btn-gold mt-6 min-w-[14rem] px-8 text-base shadow-[0_12px_40px_rgba(212,175,55,0.28)]"
          onClick={() => setOpen(true)}
        >
          Contact Us
        </Button>
      </div>
      <ContactUsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
