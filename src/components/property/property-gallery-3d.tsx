"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Pause, Play, X, ZoomIn, ZoomOut } from "lucide-react";
import type { PropertyImage, PropertyVideo } from "@/lib/types";

type MediaFace = {
  url: string;
  kind: "image" | "video";
  label: string;
  index: number;
};

function buildFaces(images: PropertyImage[], videos: PropertyVideo[]): MediaFace[] {
  const photos: MediaFace[] = images.map((img, i) => ({
    url: img.url,
    kind: "image" as const,
    label: img.alt || "Photo",
    index: i,
  }));
  const clips: MediaFace[] = videos.map((vid, i) => ({
    url: vid.url,
    kind: "video" as const,
    label: vid.label || "Video",
    index: photos.length + i,
  }));
  if (clips.length === 0) return photos;
  const faces: MediaFace[] = [];
  const gap = Math.max(1, Math.ceil(photos.length / clips.length));
  let p = 0;
  let v = 0;
  while (p < photos.length || v < clips.length) {
    for (let i = 0; i < gap && p < photos.length; i += 1) faces.push(photos[p++]);
    if (v < clips.length) faces.push(clips[v++]);
  }
  return faces;
}

function prismMetrics(count: number) {
  const n = Math.max(count, 1);
  const faceW = n <= 4 ? 200 : n <= 8 ? 160 : n <= 16 ? 110 : 88;
  const faceH = n <= 8 ? 220 : 190;
  const radius = faceW / 2 / Math.tan(Math.PI / n);
  const span = radius + faceW / 2;
  const scale = Math.min(1.15, 280 / span);
  return { n, faceW, faceH, radius, scale };
}

function LightboxModal({
  face,
  allFaces,
  onClose,
  onNavigate,
}: {
  face: MediaFace;
  allFaces: MediaFace[];
  onClose: () => void;
  onNavigate: (face: MediaFace) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const currentIdx = allFaces.findIndex((f) => f.index === face.index);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < allFaces.length - 1;

  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = face.url;
    a.download = face.label || "media";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [face]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (hasPrev) onNavigate(allFaces[currentIdx - 1]);
          break;
        case "ArrowRight":
          if (hasNext) onNavigate(allFaces[currentIdx + 1]);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onNavigate, hasPrev, hasNext, allFaces, currentIdx]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute right-4 top-4 z-10 flex gap-2">
        <button type="button" className="rounded-full bg-white/10 p-2 text-white" onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(z + 0.5, 4)); }} aria-label="Zoom in"><ZoomIn className="h-5 w-5" /></button>
        <button type="button" className="rounded-full bg-white/10 p-2 text-white" onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(z - 0.5, 0.5)); }} aria-label="Zoom out"><ZoomOut className="h-5 w-5" /></button>
        <button type="button" className="rounded-full bg-white/10 p-2 text-white" onClick={(e) => { e.stopPropagation(); handleDownload(); }} aria-label="Download"><Download className="h-5 w-5" /></button>
        <button type="button" className="rounded-full bg-white/10 p-2 text-white" onClick={onClose} aria-label="Close"><X className="h-6 w-6" /></button>
      </div>
      {hasPrev ? (
        <button type="button" className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white" onClick={(e) => { e.stopPropagation(); setZoom(1); onNavigate(allFaces[currentIdx - 1]); }} aria-label="Previous"><ChevronLeft className="h-6 w-6" /></button>
      ) : null}
      {hasNext ? (
        <button type="button" className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white" onClick={(e) => { e.stopPropagation(); setZoom(1); onNavigate(allFaces[currentIdx + 1]); }} aria-label="Next"><ChevronRight className="h-6 w-6" /></button>
      ) : null}
      <div className="max-h-[85vh] max-w-[90vw] overflow-auto" onClick={(e) => e.stopPropagation()}>
        {face.kind === "video" ? (
          <video src={face.url} controls autoPlay className="max-h-[85vh] rounded-lg" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={face.url} alt={face.label} className="rounded-lg" style={{ transform: `scale(${zoom})`, transformOrigin: "center", maxHeight: "85vh" }} />
        )}
      </div>
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
        {face.label} · {currentIdx + 1}/{allFaces.length}
      </p>
    </div>
  );
}

export function PropertyGallery3D({
  images,
  videos = [],
}: {
  images: PropertyImage[];
  videos?: PropertyVideo[];
}) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeFace, setActiveFace] = useState<MediaFace | null>(null);
  const [rotation, setRotation] = useState({ x: -12, y: 18 });
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);
  const dragged = useRef(false);
  const faces = useMemo(() => buildFaces(images, videos), [images, videos]);
  const metrics = useMemo(() => prismMetrics(faces.length), [faces.length]);

  useEffect(() => {
    if (!autoRotate) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      setRotation((r) => ({ x: r.x, y: r.y + delta * 0.03 }));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoRotate]);

  if (faces.length === 0) return null;

  const step = 360 / metrics.n;

  return (
    <div>
      <div
        className="relative mb-24 flex h-[300px] items-center justify-center overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-b from-[#07111f] to-[#163154] sm:mb-0 sm:h-[460px]"
        style={{ perspective: "1100px" }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragged.current = false;
          drag.current = { x: event.clientX, y: event.clientY, rx: rotation.x, ry: rotation.y };
          setAutoRotate(false);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const dx = event.clientX - drag.current.x;
          const dy = event.clientY - drag.current.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) dragged.current = true;
          setRotation({ x: drag.current.rx - dy * 0.35, y: drag.current.ry + dx * 0.45 });
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        <div
          style={{
            position: "relative",
            width: metrics.faceW,
            height: metrics.faceH,
            transformStyle: "preserve-3d",
            transform: `scale(${metrics.scale}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          }}
        >
          {faces.map((face, i) => (
            <button
              key={face.index}
              type="button"
              onClick={() => {
                if (dragged.current) return;
                setActiveFace(face);
              }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: metrics.faceW,
                height: metrics.faceH,
                padding: 0,
                border: "2px solid rgba(212,175,55,0.85)",
                background: "#10243f",
                transform: `rotateY(${i * step}deg) translateZ(${metrics.radius}px)`,
                backfaceVisibility: "hidden",
                overflow: "hidden",
              }}
            >
              {face.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={face.url} alt={face.label} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <span style={{ display: "flex", height: "100%", width: "100%", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>
                  <Play className="h-6 w-6" /> {face.label}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 p-2 text-white"
          onClick={() => setAutoRotate((v) => !v)}
          aria-label={autoRotate ? "Pause" : "Play"}
        >
          {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <p className="absolute bottom-3 left-3 z-10 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          {faces.length} faces · one file per face · drag to turn
        </p>
      </div>
      {activeFace ? (
        <LightboxModal face={activeFace} allFaces={faces} onClose={() => setActiveFace(null)} onNavigate={setActiveFace} />
      ) : null}
    </div>
  );
}
