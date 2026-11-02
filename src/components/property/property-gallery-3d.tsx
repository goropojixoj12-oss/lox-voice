"use client";

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
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
type Rot = {
  xw: number;
  yw: number;
  zw: number;
  xy: number;
  yaw: number;
  pitch: number;
};

type CubeFaceModel = {
  side: number;
  quad: Pt[];
  points: string;
  cx: number;
  cy: number;
  front: boolean;
  affine: string;
};

const VIEW = 1000;
/** 4D eye distance — hypercube.tbrun.dev default. */
const D4 = 3;
/** 3D camera distance; keep above projected |z| so the outer cell stays cubic. */
const D3 = 7.5;
const GOLD = "#D4AF37";
const GOLD_BRIGHT = "#F0D78C";
/** Solid base under each photo, so a face is never see-through even if its image fails. */
const FACE_BASE = "#0f2138";

/** Nested cubes at rest; XW/YW auto-rotate grows the inner cell outward. */
const INITIAL_ROT: Rot = {
  xw: 0.08,
  yw: 0.1,
  zw: 0,
  xy: 0,
  yaw: 0.55,
  pitch: 0.38,
};
/** rad/s — XW/YW morph the cage; yaw tumbles it and the solid cube together. */
const XW_SPEED = 0.1;
const YW_SPEED = 0.07;
const YAW_SPEED = 0.035;

/** Solid corner radius in camera units — stays inside the projected outer cell (radius 1.5). */
const CUBE_HALF = 0.72;
/**
 * The 6 faces as corner rings [top-left, top-right, bottom-right, bottom-left] of the photo.
 * Wound clockwise when seen from outside, with the photo's own up edge first.
 * Corners are indexed by bits: bit0 = x, bit1 = y, bit2 = z, set means +CUBE_HALF.
 */
const CUBE_FACES: number[][] = [
  [6, 7, 5, 4], // +z front
  [7, 3, 1, 5], // +x right
  [3, 2, 0, 1], // -z back
  [2, 6, 4, 0], // -x left
  [2, 3, 7, 6], // +y top, up edge meets the back face
  [4, 5, 1, 0], // -y bottom, up edge meets the front face
];

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

function orbit3(p: Pt, yaw: number, pitch: number): Pt {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = p.x * cy - p.z * sy;
  const z1 = p.x * sy + p.z * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return {
    x: x1,
    y: p.y * cp - z1 * sp,
    z: p.y * sp + z1 * cp,
  };
}

/**
 * dot(outward normal, face centre - camera) for the ring [TL,TR,BR,BL] in camera space.
 * Negative means the face looks at the camera. Measured from the camera point rather than
 * from its z alone, so a face seen almost edge-on is never culled on the wrong side.
 */
function facing(q: Pt[]): number {
  const e1x = q[1].x - q[0].x;
  const e1y = q[1].y - q[0].y;
  const e1z = q[1].z - q[0].z;
  const e3x = q[3].x - q[0].x;
  const e3y = q[3].y - q[0].y;
  const e3z = q[3].z - q[0].z;
  const nx = e3y * e1z - e3z * e1y;
  const ny = e3z * e1x - e3x * e1z;
  const nz = e3x * e1y - e3y * e1x;
  const cx = (q[0].x + q[2].x) / 2;
  const cy = (q[0].y + q[2].y) / 2;
  const cz = (q[0].z + q[2].z) / 2 - D3;
  return nx * cx + ny * cy + nz * cz;
}

/**
 * Maps the square photo onto the ring [TL,TR,BR,BL]: local x runs TL→TR, local y runs TL→BL.
 * The determinant is positive, so the photo is never mirrored, and it needs no vertex search.
 */
function affineMatrix(q: Pt[]): string {
  const a = q[1].x - q[0].x;
  const c = q[1].y - q[0].y;
  const b = q[3].x - q[0].x;
  const d = q[3].y - q[0].y;
  return `${a} ${c} ${b} ${d} ${q[0].x} ${q[0].y}`;
}

