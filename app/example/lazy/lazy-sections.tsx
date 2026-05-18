"use client";

import { useCallback } from "react";

import { LazyLoader } from "@/lib/lazy-loader";

type AnalyticsItem = {
  label: string;
  value: string;
  change: string;
};

type UserItem = {
  name: string;
  email: string;
  role: string;
  status: string;
};

type ActivityItem = {
  action: string;
  actor: string;
  timestamp: string;
};

type MetricItem = {
  label: string;
  value: string;
  status: string;
};

type ApiData<T> = {
  section: string;
  title: string;
  items: T[];
  fetchedAt: string;
};

function fetchData<T>(
  section: string,
  delay = 1500,
): () => Promise<ApiData<T>> {
  return () =>
    fetch(`/api/lazy-data?section=${section}&delay=${delay}`).then((r) => {
      if (!r.ok) throw new Error(`Failed to fetch ${section}`);
      return r.json() as Promise<ApiData<T>>;
    });
}

export function LazyDemo() {
  return (
    <div className="flex flex-col gap-12">
      <LazySection<AnalyticsItem>
        section="analytics"
        title="Analytics Overview"
        delay={1200}
      >
        {(data) => <AnalyticsCard data={data} />}
      </LazySection>

      <LazySection<UserItem> section="users" title="Recent Users" delay={1800}>
        {(data) => <UsersCard data={data} />}
      </LazySection>

      <LazySection<ActivityItem>
        section="activity"
        title="Activity Feed"
        delay={2200}
      >
        {(data) => <ActivityCard data={data} />}
      </LazySection>

      <LazySection<MetricItem>
        section="metrics"
        title="System Metrics"
        delay={1000}
      >
        {(data) => <MetricsCard data={data} />}
      </LazySection>
    </div>
  );
}

function LazySection<T>({
  section,
  title,
  delay,
  children,
}: {
  section: string;
  title: string;
  delay?: number;
  children: (data: ApiData<T>) => React.ReactNode;
}) {
  const fetcher = useCallback(
    () => fetchData<T>(section, delay)(),
    [section, delay],
  );

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
      <LazyLoader<ApiData<T>> fetcher={fetcher}>{children}</LazyLoader>
    </section>
  );
}

function AnalyticsCard({ data }: { data: ApiData<AnalyticsItem> }) {
  return (
    <div className="rounded-xl border border-white/5 bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <h3 className="text-sm font-medium text-zinc-200">{data.title}</h3>
        <span className="text-[11px] text-zinc-500">{data.fetchedAt}</span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-white/5 sm:grid-cols-3">
        {data.items.map((item) => (
          <div key={item.label} className="bg-zinc-900/80 px-5 py-4">
            <p className="text-xs text-zinc-500">{item.label}</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {item.value}
            </p>
            <p
              className={`mt-0.5 text-xs font-medium ${
                item.change.startsWith("+")
                  ? "text-emerald-400"
                  : item.change.startsWith("-")
                    ? "text-red-400"
                    : "text-zinc-400"
              }`}
            >
              {item.change}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersCard({ data }: { data: ApiData<UserItem> }) {
  return (
    <div className="rounded-xl border border-white/5 bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <h3 className="text-sm font-medium text-zinc-200">{data.title}</h3>
        <span className="text-[11px] text-zinc-500">{data.fetchedAt}</span>
      </div>
      <ul className="divide-y divide-white/5">
        {data.items.map((user) => (
          <li
            key={user.email}
            className="flex items-center justify-between px-5 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-400">
                {user.name[0]}
              </div>
              <div>
                <p className="text-sm text-zinc-200">{user.name}</p>
                <p className="text-xs text-zinc-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                {user.role}
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  user.status === "active" ? "bg-emerald-400" : "bg-zinc-600"
                }`}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActivityCard({ data }: { data: ApiData<ActivityItem> }) {
  return (
    <div className="rounded-xl border border-white/5 bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <h3 className="text-sm font-medium text-zinc-200">{data.title}</h3>
        <span className="text-[11px] text-zinc-500">{data.fetchedAt}</span>
      </div>
      <ul className="divide-y divide-white/5">
        {data.items.map((item, i) => (
          <li key={i} className="flex items-center gap-3 px-5 py-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[11px] font-semibold text-violet-400">
              {item.actor[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm text-zinc-300">
                <span className="font-medium text-zinc-100">{item.actor}</span>{" "}
                {item.action}
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-zinc-600">
              {item.timestamp}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetricsCard({ data }: { data: ApiData<MetricItem> }) {
  return (
    <div className="rounded-xl border border-white/5 bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <h3 className="text-sm font-medium text-zinc-200">{data.title}</h3>
        <span className="text-[11px] text-zinc-500">{data.fetchedAt}</span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-white/5 sm:grid-cols-4">
        {data.items.map((metric) => (
          <div key={metric.label} className="bg-zinc-900/80 px-5 py-4">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  metric.status === "healthy"
                    ? "bg-emerald-400"
                    : "bg-amber-400"
                }`}
              />
              <p className="text-xs text-zinc-500">{metric.label}</p>
            </div>
            <p className="mt-2 text-lg font-semibold text-white">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
