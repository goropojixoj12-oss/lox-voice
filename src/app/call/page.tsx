"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type State = "idle" | "requesting" | "ready" | "error";

/**
 * Instant video call landing page.
 *
 * Public URL is opened from a listing (English / Khmer button) in a new tab.
 * The browser asks for camera + microphone once per origin; after that the same
 * visitor joins without prompts. Media itself is peer-to-peer (WebRTC); this
 * page owns the local stream and the connection state.
 */
export default function CallPage() {
  const params = useSearchParams();
  const lang = params.get("lang") === "km" ? "km" : "en";
  const listing = params.get("listing");
  const room = params.get("r");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setState("idle");
    setSeconds(0);
  }, []);

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    if (state !== "ready") return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [state]);

  async function start() {
    setState("requesting");
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setState("ready");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setState("error");
      setError(
        name === "NotAllowedError"
          ? "Браузер не дал доступ к камере. Разрешите камеру и микрофон в настройках сайта и нажмите ещё раз."
          : name === "NotFoundError"
            ? "Камера или микрофон не найдены. Можно продолжить без видео — напишите нам."
            : "Не удалось включить камеру. Попробуйте ещё раз.",
      );
    }
  }

  function toggleMute() {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  }

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-3xl flex-col gap-4 px-4 py-8">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
            {lang === "km" ? "ការហៅវីដេអូ" : "Video call with SEAPS"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {lang === "km"
              ? "ភ្នាក់ងាររបស់យើងនឹងឆ្លើយតបក្នុងពេលឆាប់ៗ។"
              : "A SEAPS representative picks up here. No app, no account — the camera is the only permission."}
          </p>
        </div>
        {room ? (
          <span className="rounded-full bg-[var(--color-mist)] px-3 py-1 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
            room {room.slice(0, 8)}
          </span>
        ) : null}
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        {state !== "ready" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center">
            {state === "idle" ? (
              <>
                <p className="text-sm text-white/90">
                  {lang === "km"
                    ? "ចុចដើម្បីចាប់ផ្តើម — យើងនឹងហៅទៅការិយាល័យ"
                    : "Tap start — we ring the desk and connect you."}
                </p>
                <button
                  type="button"
                  onClick={() => void start()}
                  className="seaps-btn-gold rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold"
                >
                  {lang === "km" ? "ចាប់ផ្តើមហៅ" : "Start video call"}
                </button>
              </>
            ) : null}
            {state === "requesting" ? (
              <p className="text-sm text-white/90">Включаем камеру…</p>
            ) : null}
            {state === "error" ? (
              <>
                <p className="max-w-md text-sm text-white/90">{error}</p>
                <button
                  type="button"
                  onClick={() => void start()}
                  className="rounded-[var(--radius-md)] bg-white/15 px-5 py-2 text-sm text-white"
                >
                  Попробовать снова
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {state === "ready" ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-green-600/15 px-3 py-1 text-xs font-semibold text-green-600">
            камера включена · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={toggleMute}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-xs"
          >
            {muted ? "Включить микрофон" : "Выключить микрофон"}
          </button>
          <button
            type="button"
            onClick={stop}
            className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/60 px-3 py-1.5 text-xs text-[var(--color-danger)]"
          >
            Завершить
          </button>
        </div>
      ) : null}

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-muted)]">
        <p className="font-semibold text-[var(--color-text)]">Никто не отвечает?</p>
        <p className="mt-1 leading-relaxed">
          Оставьте заявку — перезвоним в течение 15 минут в рабочее время, или выберите время
          сами.{" "}
          {listing ? (
            <Link href={`/property/${listing}`} className="underline">
              Вернуться к объекту
            </Link>
          ) : null}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/contact?intent=video-call${listing ? `&listing=${encodeURIComponent(listing)}` : ""}`}
            className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white"
          >
            Оставить заявку
          </Link>
          <Link
            href={listing ? `/property/${listing}` : "/contact"}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-xs"
          >
            Выбрать время в календаре
          </Link>
        </div>
      </div>
    </main>
  );
}