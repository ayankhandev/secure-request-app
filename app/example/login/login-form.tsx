"use client";

import { FormEvent, useState } from "react";

import {
  decryptResponse,
  encryptRequest,
  type EncryptedResponse,
} from "@/lib/crypto";

type Status = "idle" | "loading" | "success" | "error";

export function LoginForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const publicKey = process.env.NEXT_PUBLIC_RSA_PUBLIC_KEY;
    if (!publicKey) {
      setStatus("error");
      setMessage("Client misconfiguration: missing public key.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const credentials = {
      username: form.get("username") as string,
      password: form.get("password") as string,
    };

    try {
      const { envelope, sessionKey } = await encryptRequest(
        JSON.stringify(credentials),
        publicKey
      );

      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ envelope }),
      });

      const body = (await response.json()) as Record<string, unknown>;

      // Responses that arrive before the session key is established (e.g. 400
      // for a malformed envelope) are plain JSON and have no `payload` field.
      if (typeof body.payload !== "string") {
        setStatus("error");
        setMessage(typeof body.error === "string" ? body.error : "Request failed.");
        return;
      }

      const decrypted = await decryptResponse(body as unknown as EncryptedResponse, sessionKey);
      const data = JSON.parse(decrypted) as { message?: string; error?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Authentication failed.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "Login successful.");
    } catch {
      setStatus("error");
      setMessage("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-200" htmlFor="username">
          Username
        </label>
        <input
          autoComplete="username"
          className="h-11 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none ring-emerald-400/40 transition placeholder:text-zinc-500 focus:border-emerald-400/50 focus:ring-2 disabled:opacity-50"
          disabled={status === "loading"}
          id="username"
          name="username"
          placeholder="Enter your username"
          required
          spellCheck={false}
          type="text"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-200" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="h-11 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none ring-emerald-400/40 transition placeholder:text-zinc-500 focus:border-emerald-400/50 focus:ring-2 disabled:opacity-50"
          disabled={status === "loading"}
          id="password"
          name="password"
          placeholder="Enter your password"
          required
          type="password"
        />
      </div>

      {message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            status === "success"
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-red-500/10 text-red-400"
          }`}
          role="alert"
        >
          {message}
        </p>
      )}

      <button
        className="mt-1 flex h-11 w-full items-center justify-center rounded-lg bg-emerald-500 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={status === "loading"}
        type="submit"
      >
        {status === "loading" ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
