"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { X, ZoomIn, ZoomOut, Download, Pause, Play, ChevronLeft, ChevronRight } from "lucide-react";
import type { PropertyImage, PropertyVideo } from "@/lib/types";

type MediaFace = {
  url: string;
  kind: "image" | "video";
  label: string;
  index: number;
};

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

function ImageTexture({ url }: { url: string }) {
  const texture = useLoader(THREE.TextureLoader, url);
  texture.colorSpace = THREE.SRGBColorSpace;
  return <meshStandardMaterial map={texture} />;
}

function CubeFace({
  position,
  rotation,
  face,
  onFaceClick,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  face: MediaFace;
  onFaceClick: (face: MediaFace) => void;
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onFaceClick(face);
      }}
    >
      <planeGeometry args={[1.95, 1.95]} />
      <Suspense fallback={<meshStandardMaterial color="#1a2744" />}>
        {face.kind === "image" ? (
          <ImageTexture url={face.url} />
        ) : (
          <meshStandardMaterial color="#0d2137" />
        )}
      </Suspense>
    </mesh>
  );
}

function RotatingCube({
  faces,
  page,
  autoRotate,
  onFaceClick,
}: {
  faces: MediaFace[];
  page: number;
  autoRotate: boolean;
  onFaceClick: (face: MediaFace) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
      groupRef.current.rotation.x += delta * 0.08;
    }
  });

  const faceConfigs: {
    position: [number, number, number];
    rotation: [number, number, number];
  }[] = useMemo(
    () => [
      { position: [0, 0, 1], rotation: [0, 0, 0] },
      { position: [0, 0, -1], rotation: [0, Math.PI, 0] },
      { position: [1, 0, 0], rotation: [0, Math.PI / 2, 0] },
      { position: [-1, 0, 0], rotation: [0, -Math.PI / 2, 0] },
      { position: [0, 1, 0], rotation: [-Math.PI / 2, 0, 0] },
      { position: [0, -1, 0], rotation: [Math.PI / 2, 0, 0] },
    ],
    [],
  );

  const start = page * 6;
  const visibleFaces = faces.slice(start, start + 6);

  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#0B1C33" transparent opacity={0.95} />
      </mesh>
      {faceConfigs.map((config, i) => {
        const face = visibleFaces[i % visibleFaces.length];
        if (!face) return null;
        return (
          <CubeFace
            key={`${page}-${i}`}
            position={config.position}
            rotation={config.rotation}
            face={face}
            onFaceClick={onFaceClick}
          />
        );
      })}
    </group>
  );
}

function SceneSetup() {
  const { camera } = useThree();
  useMemo(() => {
    camera.position.set(3, 2, 3);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
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

      {hasPrev && (
        <button
          type="button"
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); setZoom(1); onNavigate(allFaces[currentIdx - 1]); }}
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); setZoom(1); onNavigate(allFaces[currentIdx + 1]); }}
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      <div
        className="max-h-[85vh] max-w-[90vw] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
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

  const faces = useMemo(() => buildFaces(images, videos), [images, videos]);

  const totalPages = Math.max(1, Math.ceil(faces.length / 6));

  useEffect(() => {
    if (!autoRotate || faces.length <= 6) return;
    const interval = setInterval(() => {
      setCubePage((p) => (p + 1) % totalPages);
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRotate, faces.length, totalPages]);

  if (faces.length === 0) return null;

  return (
    <div className="relative">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-b from-[#0B1C33] to-[#162D50]">
        <Canvas gl={{ antialias: true, alpha: true }}>
          <SceneSetup />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <pointLight position={[-3, 3, -3]} intensity={0.5} color="#D4AF37" />
          <RotatingCube
            faces={faces}
            page={cubePage}
            autoRotate={autoRotate}
            onFaceClick={(face) => setActiveFace(face)}
          />
          <OrbitControls enableZoom enablePan={false} dampingFactor={0.1} />
        </Canvas>

        <button
          type="button"
          className="absolute bottom-3 right-3 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/70"
          onClick={() => setAutoRotate((v) => !v)}
          aria-label={autoRotate ? "Pause rotation" : "Resume rotation"}
        >
          {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
          {faces.length} media · Page {cubePage + 1}/{totalPages} · Click face / Drag to rotate
        </div>

        {totalPages > 1 && (
          <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCubePage(i)}
                className={`h-2 w-2 rounded-full transition ${
                  i === cubePage ? "bg-[#D4AF37] scale-125" : "bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {faces.map((face, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveFace(face)}
            className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2 transition hover:opacity-100 ${
              Math.floor(i / 6) === cubePage
                ? "border-[#D4AF37]/60 opacity-100"
                : "border-transparent opacity-60"
            }`}
          >
            {face.kind === "video" ? (
              <div className="flex h-full w-full items-center justify-center bg-[#0B1C33] text-xs text-white">
                <Play className="mr-1 h-3 w-3" /> Video {i - images.length + 1}
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={face.url}
                alt={face.label}
                className="h-full w-full object-cover"
              />
            )}
          </button>
        ))}
      </div>

      {activeFace && (
        <LightboxModal
          face={activeFace}
          allFaces={faces}
          onClose={() => setActiveFace(null)}
          onNavigate={(f) => setActiveFace(f)}
        />
      )}
    </div>
  );
}
