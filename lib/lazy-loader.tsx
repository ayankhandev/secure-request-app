"use client";

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const HAS_IDLE_CALLBACK =
  typeof window !== "undefined" && "requestIdleCallback" in window;

type LoadState<T> =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "loaded"; data: T }
  | { phase: "error"; error: Error };

interface FetchState<T> {
  key: number;
  phase: "idle" | "loading" | "loaded" | "error";
  data: T | null;
  error: Error | null;
}

export interface LazyLoaderProps<T> {
  fetcher: () => Promise<T>;
  children: (data: T) => ReactNode;
  fallback?: ReactNode;
  errorFallback?: (error: Error, retry: () => void) => ReactNode;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
  className?: string;
}

const emptySubscribe = () => () => {};

export function LazyLoader<T>({
  fetcher,
  children,
  fallback,
  errorFallback,
  rootMargin = "200px 0px",
  threshold = 0,
  className,
}: LazyLoaderProps<T>) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const isHydrating = useSyncExternalStore(
    emptySubscribe,
    () => false,
    () => true,
  );

  const [state, setState] = useState<FetchState<T>>({
    key: 0,
    phase: "idle",
    data: null,
    error: null,
  });

  useEffect(() => {
    if (state.phase !== "idle") return;
    const node = sentinelRef.current;
    if (!node) return;

    let ricHandle: number | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          const trigger = () =>
            setState((s) => ({ ...s, key: s.key + 1, phase: "loading" }));
          if (HAS_IDLE_CALLBACK) {
            ricHandle = requestIdleCallback(trigger, { timeout: 500 });
          } else {
            trigger();
          }
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (ricHandle !== undefined) cancelIdleCallback(ricHandle);
    };
  }, [state.phase, rootMargin, threshold]);

  useEffect(() => {
    if (state.phase !== "loading") return;

    let cancelled = false;

    fetcher()
      .then((data) => {
        if (!cancelled) {
          setState((s) => ({ ...s, phase: "loaded", data, error: null }));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            phase: "error",
            error: err instanceof Error ? err : new Error(String(err)),
            data: null,
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [state.phase, state.key, fetcher]);

  const retry = () =>
    setState((s) => ({ ...s, key: s.key + 1, phase: "loading" }));

  if (isHydrating) {
    return (
      <div ref={sentinelRef} className={className}>
        {fallback ?? <DefaultSkeleton />}
      </div>
    );
  }

  switch (state.phase) {
    case "idle":
      return (
        <div ref={sentinelRef} className={className}>
          {fallback ?? <DefaultSkeleton />}
        </div>
      );

    case "loading":
      return (
        <div className={className}>
          {fallback ?? <DefaultSkeleton />}
        </div>
      );

    case "loaded":
      return (
        <div className={className}>
          {children(state.data as T)}
        </div>
      );

    case "error":
      if (errorFallback) {
        return (
          <div className={className}>
            {errorFallback(state.error as Error, retry)}
          </div>
        );
      }
      return (
        <div className={className}>
          <DefaultError error={state.error as Error} onRetry={retry} />
        </div>
      );
  }
}

function DefaultSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3 rounded-xl border border-white/5 bg-zinc-900/50 p-6">
      <div className="h-4 w-2/3 rounded bg-zinc-700/40" />
      <div className="h-4 w-full rounded bg-zinc-700/30" />
      <div className="h-4 w-5/6 rounded bg-zinc-700/25" />
      <div className="mt-2 h-3 w-1/3 rounded bg-zinc-700/20" />
    </div>
  );
}

function DefaultError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
      <p className="text-sm text-red-400">
        {error.message || "Failed to load content."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
      >
        Retry
      </button>
    </div>
  );
}

export type { LoadState };
