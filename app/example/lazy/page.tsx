import Link from "next/link";

import { LazyDemo } from "./lazy-sections";

export default function LazyDemoPage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-zinc-950">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-zinc-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-400/90">
              LazyLoader
            </p>
            <p className="text-xs text-zinc-600">
              Scroll to load on viewport entry
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

      <main className="mx-auto w-full max-w-4xl flex-1 px-6">
        <LazyDemo />
      </main>
    </div>
  );
}
