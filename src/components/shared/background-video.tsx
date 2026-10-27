"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type BackgroundVideoProps = {
  /** Desktop / default source */
  src: string;
  /** Lighter source for small screens */
  mobileSrc?: string;
  poster: string;
  className?: string;
  /** Extra darken / tint over the video */
  overlayClassName?: string;
  /** Prefer autoplay as soon as mounted (hero). Footer uses in-view. */
  eager?: boolean;
};

export function BackgroundVideo({
  src,
  mobileSrc,
  poster,
  className,
  overlayClassName,
  eager = false,
}: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [activeSrc, setActiveSrc] = useState(src);

  useEffect(() => {
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqMobile = window.matchMedia("(max-width: 767px)");

    const sync = () => {
      setReduceMotion(mqMotion.matches);
      setActiveSrc(mqMobile.matches && mobileSrc ? mobileSrc : src);
    };

    sync();
    mqMotion.addEventListener("change", sync);
    mqMobile.addEventListener("change", sync);
    return () => {
      mqMotion.removeEventListener("change", sync);
      mqMobile.removeEventListener("change", sync);
    };
  }, [mobileSrc, src]);

  useEffect(() => {
    const video = videoRef.current;
    const root = rootRef.current;
    if (!video || reduceMotion) return;

    video.load();

    const tryPlay = () => {
      void video.play().catch(() => {
        /* autoplay can be blocked; poster remains visible */
      });
    };

    if (eager) {
      tryPlay();
      return;
    }

    if (!root || typeof IntersectionObserver === "undefined") {
      tryPlay();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible) tryPlay();
        else video.pause();
      },
      { rootMargin: "120px 0px", threshold: 0.15 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, [activeSrc, eager, reduceMotion]);

  return (
    <div ref={rootRef} className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {/* Poster always underneath for first paint / reduced motion / decode gaps */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${poster})` }}
      />
      {!reduceMotion ? (
        <video
          ref={videoRef}
          key={activeSrc}
          className="absolute inset-0 h-full w-full object-cover"
          poster={poster}
          muted
          playsInline
          loop
          autoPlay={eager}
          preload={eager ? "auto" : "metadata"}
          disablePictureInPicture
          controls={false}
        >
          <source src={activeSrc} type="video/mp4" />
        </video>
      ) : null}
      <div
        className={cn(
          "absolute inset-0 bg-[linear-gradient(105deg,rgba(7,17,31,0.88)_0%,rgba(11,28,51,0.72)_50%,rgba(11,28,51,0.45)_100%)]",
          overlayClassName,
        )}
      />
    </div>
  );
}