function projectRaw(rot: Rot): Pt[] {
  const cam = Array.from({ length: 16 }, (_, i) => {
    let v = vertex(i);
    v = rotate4(v, [0, 1], rot.xy);
    v = rotate4(v, [0, 3], rot.xw);
    v = rotate4(v, [1, 3], rot.yw);
    v = rotate4(v, [2, 3], rot.zw);
    const k4 = D4 / (D4 - v.w);
    return orbit3({ x: v.x * k4, y: v.y * k4, z: v.z * k4 }, rot.yaw, rot.pitch);
  });
  return cam.map((p) => {
    const z = Math.min(p.z, D3 - 0.6);
    const k = D3 / (D3 - z);
    return { x: p.x * k, y: p.y * k, z: p.z };
  });
}

const CAMERA_FIT = (() => {
  const raw = projectRaw(INITIAL_ROT);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of raw) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const span = Math.max(maxX - minX, maxY - minY, 0.2);
  return {
    scale: (VIEW * 0.82) / span,
    ox: (minX + maxX) / 2,
    oy: (minY + maxY) / 2,
  };
})();

/** Camera-space corner of the solid photo cube; rigid, only yaw/pitch touch it. */
function cubeCorner(i: number, rot: Rot): Pt {
  return orbit3(
    {
      x: i & 1 ? CUBE_HALF : -CUBE_HALF,
      y: i & 2 ? CUBE_HALF : -CUBE_HALF,
      z: i & 4 ? CUBE_HALF : -CUBE_HALF,
    },
    rot.yaw,
    rot.pitch,
  );
}

function toScreen(p: Pt): { x: number; y: number; z: number } {
  const z = Math.min(p.z, D3 - 0.6);
  const k = D3 / (D3 - z);
  return {
    x: VIEW / 2 + (p.x * k - CAMERA_FIT.ox) * CAMERA_FIT.scale,
    y: VIEW / 2 - (p.y * k - CAMERA_FIT.oy) * CAMERA_FIT.scale,
    z: p.z,
  };
}

function buildModel(rot: Rot): { pts: Pt[]; cube: CubeFaceModel[] } {
  const raw = projectRaw(rot);
  const pts = raw.map((p) => ({
    x: VIEW / 2 + (p.x - CAMERA_FIT.ox) * CAMERA_FIT.scale,
    y: VIEW / 2 - (p.y - CAMERA_FIT.oy) * CAMERA_FIT.scale,
    z: p.z,
  }));
  const cube = CUBE_FACES.map((face, index) => {
    const quad = face.map((i) => cubeCorner(i, rot));
    const screen = quad.map(toScreen);
    return {
      side: index,
      quad,
      points: screen.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" "),
      cx: (screen[0].x + screen[1].x + screen[2].x + screen[3].x) / 4,
      cy: (screen[0].y + screen[1].y + screen[2].y + screen[3].y) / 4,
      front: facing(quad) < 0,
      affine: affineMatrix(screen),
    };
  });
  return { pts, cube };
}

type MotionState = {
  rot: Rot;
  base: Rot;
  spinning: boolean;
  spinStartedAt: number;
  drag: { x: number; y: number; yaw: number; pitch: number; xw: number; yw: number } | null;
  dragged: boolean;
  paint: () => void;
};

const MOTION = new WeakMap<SVGSVGElement, MotionState>();

