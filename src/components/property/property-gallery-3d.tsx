"use client";

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type MutableRefObject } from "react";
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

type FaceGeom = {
  ids: number[];
  cube: number;
  wCell: boolean;
};

type FaceModel = {
  faceIndex: number;
  geom: FaceGeom;
  quad: Pt[];
  points: string;
  depth: number;
  area: number;
  affine: string;
};

const VIEW = 1000;
/** 4D eye distance — hypercube.tbrun.dev default. */
const D4 = 3;
/** 3D camera distance; keep above projected |z| so the outer cell stays cubic. */
const D3 = 7.5;
const GOLD = "#D4AF37";
const GOLD_BRIGHT = "#F0D78C";
const CUBE_TINTS = [
  "rgba(212,175,55,0.28)",
  "rgba(240,215,140,0.24)",
  "rgba(184,134,11,0.26)",
  "rgba(255,215,0,0.18)",
  "rgba(205,173,106,0.26)",
  "rgba(218,165,32,0.22)",
  "rgba(153,122,48,0.26)",
  "rgba(255,223,128,0.18)",
] as const;

/** Nested cubes at rest; XW/YW auto-rotate grows the inner cell outward. */
const INITIAL_ROT: Rot = {
  xw: 0.08,
  yw: 0.1,
  zw: 0,
  xy: 0,
  yaw: 0.55,
  pitch: 0.38,
};
/** rad/s — XW/YW so the inner cell grows outward; yaw keeps the tumble readable. */
const XW_SPEED = 0.55;
const YW_SPEED = 0.4;
const YAW_SPEED = 0.5;

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

