import { DebugPortal } from "./debug-portal";

import "./debug.css";

export default function Home() {
  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="debug-page flex min-h-full flex-1 flex-col">
        <main className="relative flex flex-1 items-center justify-center px-6 py-24">
          <div className="debug-glass max-w-md rounded-2xl p-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Debug portal</p>
            <h1 className="mt-3 text-xl font-semibold text-white">Development only</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              The crypto debug portal is disabled outside of development mode.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="debug-page flex min-h-full flex-1 flex-col">
      <DebugPortal />
    </div>
  );
}