function attachTesseractMotion(svg: SVGSVGElement) {
  if (svg.dataset.live === "1") return MOTION.get(svg);
  const facesLayer = svg.querySelector("[data-layer='faces']") as SVGGElement | null;
  if (!facesLayer) return undefined;

  const lines = EDGES.map(([a, b]) => svg.querySelector(`line[data-e="${a}-${b}"]`) as SVGLineElement | null);
  const groups = CUBE_FACES.map((_, i) => facesLayer.querySelector(`g[data-f="${i}"]`) as SVGGElement | null);
  const bases = CUBE_FACES.map((_, i) => facesLayer.querySelector(`polygon[data-ft="${i}"]`) as SVGPolygonElement | null);
  const clips = CUBE_FACES.map((_, i) => svg.querySelector(`polygon[data-fc="${i}"]`) as SVGPolygonElement | null);
  const images = CUBE_FACES.map((_, i) => facesLayer.querySelector(`image[data-fi="${i}"]`) as SVGImageElement | null);
  const plays = CUBE_FACES.map((_, i) => facesLayer.querySelector(`polygon[data-fpb="${i}"]`) as SVGPolygonElement | null);
  const circles = Array.from({ length: 16 }, (_, i) => svg.querySelector(`circle[data-v="${i}"]`) as SVGCircleElement | null);

  const state: MotionState = {
    rot: { ...INITIAL_ROT },
    base: { ...INITIAL_ROT },
    spinning: svg.dataset.paused !== "1" && svg.dataset.dragging !== "1",
    spinStartedAt: performance.now(),
    drag: null,
    dragged: false,
    paint: () => {},
  };

  const paint = () => {
    const { pts, cube } = buildModel(state.rot);
    svg.setAttribute("data-xw", state.rot.xw.toFixed(4));
    svg.setAttribute("data-yw", state.rot.yw.toFixed(4));
    svg.setAttribute("data-yaw", state.rot.yaw.toFixed(4));
    for (let i = 0; i < EDGES.length; i += 1) {
      const line = lines[i];
      if (!line) continue;
      const [a, b] = EDGES[i];
      line.setAttribute("x1", pts[a].x.toFixed(2));
      line.setAttribute("y1", pts[a].y.toFixed(2));
      line.setAttribute("x2", pts[b].x.toFixed(2));
      line.setAttribute("y2", pts[b].y.toFixed(2));
    }
    /* Visible faces of a convex solid never overlap, so the DOM order stays untouched —
       moving nodes here would desynchronise them from React's hydration pairing. */
    for (let idx = 0; idx < cube.length; idx += 1) {
      const group = groups[idx];
      const item = cube[idx];
      if (!group) continue;
      group.setAttribute("display", item.front ? "block" : "none");
      if (!item.front) continue;
      const base = bases[idx];
      if (base) base.setAttribute("points", item.points);
      const clip = clips[idx];
      if (clip) clip.setAttribute("points", item.points);
      const image = images[idx];
      if (image) image.setAttribute("transform", `matrix(${item.affine})`);
      const play = plays[idx];
      if (play) {
        play.setAttribute("points", `${item.cx + 14},${item.cy} ${item.cx - 9},${item.cy - 11} ${item.cx - 9},${item.cy + 11}`);
      }
    }
    for (let i = 0; i < 16; i += 1) {
      const c = circles[i];
      if (!c) continue;
      c.setAttribute("cx", pts[i].x.toFixed(2));
      c.setAttribute("cy", pts[i].y.toFixed(2));
    }
  };
  state.paint = paint;

  let raf = 0;
  let frames = 0;
  const tick = (now: number) => {
    const spin = svg.dataset.paused !== "1" && svg.dataset.dragging !== "1";
    if (spin) {
      if (!state.spinning) {
        state.spinStartedAt = now;
        state.base = { ...state.rot };
      }
      const elapsed = (now - state.spinStartedAt) / 1000;
      state.rot = {
        ...state.base,
        xw: state.base.xw + elapsed * XW_SPEED,
        yw: state.base.yw + elapsed * YW_SPEED,
        yaw: state.base.yaw + elapsed * YAW_SPEED,
      };
    }
    state.spinning = spin;
    frames += 1;
    svg.setAttribute("data-frames", String(frames));
    paint();
  };
  const loop = (now: number) => {
    tick(now);
    raf = window.requestAnimationFrame(loop);
  };
  svg.dataset.live = "1";
  svg.setAttribute("data-live", "1");
  tick(performance.now());
  raf = window.requestAnimationFrame(loop);
  window.setInterval(() => tick(performance.now()), 16);
  MOTION.set(svg, state);
  void raf;
  return state;
}

function bootTesseractMotion() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const scan = () => {
    document.querySelectorAll<SVGSVGElement>("svg[data-tesseract]").forEach((svg) => {
      attachTesseractMotion(svg);
    });
  };
  scan();
  window.requestAnimationFrame(scan);
  window.setInterval(scan, 200);
  document.addEventListener("DOMContentLoaded", scan);
}

bootTesseractMotion();

