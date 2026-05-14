import Image from "next/image";

import { LoginForm } from "./login-form";

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-zinc-950">
      <Image
        alt=""
        className="object-cover opacity-90"
        fill
        priority
        sizes="100vw"
        src="/background.png"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/70 to-zinc-950/90"
      />
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/40 p-8 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-xl sm:p-10">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
              Authentication
            </p>
            <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              secure enc-dec app
            </h1>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-zinc-400">
              Sign in with your username and password to continue.
            </p>
          </div>
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
