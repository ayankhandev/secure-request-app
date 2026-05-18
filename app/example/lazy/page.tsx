import Link from "next/link";

import { LazyDemo } from "./lazy-sections";

export default function LazyDemoPage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-zinc-950">
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-400/90">
              Component demo
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              LazyLoader
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Scroll down — each section loads on viewport entry via Intersection Observer.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            &larr; Home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <div className="mb-8 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-5 py-4">
          <h2 className="text-sm font-semibold text-emerald-300">How it works</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            <li>
              <span className="font-mono text-xs text-zinc-500">1.</span> A sentinel
              element is observed with{" "}
              <code className="rounded bg-white/5 px-1 py-0.5 text-xs text-zinc-300">
                IntersectionObserver
              </code>
            </li>
            <li>
              <span className="font-mono text-xs text-zinc-500">2.</span> When visible,
              the async <code className="rounded bg-white/5 px-1 py-0.5 text-xs text-zinc-300">fetcher</code>{" "}
              is called via <code className="rounded bg-white/5 px-1 py-0.5 text-xs text-zinc-300">requestIdleCallback</code>
            </li>
            <li>
              <span className="font-mono text-xs text-zinc-500">3.</span> A skeleton is
              shown during loading; the child component renders with the resolved data
            </li>
            <li>
              <span className="font-mono text-xs text-zinc-500">4.</span> Errors render
              a retry UI — observer disconnects after first intersection (configurable)
            </li>
          </ul>
        </div>

        <LazyDemo />

        <div className="mt-12 flex justify-center pb-12">
          <p className="text-xs text-zinc-600">
            You have reached the bottom — all sections were lazy-loaded on scroll.
          </p>
        </div>
      </main>
    </div>
  );
}