function tesseractSquares(): FaceGeom[] {
  const faces: FaceGeom[] = [];
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
          faces.push({
            ids: [ids[0], ids[1], ids[3], ids[2]],
            cube: fixed[0] * 2 + s0,
            wCell: a !== 3 && b !== 3,
          });
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

function facing(q: Pt[]): number {
  return (q[1].x - q[0].x) * (q[3].y - q[0].y) - (q[1].y - q[0].y) * (q[3].x - q[0].x);
}

function affineMatrix(q: Pt[]): string {
  const a = q[3].x - q[0].x;
  const c = q[3].y - q[0].y;
  const b = q[1].x - q[0].x;
  const d = q[1].y - q[0].y;
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

function buildModel(rot: Rot): { pts: Pt[]; faceModels: FaceModel[] } {
  const raw = projectRaw(rot);
  const pts = raw.map((p) => ({
    x: VIEW / 2 + (p.x - CAMERA_FIT.ox) * CAMERA_FIT.scale,
    y: VIEW / 2 - (p.y - CAMERA_FIT.oy) * CAMERA_FIT.scale,
    z: p.z,
  }));
  const faceModels = SQUARES.map((geom, faceIndex) => {
    const quad = geom.ids.map((id) => pts[id]);
    return {
      faceIndex,
      geom,
      quad,
      points: quad.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" "),
      depth: (quad[0].z + quad[1].z + quad[2].z + quad[3].z) / 4,
      area: facing(quad),
      affine: affineMatrix(quad),
    };
  });
  return { pts, faceModels };
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
  const groups = SQUARES.map((_, i) => facesLayer.querySelector(`g[data-f="${i}"]`) as SVGGElement | null);
  const tints = SQUARES.map((_, i) => facesLayer.querySelector(`polygon[data-ft="${i}"]`) as SVGPolygonElement | null);
  const clips = SQUARES.map((_, i) => svg.querySelector(`polygon[data-fc="${i}"]`) as SVGPolygonElement | null);
  const images = SQUARES.map((_, i) => facesLayer.querySelector(`image[data-fi="${i}"]`) as SVGImageElement | null);
  const plays = SQUARES.map((_, i) => facesLayer.querySelector(`polygon[data-fpb="${i}"]`) as SVGPolygonElement | null);
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
    const { pts, faceModels } = buildModel(state.rot);
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
    const order = faceModels
      .map((_, i) => i)
      .sort((a, b) => faceModels[a].depth - faceModels[b].depth);
    for (const idx of order) {
      const group = groups[idx];
      const item = faceModels[idx];
      if (!group) continue;
      facesLayer.appendChild(group);
      const back = item.area < 0;
      const tint = tints[idx];
      if (tint) {
        tint.setAttribute("points", item.points);
        tint.setAttribute("fill-opacity", back ? "0.14" : "0.32");
      }
      const clip = clips[idx];
      if (clip) clip.setAttribute("points", item.points);
      const image = images[idx];
      if (image) {
        image.setAttribute("transform", `matrix(${item.affine})`);
        const photoOpacity = back
          ? item.geom.wCell
            ? 0.16
            : 0.08
          : item.geom.wCell
            ? 0.52
            : 0.32;
        image.setAttribute("opacity", String(photoOpacity));
      }
      const play = plays[idx];
      if (play) {
        const cx = (item.quad[0].x + item.quad[2].x) / 2;
        const cy = (item.quad[0].y + item.quad[2].y) / 2;
        play.setAttribute("points", `${cx + 14},${cy} ${cx - 9},${cy - 11} ${cx - 9},${cy + 11}`);
        play.setAttribute("display", back ? "none" : "block");
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
  autoRotate?: boolean;
  autoRotateRef?: MutableRefObject<boolean>;
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
          yw: state.drag.yw + dx * 0.004,
          xw: state.drag.xw + dy * 0.004,
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
        aria-label="4D tesseract listing gallery — nested cubes, 24 faces"
        data-tesseract="1"
        data-xw={INITIAL_ROT.xw.toFixed(4)}
        data-yw={INITIAL_ROT.yw.toFixed(4)}
      >
        <defs>
          <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {initial.faceModels.map((item) => (
            <clipPath key={`c${item.faceIndex}`} id={`${uid}-c${item.faceIndex}`}>
              <polygon data-fc={item.faceIndex} points={item.points} />
            </clipPath>
          ))}
        </defs>
        <g data-layer="faces">
          {initial.faceModels.map((item) => {
            const back = item.area < 0;
            const media = faces[item.faceIndex % faces.length];
            const tint = CUBE_TINTS[item.geom.cube] ?? CUBE_TINTS[0];
            const photoOpacity = back
              ? item.geom.wCell
                ? 0.16
                : 0.08
              : item.geom.wCell
                ? 0.52
                : 0.32;
            const cx = (item.quad[0].x + item.quad[2].x) / 2;
            const cy = (item.quad[0].y + item.quad[2].y) / 2;
            return (
              <g
                key={item.faceIndex}
                data-f={item.faceIndex}
                onClick={() => {
                  const svg = document.querySelector("svg[data-tesseract]") as SVGSVGElement | null;
                  const state = svg ? MOTION.get(svg) : undefined;
                  if (dragged.current || state?.dragged) return;
                  onOpenFace(media);
                }}
                style={{ cursor: "pointer" }}
              >
                <polygon data-ft={item.faceIndex} points={item.points} fill={tint} fillOpacity={back ? 0.14 : 0.32} />
                {media.kind === "image" ? (
                  <g clipPath={`url(#${uid}-c${item.faceIndex})`}>
                    <image
                      data-fi={item.faceIndex}
                      href={media.url}
                      width={1}
                      height={1}
                      preserveAspectRatio="none"
                      transform={`matrix(${item.affine})`}
                      opacity={photoOpacity}
                    />
                  </g>
                ) : (
                  <polygon
                    data-fpb={item.faceIndex}
                    points={`${cx + 14},${cy} ${cx - 9},${cy - 11} ${cx - 9},${cy + 11}`}
                    fill={GOLD_BRIGHT}
                    display={back ? "none" : "block"}
                  />
                )}
              </g>
            );
          })}
        </g>
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
                strokeWidth={wEdge ? 2.2 : 3.6}
                strokeLinecap="round"
                filter={`url(#${uid}-glow)`}
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
            />
          ))}
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
        <TesseractCanvas
          uid={uid}
          faces={faces}
          onOpenFace={setActiveFace}
          autoRotate={autoRotate}
          autoRotateRef={autoRotateRef}
        />
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
          4D tesseract · XW/YW inner cube grows outward · 24 faces · {faces.length} files
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
