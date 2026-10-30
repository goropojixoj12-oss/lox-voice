"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Pause, Play, X, ZoomIn, ZoomOut } from "lucide-react";
import type { PropertyImage, PropertyVideo } from "@/lib/types";

type MediaFace = {
  url: string;
  kind: "image" | "video";
  label: string;
  index: number;
};

type Vec4 = { x: number; y: number; z: number; w: number };
type Pt = { x: number; y: number; z: number };

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

function vertex(i: number): Vec4 {
  return {
    x: i & 1 ? 1 : -1,
    y: i & 2 ? 1 : -1,
    z: i & 4 ? 1 : -1,
    w: i & 8 ? 1 : -1,
  };
}

function tesseractSquares(): number[][] {
  const faces: number[][] = [];
  for (let a = 0; a < 4; a += 1) {
    for (let b = a + 1; b < 4; b += 1) {
      const fixed: number[] = [];
      for (let d = 0; d < 4; d += 1) if (d !== a && d !== b) fixed.push(d);
      for (const s0 of [0, 1]) {
        for (const s1 of [0, 1]) {
          const ids: number[] = [];
          for (const va of [0, 1]) {
            for (const vb of [0, 1]) {
              let id = 0;
              if (va) id |= 1 << a;
              if (vb) id |= 1 << b;
              if (s0) id |= 1 << fixed[0];
              if (s1) id |= 1 << fixed[1];
              ids.push(id);
            }
          }
          faces.push([ids[0], ids[1], ids[3], ids[2]]);
        }
      }
    }
  }
  return faces;
}

function tesseractEdges(): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < 16; i += 1) {
    for (let b = 0; b < 4; b += 1) {
      const j = i | (1 << b);
      if (j > i) edges.push([i, j]);
    }
  }
  return edges;
}

const SQUARES = tesseractSquares();
const EDGES = tesseractEdges();

function rotate4(v: Vec4, plane: [number, number], angle: number): Vec4 {
  const arr = [v.x, v.y, v.z, v.w];
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const i = plane[0];
  const j = plane[1];
  const vi = arr[i];
  const vj = arr[j];
  arr[i] = vi * c - vj * s;
  arr[j] = vi * s + vj * c;
  return { x: arr[0], y: arr[1], z: arr[2], w: arr[3] };
}

function project(v: Vec4): Pt {
  const distance = 2.55;
  const persp = distance / (distance - v.w);
  const scale = 92;
  return {
    x: 200 + v.x * persp * scale,
    y: 200 + v.y * persp * scale,
    z: v.z * persp,
  };
}

