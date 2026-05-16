"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { encryptRequest, type EncryptedEnvelope } from "@/lib/crypto";
import { isValidEnvelope } from "@/lib/envelope";

type Tab = "encrypt" | "decrypt";
type Status = "idle" | "loading" | "success" | "error";

const SAMPLE_PAYLOAD = `{
  "username": "admin",
  "password": "password"
}`;

function parseJsonInput(raw: string): { ok: true; value: unknown } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste or type a JSON payload first." };
  }
  try {
    return { ok: true, value: JSON.parse(trimmed) };
  } catch {
    return { ok: false, error: "Invalid JSON. Check brackets, quotes, and trailing commas." };
  }
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
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

export function DebugPortal() {
  const [tab, setTab] = useState<Tab>("encrypt");
  const [plainInput, setPlainInput] = useState(SAMPLE_PAYLOAD);
  const [cipherInput, setCipherInput] = useState("");
  const [encryptOutput, setEncryptOutput] = useState("");
  const [decryptOutput, setDecryptOutput] = useState("");
  const [encryptStatus, setEncryptStatus] = useState<Status>("idle");
  const [decryptStatus, setDecryptStatus] = useState<Status>("idle");
  const [encryptMessage, setEncryptMessage] = useState("");
  const [decryptMessage, setDecryptMessage] = useState("");
  const [copyHint, setCopyHint] = useState("");

  const hasPublicKey = Boolean(process.env.NEXT_PUBLIC_RSA_PUBLIC_KEY);

  const envelopePreview = useMemo((): EncryptedEnvelope | null => {
    if (!encryptOutput) return null;
    const parsed = parseJsonInput(encryptOutput);
    return parsed.ok && isValidEnvelope(parsed.value) ? parsed.value : null;
  }, [encryptOutput]);

  const switchTab = useCallback((next: Tab) => {
    setTab(next);
    setCopyHint("");
  }, []);

  const handleFormatPlain = useCallback(() => {
    const parsed = parseJsonInput(plainInput);
    if (!parsed.ok) {
      setEncryptStatus("error");
      setEncryptMessage(parsed.error);
      return;
    }
    setPlainInput(formatJson(parsed.value));
    setEncryptStatus("idle");
    setEncryptMessage("");
  }, [plainInput]);

  const handleEncrypt = useCallback(async () => {
    setEncryptStatus("loading");
    setEncryptMessage("");
    setEncryptOutput("");

    const publicKey = process.env.NEXT_PUBLIC_RSA_PUBLIC_KEY;
    if (!publicKey) {
      setEncryptStatus("error");
      setEncryptMessage("Missing NEXT_PUBLIC_RSA_PUBLIC_KEY in the environment.");
      return;
    }

    const parsed = parseJsonInput(plainInput);
    if (!parsed.ok) {
      setEncryptStatus("error");
      setEncryptMessage(parsed.error);
      return;
    }

    try {
      const { envelope } = await encryptRequest(formatJson(parsed.value), publicKey);
      const out = formatJson(envelope);
      setEncryptOutput(out);
      setEncryptStatus("success");
      setEncryptMessage("Payload encrypted. Copy the envelope or send it to Decrypt.");
    } catch {
      setEncryptStatus("error");
      setEncryptMessage("Encryption failed. Check that the public key PEM is valid.");
    }
  }, [plainInput]);

  const handleSendToDecrypt = useCallback(() => {
    if (!encryptOutput) return;
    setCipherInput(encryptOutput);
    switchTab("decrypt");
    setDecryptStatus("idle");
    setDecryptMessage("Envelope loaded from Encrypt. Run decrypt when ready.");
    setDecryptOutput("");
  }, [encryptOutput, switchTab]);

  const handleDecrypt = useCallback(async () => {
    setDecryptStatus("loading");
    setDecryptMessage("");
    setDecryptOutput("");

    const parsed = parseJsonInput(cipherInput);
    if (!parsed.ok) {
      setDecryptStatus("error");
      setDecryptMessage(parsed.error);
      return;
    }

    if (!isValidEnvelope(parsed.value)) {
      setDecryptStatus("error");
      setDecryptMessage("Envelope must include string fields: encryptedKey and payload.");
      return;
    }

    try {
      const response = await fetch("/api/debug/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ envelope: parsed.value as EncryptedEnvelope }),
      });
      const body = (await response.json()) as {
        error?: string;
        formatted?: string;
        plaintext?: string;
      };

      if (!response.ok) {
        setDecryptStatus("error");
        setDecryptMessage(body.error ?? "Decryption failed.");
        return;
      }

      setDecryptOutput(body.formatted ?? body.plaintext ?? "");
      setDecryptStatus("success");
      setDecryptMessage("Payload decrypted successfully.");
    } catch {
      setDecryptStatus("error");
      setDecryptMessage("Could not reach the decrypt API.");
    }
  }, [cipherInput]);

  const handleCopy = useCallback(async (text: string, label: string) => {
    const ok = await copyText(text);
    setCopyHint(ok ? `${label} copied` : `Could not copy ${label.toLowerCase()}`);
    if (ok) {
      window.setTimeout(() => setCopyHint(""), 2000);
    }
  }, []);

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div aria-hidden className="debug-grid pointer-events-none absolute inset-0" />

      <header className="relative z-10 border-b border-white/5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-400/90">
              Secure channel
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Crypto Debug Portal
            </h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-500">
              RSA-OAEP + AES-GCM — encrypt JSON on the client, decrypt with the server private key.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                hasPublicKey
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${hasPublicKey ? "bg-emerald-400" : "bg-amber-400 debug-pulse"}`}
              />
              {hasPublicKey ? "Public key loaded" : "Public key missing"}
            </span>
            <Link
              href="/example/login"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-white/20 hover:text-white"
            >
              ← Login example
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="debug-glass overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-1 border-b border-white/5 p-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex gap-1 rounded-xl bg-zinc-900/80 p-1">
              {(
                [
                  ["encrypt", "Encrypt", "Plain JSON → envelope"],
                  ["decrypt", "Decrypt", "Envelope → plain JSON"],
                ] as const
              ).map(([id, label, sub]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchTab(id)}
                  className={`relative flex min-w-[7.5rem] flex-col rounded-lg px-4 py-2.5 text-left transition ${
                    tab === id
                      ? "debug-tab-active bg-emerald-500/15 text-white"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                  }`}
                >
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-[10px] text-zinc-500">{sub}</span>
                </button>
              ))}
            </div>
            {copyHint ? (
              <span className="px-2 text-xs text-emerald-400/90 debug-fade-in">{copyHint}</span>
            ) : (
              <span className="hidden px-2 text-xs text-zinc-600 sm:inline">Development only</span>
            )}
          </div>

          {tab === "encrypt" ? (
            <section className="debug-fade-in grid gap-6 p-6 lg:grid-cols-2">
              <div className="flex flex-col gap-3">
                <PanelLabel hint="UTF-8 JSON">Plain payload</PanelLabel>
                <textarea
                  className="debug-textarea min-h-[280px] flex-1 resize-y rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-zinc-100"
                  spellCheck={false}
                  value={plainInput}
                  onChange={(e) => setPlainInput(e.target.value)}
                  placeholder='{ "key": "value" }'
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleFormatPlain}
                    className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5"
                  >
                    Format JSON
                  </button>
                  <button
                    type="button"
                    onClick={handleEncrypt}
                    disabled={encryptStatus === "loading"}
                    className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {encryptStatus === "loading" ? "Encrypting…" : "Encrypt"}
                  </button>
                </div>
                <StatusBanner status={encryptStatus} message={encryptMessage} />
              </div>

              <div className="flex flex-col gap-3">
                <PanelLabel hint="encryptedKey + payload">Encrypted envelope</PanelLabel>
                <textarea
                  readOnly
                  className="debug-textarea min-h-[280px] flex-1 resize-y rounded-xl border border-emerald-500/15 bg-emerald-950/20 px-4 py-3 text-emerald-100/90"
                  value={encryptOutput}
                  placeholder="Run encrypt to generate the envelope…"
                />
                <div className="flex flex-wrap gap-2">
                  <IconButton
                    label="Copy envelope"
                    disabled={!encryptOutput}
                    onClick={() => void handleCopy(encryptOutput, "Envelope")}
                  >
                    <CopyIcon />
                    Copy
                  </IconButton>
                  <IconButton
                    label="Send to decrypt tab"
                    disabled={!encryptOutput}
                    onClick={handleSendToDecrypt}
                  >
                    <ArrowIcon />
                    Use in Decrypt
                  </IconButton>
                </div>
                {envelopePreview ? (
                  <p className="text-[11px] text-zinc-600">
                    {envelopePreview.encryptedKey.length} char key wrap · {envelopePreview.payload.length} char
                    sealed payload (base64)
                  </p>
                ) : null}
              </div>
            </section>
          ) : (
            <section className="debug-fade-in grid gap-6 p-6 lg:grid-cols-2">
              <div className="flex flex-col gap-3">
                <PanelLabel hint="from Encrypt tab">Encrypted envelope</PanelLabel>
                <textarea
                  className="debug-textarea min-h-[280px] flex-1 resize-y rounded-xl border border-violet-500/15 bg-violet-950/15 px-4 py-3 text-violet-100/90"
                  spellCheck={false}
                  value={cipherInput}
                  onChange={(e) => setCipherInput(e.target.value)}
                  placeholder='{ "encryptedKey": "...", "payload": "..." }'
                />
                <div className="flex flex-wrap gap-2">
                  <IconButton
                    label="Paste from clipboard"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setCipherInput(text);
                        setDecryptMessage("Pasted from clipboard.");
                        setDecryptStatus("idle");
                      } catch {
                        setDecryptStatus("error");
                        setDecryptMessage("Clipboard access denied.");
                      }
                    }}
                  >
                    <PasteIcon />
                    Paste
                  </IconButton>
                  <button
                    type="button"
                    onClick={handleDecrypt}
                    disabled={decryptStatus === "loading"}
                    className="rounded-lg bg-violet-500 px-5 py-2 text-xs font-semibold text-violet-950 shadow-lg shadow-violet-500/20 transition hover:bg-violet-400 disabled:opacity-50"
                  >
                    {decryptStatus === "loading" ? "Decrypting…" : "Decrypt"}
                  </button>
                </div>
                <StatusBanner status={decryptStatus} message={decryptMessage} />
              </div>

              <div className="flex flex-col gap-3">
                <PanelLabel hint="UTF-8 JSON">Plain payload</PanelLabel>
                <textarea
                  readOnly
                  className="debug-textarea min-h-[280px] flex-1 resize-y rounded-xl border border-amber-500/15 bg-amber-950/15 px-4 py-3 text-amber-50/90"
                  value={decryptOutput}
                  placeholder="Decrypted JSON appears here…"
                />
                <IconButton
                  label="Copy plaintext"
                  disabled={!decryptOutput}
                  onClick={() => void handleCopy(decryptOutput, "Plaintext")}
                >
                  <CopyIcon />
                  Copy
                </IconButton>
              </div>
            </section>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-zinc-600">
          Each encrypt generates a fresh AES session key. Decrypt uses{" "}
          <code className="rounded bg-white/5 px-1 py-0.5 text-zinc-500">RSA_PRIVATE_KEY</code> on the server.
        </p>
      </main>
    </div>
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

function ArrowIcon() {
  return (
    <svg aria-hidden className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

function PasteIcon() {
  return (
    <svg aria-hidden className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
