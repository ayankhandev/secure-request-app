"use client";

import Link from "next/link";
import { useRef, useState, useCallback, useEffect } from "react";

type Status = "idle" | "streaming" | "loading" | "success" | "error";

interface IdentifiedItem {
  item: string;
  material: string;
}

interface AnalysisResult {
  items: IdentifiedItem[];
}

async function analyzeImage(blob: Blob): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("image", blob, "capture.jpg");

  const res = await fetch("/api/recognize", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Recognition failed");
  }

  return data;
}

function StatusBanner({ status, message }: { status: Status; message: string }) {
  if (!message) return null;
  const styles =
    status === "success"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
      : status === "error"
        ? "border-red-500/25 bg-red-500/10 text-red-300"
        : "border-white/10 bg-white/5 text-zinc-300";
  return (
    <p className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles}`} role="status">
      {message}
    </p>
  );
}

function PanelLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">{children}</label>
      {hint ? <span className="text-[11px] text-zinc-600">{hint}</span> : null}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function OrnamentScanner() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<IdentifiedItem[]>([]);

  const [preview, setPreview] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [canStream, setCanStream] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  const handleAnalysis = useCallback(async (blob: Blob, previewUrl: string) => {
    setPreview(previewUrl);
    setStatus("loading");
    setMessage("");

    try {
      const data = await analyzeImage(blob);
      setItems(data.items);
      setStatus("success");
      setMessage(data.items.length > 0 ? "Ornament identified successfully." : "No jewelry detected in the image.");
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not reach the recognition API.");
    }
  }, []);

  const startCamera = useCallback(async () => {
    setMessage("");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      setStatus("streaming");
    } catch (err: unknown) {
      setStatus("error");
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setMessage("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setMessage("No camera found on this device.");
      } else {
        setMessage("Could not access camera. Please check permissions.");
      }
    }
  }, []);

  useEffect(() => {
    setCanStream(!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
  }, []);

  useEffect(() => {
    if (status === "streaming" && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [status, stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopStream();

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setStatus("error");
          setMessage("Failed to capture image.");
          return;
        }
        handleAnalysis(blob, URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.92,
    );
  }, [stopStream, handleAnalysis]);

  const handleFileCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    await handleAnalysis(file, url);
  }, [handleAnalysis]);

  const openFileCamera = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, []);

  const handleRetake = useCallback(() => {
    setPreview(null);
    setItems([]);
    setStatus("idle");
    setMessage("");
  }, []);

  const openCamera = canStream ? startCamera : openFileCamera;

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div aria-hidden className="debug-grid pointer-events-none absolute inset-0" />

      <header className="relative z-10 border-b border-white/5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-400/90">
              Ornament Identifier
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Snap &amp; Identify
            </h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-500">
              Take a photo of any ornament or jewelry to identify it.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-white/20 hover:text-white"
            >
              &larr; Home
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileCapture}
          className="hidden"
        />

        <div className="debug-glass overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-1 border-b border-white/5 p-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex items-center gap-3">
              <CameraIcon />
              <span className="text-sm font-medium text-zinc-300">
                {status === "streaming"
                  ? "Camera active"
                  : status === "loading"
                    ? "Analyzing…"
                    : preview
                      ? "Captured image"
                      : "Camera"}
              </span>
              {status === "streaming" && (
                <span className="h-2 w-2 rounded-full bg-red-500 debug-pulse" />
              )}
            </div>
            <span className="hidden px-2 text-xs text-zinc-600 sm:inline">
              {status === "streaming"
                ? "Position the ornament and tap capture"
                : status === "loading"
                  ? "Analyzing image…"
                  : "Launch camera to capture an ornament"}
            </span>
          </div>

          <section className="debug-fade-in grid gap-6 p-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <PanelLabel hint={canStream ? "live camera feed" : "device camera"}>
                Camera view
              </PanelLabel>

              <div className="relative min-h-[320px] overflow-hidden rounded-xl border border-white/10 bg-zinc-950/60">
                {status === "streaming" ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : preview ? (
                  <>
                    <img
                      src={preview}
                      alt="Captured ornament"
                      className="h-full w-full object-cover"
                    />
                    {status === "loading" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-emerald-400 debug-spinner" />
                        <span className="mt-3 text-xs text-zinc-300">Identifying ornament…</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    onClick={openCamera}
                    className="flex h-full min-h-[320px] cursor-pointer flex-col items-center justify-center gap-4 transition hover:bg-emerald-500/5"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      <CameraIcon large />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-zinc-400">Tap to open camera</p>
                      <p className="mt-1 text-[11px] text-zinc-600">
                        {canStream ? "Starts a live camera feed" : "Opens your device camera app"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {status === "idle" || status === "error" ? (
                  <button
                    type="button"
                    onClick={openCamera}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
                  >
                    <CameraIcon light />
                    Open Camera
                  </button>
                ) : status === "streaming" ? (
                  <>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
                    >
                      <CaptureIcon />
                      Capture
                    </button>
                    <button
                      type="button"
                      onClick={() => { stopStream(); setStatus("idle"); }}
                      className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-medium text-zinc-300 transition hover:bg-white/5"
                    >
                      Cancel
                    </button>
                  </>
                ) : status === "success" || status === "loading" ? (
                  <button
                    type="button"
                    onClick={handleRetake}
                    disabled={status === "loading"}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    <CameraIcon light />
                    Retake
                  </button>
                ) : null}
              </div>

              <StatusBanner status={status} message={message} />
            </div>

            <div className="flex flex-col gap-3">
              <PanelLabel hint="AI-powered analysis">Identification result</PanelLabel>
              <div
                className={`debug-textarea min-h-[320px] flex-1 resize-none rounded-xl border px-4 py-4 ${
                  status === "success"
                    ? "border-amber-500/15 bg-amber-950/15 text-amber-50/90"
                    : "border-white/10 bg-zinc-950/60 text-zinc-100"
                }`}
              >
                {items.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {items.map((it, i) => (
                      <div key={i} className="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold capitalize text-white">{it.item}</span>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${
                            materialColor(it.material)
                          }`}>
                            {it.material}
                          </span>
                        </div>
                      </div>
                    ))}

                  </div>
                ) : (
                  <span className="text-zinc-600">
                    {status === "loading"
                      ? "Analyzing the captured image…"
                      : status === "success"
                        ? "No jewelry or ornaments detected."
                        : "Capture an ornament to see the identification result here."}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <IconButton
                  label="Copy result"
                  disabled={items.length === 0}
                  onClick={async () => {
                    try {
                      const text = items.map((it) => `${it.item} — ${it.material}`).join("\n");
                      await navigator.clipboard.writeText(text);
                      setMessage("Result copied to clipboard.");
                      setStatus("success");
                      setTimeout(() => {
                        if (items.length > 0) setMessage("Ornament identified successfully.");
                      }, 2000);
                    } catch {
                      setMessage("Could not copy to clipboard.");
                    }
                  }}
                >
                  <CopyIcon />
                  Copy
                </IconButton>
              </div>
            </div>
          </section>
        </div>

        <p className="mt-6 text-center text-[11px] text-zinc-600">
          Images are analyzed securely. No images are stored on the server.
        </p>
      </main>
    </div>
  );
}