function facing(q: Pt[]): number {
  return (q[1].x - q[0].x) * (q[3].y - q[0].y) - (q[1].y - q[0].y) * (q[3].x - q[0].x);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" role="dialog" aria-modal="true" onClick={onClose}>
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
  const uid = useId().replace(/:/g, "");
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeFace, setActiveFace] = useState<MediaFace | null>(null);
  const [rot, setRot] = useState({ xw: 0.55, yw: 0.85, zw: 0.18, xy: 0.35 });
  const drag = useRef<{ x: number; y: number; xw: number; yw: number } | null>(null);
  const dragged = useRef(false);
  const faces = useMemo(() => buildFaces(images, videos), [images, videos]);

  useEffect(() => {
    if (!autoRotate) return;
    const id = window.setInterval(() => {
      setRot((r) => ({
        ...r,
        xw: r.xw + 0.028,
        yw: r.yw + 0.016,
        xy: r.xy + 0.006,
      }));
    }, 40);
    return () => window.clearInterval(id);
  }, [autoRotate]);

  const model = useMemo(() => {
    const pts = Array.from({ length: 16 }, (_, i) => {
      let v = vertex(i);
      v = rotate4(v, [0, 1], rot.xy);
      v = rotate4(v, [0, 3], rot.xw);
      v = rotate4(v, [1, 3], rot.yw);
      v = rotate4(v, [2, 3], rot.zw);
      return project(v);
    });
    const faceModels = SQUARES.map((ids, faceIndex) => {
      const quad = ids.map((id) => pts[id]);
      return {
        faceIndex,
        ids,
        quad,
        points: quad.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" "),
        depth: (quad[0].z + quad[1].z + quad[2].z + quad[3].z) / 4,
        area: facing(quad),
      };
    }).sort((a, b) => a.depth - b.depth);
    return { pts, faceModels };
  }, [rot]);

  if (faces.length === 0) return null;

  return (
    <div className="mb-24 sm:mb-0">
      <div
        className="relative flex h-[360px] items-center justify-center rounded-[var(--radius-xl)] bg-gradient-to-b from-[#07111f] to-[#163154] sm:h-[540px]"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragged.current = false;
          drag.current = { x: event.clientX, y: event.clientY, xw: rot.xw, yw: rot.yw };
          setAutoRotate(false);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const dx = event.clientX - drag.current.x;
          const dy = event.clientY - drag.current.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) dragged.current = true;
          setRot((r) => ({
            ...r,
            yw: drag.current!.yw + dx * 0.01,
            xw: drag.current!.xw + dy * 0.01,
          }));
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        <svg viewBox="0 0 400 400" className="h-full w-full drop-shadow-[0_0_18px_rgba(212,175,55,0.35)]">
          <defs>
            {faces.map((face) =>
              face.kind === "image" ? (
                <pattern key={face.index} id={`${uid}-p${face.index}`} width="1" height="1" patternContentUnits="objectBoundingBox">
                  <image href={face.url} width="1" height="1" preserveAspectRatio="xMidYMid slice" />
                </pattern>
              ) : null,
            )}
          </defs>
          {EDGES.map(([a, b]) => {
            const wEdge = (a ^ b) === 8;
            return (
              <line
                key={`${a}-${b}`}
                x1={model.pts[a].x}
                y1={model.pts[a].y}
                x2={model.pts[b].x}
                y2={model.pts[b].y}
                stroke={wEdge ? "rgba(212,175,55,0.45)" : "rgba(212,175,55,0.95)"}
                strokeWidth={wEdge ? 1 : 2.4}
              />
            );
          })}
          {model.faceModels.map((item) => {
            const back = item.area < 30;
            const media = faces[item.faceIndex % faces.length];
            const fill = media.kind === "image" ? `url(#${uid}-p${media.index})` : "rgba(8,22,40,0.55)";
            return (
              <g key={item.faceIndex}>
                <polygon
                  points={item.points}
                  fill={fill}
                  fillOpacity={back ? 0.22 : 0.9}
                  stroke="#D4AF37"
                  strokeWidth={back ? 0.8 : 1.6}
                  onClick={() => {
                    if (dragged.current || back) return;
                    setActiveFace(media);
                  }}
                  style={{ cursor: back ? "default" : "pointer" }}
                />
                {!back && media.kind === "video" ? (
                  <text
                    x={(item.quad[0].x + item.quad[2].x) / 2}
                    y={(item.quad[0].y + item.quad[2].y) / 2}
                    textAnchor="middle"
                    fill="#D4AF37"
                    fontSize="9"
                  >
                    ▶ {media.label}
                  </text>
                ) : null}
              </g>
            );
          })}
          {model.pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.6" fill="#D4AF37" />
          ))}
        </svg>
        <button
          type="button"
          className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 p-2 text-white"
          onClick={() => setAutoRotate((v) => !v)}
          aria-label={autoRotate ? "Pause" : "Play"}
        >
          {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <p className="absolute bottom-3 left-3 z-10 max-w-[75%] rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          4D tesseract · inner cube grows outward · 24 faces · {faces.length} files
        </p>
      </div>
      {activeFace ? (
        <LightboxModal face={activeFace} allFaces={faces} onClose={() => setActiveFace(null)} onNavigate={setActiveFace} />
      ) : null}
    </div>
  );
}
