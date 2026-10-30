"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { X, ZoomIn, ZoomOut, Download, Pause, Play, ChevronLeft, ChevronRight } from "lucide-react";
import type { PropertyImage, PropertyVideo } from "@/lib/types";

type MediaFace = {
  url: string;
  kind: "image" | "video";
  label: string;
  index: number;
};

const FACE_LAYOUT = [
  "rotateY(0deg) translateZ(110px)",
  "rotateY(180deg) translateZ(110px)",
  "rotateY(90deg) translateZ(110px)",
  "rotateY(-90deg) translateZ(110px)",
  "rotateX(90deg) translateZ(110px)",
  "rotateX(-90deg) translateZ(110px)",
] as const;

function buildFaces(images: PropertyImage[], videos: PropertyVideo[]): MediaFace[] {
  const faces: MediaFace[] = [];
  let idx = 0;
  for (const img of images) {
    faces.push({ url: img.url, kind: "image", label: img.alt || "Photo", index: idx++ });
  }
  for (const vid of videos) {
    faces.push({ url: vid.url, kind: "video", label: vid.label || "Video", index: idx++ });
  }
  return faces;
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
        <button
          type="button"
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(z + 0.5, 4)); }}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(z - 0.5, 0.5)); }}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); handleDownload(); }}
          aria-label="Download"
        >
          <Download className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {hasPrev ? (
        <button
          type="button"
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); setZoom(1); onNavigate(allFaces[currentIdx - 1]); }}
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      ) : null}
      {hasNext ? (
        <button
          type="button"
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); setZoom(1); onNavigate(allFaces[currentIdx + 1]); }}
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      ) : null}

      <div className="max-h-[85vh] max-w-[90vw] overflow-auto" onClick={(e) => e.stopPropagation()}>
        {face.kind === "video" ? (
          <video
            src={face.url}
            controls
            autoPlay
            className="max-h-[85vh] rounded-lg"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={face.url}
            alt={face.label}
            className="rounded-lg"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center",
              maxHeight: "85vh",
              cursor: zoom < 4 ? "zoom-in" : "zoom-out",
            }}
            onClick={() => setZoom((z) => (z < 4 ? z + 0.5 : 1))}
          />
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
        <span className="text-sm text-white/70">{face.label}</span>
        <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/50">
          {currentIdx + 1} / {allFaces.length}
        </span>
      </div>
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
  const [cubePage, setCubePage] = useState(0);
  const [rotation, setRotation] = useState({ x: -18, y: 28 });
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);
  const dragged = useRef(false);

  const faces = useMemo(() => buildFaces(images, videos), [images, videos]);
  const totalPages = Math.max(1, Math.ceil(faces.length / 6));
  const pageFaces = faces.slice(cubePage * 6, cubePage * 6 + 6);

  useEffect(() => {
    if (!autoRotate) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      setRotation((r) => ({ x: r.x + delta * 0.004, y: r.y + delta * 0.02 }));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoRotate]);

  useEffect(() => {
    if (!autoRotate || faces.length <= 6) return;
    const interval = setInterval(() => {
      setCubePage((p) => (p + 1) % totalPages);
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRotate, faces.length, totalPages]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragged.current = false;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      rx: rotation.x,
      ry: rotation.y,
    };
    setAutoRotate(false);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) dragged.current = true;
    setRotation({
      x: drag.current.rx - dy * 0.45,
      y: drag.current.ry + dx * 0.45,
    });
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  if (faces.length === 0) return null;

  return (
    <div className="relative">
      <div className="relative h-[340px] overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-b from-[#0B1C33] to-[#162D50] sm:h-[460px]">
        <div
          className="flex h-full w-full items-center justify-center [perspective:900px]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="relative h-[220px] w-[220px] [transform-style:preserve-3d]"
            style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
          >
            {FACE_LAYOUT.map((transform, i) => {
              const face = pageFaces[i % Math.max(pageFaces.length, 1)];
              if (!face) return null;
              return (
                <button
                  key={`${cubePage}-${face.index}-${i}`}
                  type="button"
                  className="absolute inset-0 overflow-hidden border border-[#D4AF37]/40 bg-[#10243f] shadow-lg [backface-visibility:hidden]"
                  style={{ transform }}
                  onClick={() => {
                    if (dragged.current) return;
                    setActiveFace(face);
                  }}
                >
                  {face.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={face.url} alt={face.label} className="h-full w-full object-cover" draggable={false} />
                  ) : (
                    <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#0d2137] text-sm text-white">
                      <Play className="h-8 w-8 text-[#D4AF37]" />
                      {face.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="absolute bottom-3 right-3 z-10 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/70"
          onClick={() => setAutoRotate((v) => !v)}
          aria-label={autoRotate ? "Pause rotation" : "Resume rotation"}
        >
          {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <div className="absolute bottom-3 left-3 z-10 rounded-full bg-black/50 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
          {faces.length} media · {cubePage + 1}/{totalPages} · drag to spin
        </div>

        {totalPages > 1 ? (
          <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCubePage(i)}
                className={`h-2 w-2 rounded-full transition ${
                  i === cubePage ? "scale-125 bg-[#D4AF37]" : "bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {faces.map((face) => (
          <button
            key={face.index}
            type="button"
            onClick={() => setActiveFace(face)}
            className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2 transition hover:opacity-100 ${
              Math.floor(face.index / 6) === cubePage
                ? "border-[#D4AF37]/60 opacity-100"
                : "border-transparent opacity-60"
            }`}
          >
            {face.kind === "video" ? (
              <span className="flex h-full w-full items-center justify-center bg-[#0B1C33] text-xs text-white">
                <Play className="mr-1 h-3 w-3" /> Video
              </span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={face.url} alt={face.label} className="h-full w-full object-cover" />
            )}
          </button>
        ))}
      </div>

      {activeFace ? (
        <LightboxModal
          face={activeFace}
          allFaces={faces}
          onClose={() => setActiveFace(null)}
          onNavigate={(f) => setActiveFace(f)}
        />
      ) : null}
    </div>
  );
}