function CameraIcon({ large, light }: { large?: boolean; light?: boolean }) {
  const cls = large
    ? "h-8 w-8 text-zinc-400"
    : light
      ? "h-4 w-4 text-emerald-950"
      : "h-4 w-4 text-zinc-400";
  return (
    <svg aria-hidden className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
      />
    </svg>
  );
}

function CaptureIcon() {
  return (
    <svg aria-hidden className="h-4 w-4 text-emerald-950" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function materialColor(material: string): string {
  const m = material.toLowerCase();
  if (m.includes("gold")) return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (m.includes("silver") || m.includes("platinum")) return "border-slate-400/30 bg-slate-400/10 text-slate-300";
  if (m.includes("diamond")) return "border-cyan-400/30 bg-cyan-400/10 text-cyan-300";
  if (m.includes("pearl")) return "border-white/20 bg-white/10 text-white/80";
  if (m.includes("ruby") || m.includes("rose")) return "border-rose-400/30 bg-rose-400/10 text-rose-300";
  if (m.includes("emerald")) return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  if (m.includes("sapphire")) return "border-blue-400/30 bg-blue-400/10 text-blue-300";
  if (m.includes("gem")) return "border-violet-400/30 bg-violet-400/10 text-violet-300";
  if (m.includes("oxidiz")) return "border-zinc-500/30 bg-zinc-500/10 text-zinc-400";
  if (m.includes("artificial") || m.includes("fashion")) return "border-pink-400/30 bg-pink-400/10 text-pink-300";
  if (m.includes("copper") || m.includes("bronze") || m.includes("brass")) return "border-orange-400/30 bg-orange-400/10 text-orange-300";
  return "border-white/15 bg-white/5 text-zinc-300";
}