function setTesseractPaused(paused: boolean) {
  if (typeof document === "undefined") return;
  document.querySelectorAll<SVGSVGElement>("svg[data-tesseract]").forEach((svg) => {
    svg.dataset.paused = paused ? "1" : "0";
    const state = MOTION.get(svg);
    if (state && !paused) {
      state.base = { ...state.rot };
      state.spinStartedAt = performance.now();
      state.spinning = false;
    }
  });
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


const TesseractCanvas = memo(function TesseractCanvas({
  uid,
  faces,
  onOpenFace,
}: {
  uid: string;
  faces: MediaFace[];
  onOpenFace: (face: MediaFace) => void;
}) {
  const initial = useMemo(() => buildModel(INITIAL_ROT), []);
  const dragged = useRef(false);

  const bindSvg = (svg: SVGSVGElement | null) => {
    if (svg) attachTesseractMotion(svg);
  };

  return (
    <div
      className="h-full w-full touch-none"
      data-tesseract-drag="1"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        const svg = event.currentTarget.querySelector("svg[data-tesseract]") as SVGSVGElement | null;
        if (!svg) return;
        const state = attachTesseractMotion(svg);
        if (!state) return;
        dragged.current = false;
        state.dragged = false;
        svg.dataset.dragging = "1";
        state.drag = {
          x: event.clientX,
          y: event.clientY,
          yaw: state.rot.yaw,
          pitch: state.rot.pitch,
          xw: state.rot.xw,
          yw: state.rot.yw,
        };
      }}
      onPointerMove={(event) => {
        const svg = event.currentTarget.querySelector("svg[data-tesseract]") as SVGSVGElement | null;
        if (!svg) return;
        const state = MOTION.get(svg);
        if (!state?.drag) return;
        const dx = event.clientX - state.drag.x;
        const dy = event.clientY - state.drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) {
          dragged.current = true;
          state.dragged = true;
        }
        state.rot = {
          ...state.rot,
          yaw: state.drag.yaw + dx * 0.008,
          pitch: Math.max(-1.15, Math.min(1.15, state.drag.pitch + dy * 0.008)),
          xw: state.drag.xw + dy * 0.004,
          yw: state.drag.yw + dx * 0.004,
        };
        state.paint();
      }}
      onPointerUp={(event) => {
        const svg = event.currentTarget.querySelector("svg[data-tesseract]") as SVGSVGElement | null;
        if (!svg) return;
        const state = MOTION.get(svg);
        if (state) {
          state.drag = null;
          state.base = { ...state.rot };
          state.spinStartedAt = performance.now();
        }
        svg.dataset.dragging = "0";
      }}
      onPointerCancel={(event) => {
        const svg = event.currentTarget.querySelector("svg[data-tesseract]") as SVGSVGElement | null;
        if (!svg) return;
        const state = MOTION.get(svg);
        if (state) {
          state.drag = null;
          state.base = { ...state.rot };
          state.spinStartedAt = performance.now();
        }
        svg.dataset.dragging = "0";
      }}
    >
      <svg
        ref={bindSvg}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="h-full w-full"
        style={{ maxWidth: "none", overflow: "visible" }}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="4D tesseract cage around a solid cube of listing photos"
        data-tesseract="1"
        data-xw={INITIAL_ROT.xw.toFixed(4)}
        data-yw={INITIAL_ROT.yw.toFixed(4)}
        suppressHydrationWarning
      >
        <defs>
          <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {initial.cube.map((item) => (
            <clipPath key={`c${item.side}`} id={`${uid}-c${item.side}`}>
              <polygon data-fc={item.side} points={item.points} suppressHydrationWarning />
            </clipPath>
          ))}
        </defs>
        <g data-layer="edges">
          {EDGES.map(([a, b]) => {
            const wEdge = (a ^ b) === 8;
            return (
              <line
                key={`${a}-${b}`}
                data-e={`${a}-${b}`}
                x1={initial.pts[a].x}
                y1={initial.pts[a].y}
                x2={initial.pts[b].x}
                y2={initial.pts[b].y}
                stroke={wEdge ? "rgba(212,175,55,0.55)" : GOLD_BRIGHT}
                strokeWidth={wEdge ? 1.15 : 1.85}
                strokeLinecap="round"
                filter={`url(#${uid}-glow)`}
                suppressHydrationWarning
              />
            );
          })}
        </g>
        <g data-layer="verts">
          {initial.pts.map((p, i) => (
            <circle
              key={i}
              data-v={i}
              cx={p.x}
              cy={p.y}
              r={i & 8 ? 5.2 : 6.4}
              fill={GOLD_BRIGHT}
              stroke={GOLD}
              strokeWidth="1.2"
              suppressHydrationWarning
            />
          ))}
        </g>
        <g data-layer="faces" suppressHydrationWarning>
          {initial.cube.map((item) => {
            /* With exactly three files, front/back, right/left and top/bottom share one: opposite sides are never both visible, so the three shown faces are always distinct. */
            const media =
              faces.length === 3
                ? faces[[0, 1, 0, 1, 2, 2][item.side]]
                : faces[item.side % faces.length];
            return (
              <g
                key={item.side}
                data-f={item.side}
                display={item.front ? "block" : "none"}
                onClick={() => {
                  const svg = document.querySelector("svg[data-tesseract]") as SVGSVGElement | null;
                  const state = svg ? MOTION.get(svg) : undefined;
                  if (dragged.current || state?.dragged) return;
                  onOpenFace(media);
                }}
                style={{ cursor: "pointer" }}
                suppressHydrationWarning
              >
                <polygon data-ft={item.side} points={item.points} fill={FACE_BASE} suppressHydrationWarning />
                {media.kind === "image" ? (
                  <g clipPath={`url(#${uid}-c${item.side})`} suppressHydrationWarning>
                    <image
                      data-fi={item.side}
                      href={media.url}
                      width={1}
                      height={1}
                      preserveAspectRatio="none"
                      transform={`matrix(${item.affine})`}
                      suppressHydrationWarning
                    />
                  </g>
                ) : (
                  <polygon
                    data-fpb={item.side}
                    points={`${item.cx + 14},${item.cy} ${item.cx - 9},${item.cy - 11} ${item.cx - 9},${item.cy + 11}`}
                    fill={GOLD_BRIGHT}
                    suppressHydrationWarning
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
});

export function PropertyGallery3D({
  images,
  videos = [],
}: {
  images: PropertyImage[];
  videos?: PropertyVideo[];
}) {
  const uid = useId().replace(/:/g, "");
  const [autoRotate, setAutoRotate] = useState(true);
  const autoRotateRef = useRef(true);
  const [activeFace, setActiveFace] = useState<MediaFace | null>(null);
  const faces = useMemo(() => buildFaces(images, videos), [images, videos]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && !activeFace) {
        e.preventDefault();
        const next = !autoRotateRef.current;
        autoRotateRef.current = next;
        setAutoRotate(next);
        setTesseractPaused(!next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeFace]);

  if (faces.length === 0) return null;

  return (
    <div className="mb-24 w-full sm:mb-0">
      <div
        className="relative w-full rounded-[var(--radius-xl)] bg-[radial-gradient(ellipse_at_center,_#163154_0%,_#07111f_62%,_#050d18_100%)] shadow-[0_0_48px_rgba(212,175,55,0.18)]"
        style={{ height: "clamp(28rem, 92vw, 46rem)" }}
      >
        <TesseractCanvas uid={uid} faces={faces} onOpenFace={setActiveFace} />
        <button
          type="button"
          className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 p-2 text-white"
          onClick={() => {
            const next = !autoRotateRef.current;
            autoRotateRef.current = next;
            setAutoRotate(next);
            setTesseractPaused(!next);
          }}
          aria-label={autoRotate ? "Pause" : "Play"}
        >
          {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <p className="absolute bottom-3 left-3 z-10 max-w-[75%] rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          4D cage · solid photo cube · click a face · {faces.length} files
        </p>
      </div>
      {activeFace ? (
        <LightboxModal
          face={activeFace}
          allFaces={faces}
          onClose={() => {
            setActiveFace(null);
            autoRotateRef.current = true;
            setAutoRotate(true);
            setTesseractPaused(false);
          }}
          onNavigate={setActiveFace}
        />
      ) : null}
    </div>
  );
}
