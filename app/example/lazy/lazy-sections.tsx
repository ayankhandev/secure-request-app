"use client";

import { useCallback } from "react";

import { LazyLoader } from "@/lib/lazy-loader";

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

const SECTIONS = [
  { id: "analytics", title: "Analytics Overview", delay: 1200 },
  { id: "users", title: "Recent Users", delay: 1800 },
  { id: "activity", title: "Activity Feed", delay: 2200 },
  { id: "metrics", title: "System Metrics", delay: 1000 },
  { id: "orders", title: "Recent Orders", delay: 1600 },
  { id: "notifications", title: "Notifications", delay: 2000 },
  { id: "performance", title: "Performance Scores", delay: 1400 },
  { id: "deployments", title: "Deployments", delay: 1800 },
] as const;

export function LazyDemo() {
  return (
    <div className="flex flex-col">
      {SECTIONS.map((s, i) => (
        <LazySection
          key={s.id}
          section={s.id}
          title={s.title}
          delay={s.delay}
          index={i}
        />
      ))}
    </div>
  );
}

function LazySection({
  section,
  title,
  delay,
  index,
}: {
  section: string;
  title: string;
  delay: number;
  index: number;
}) {
  const fetcher = useCallback(
    () => fetchData(section, delay)(),
    [section, delay],
  );

  return (
    <section className="flex min-h-screen flex-col justify-center py-16">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400">
          {index + 1}
        </span>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <LazyLoader fetcher={fetcher}>
        {(data) => (
          <SectionCard
            section={section}
            data={data as ApiData<Record<string, string>>}
          />
        )}
      </LazyLoader>
    </section>
  );
}

function SectionCard({
  section,
  data,
}: {
  section: string;
  data: ApiData<Record<string, string>>;
}) {
  const keys = data.items.length > 0 ? Object.keys(data.items[0]) : [];

  if (section === "users") return <UsersCard data={data} />;
  if (section === "activity") return <ActivityCard data={data} />;
  if (section === "orders") return <OrdersCard data={data} />;
  if (section === "notifications") return <NotificationsCard data={data} />;
  if (section === "deployments") return <DeploymentsCard data={data} />;

  return (
    <div className="rounded-xl border border-white/5 bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <h3 className="text-sm font-medium text-zinc-200">{data.title}</h3>
        <span className="text-[11px] text-zinc-500">{data.fetchedAt}</span>
      </div>
      <div
        className={`grid gap-px bg-white/5 ${keys.length <= 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}
      >
        {data.items.map((item, i) => (
          <div key={i} className="bg-zinc-900/80 px-5 py-4">
            {keys.map((k) => (
              <p
                key={k}
                className={`text-xs ${k === keys[0] ? "text-zinc-500" : k === keys[1] ? "mt-1 text-lg font-semibold text-white" : "mt-0.5 font-medium " + changeColor(item[k])}`}
              >
                {item[k]}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function changeColor(val: string) {
  if (
    val.startsWith("+") ||
    val === "active" ||
    val === "healthy" ||
    val === "completed" ||
    val === "live"
  )
    return "text-emerald-400";
  if (val.startsWith("-") || val === "warning" || val === "refunded")
    return "text-red-400";
  return "text-zinc-400";
}

function UsersCard({ data }: { data: ApiData<Record<string, string>> }) {
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
                className={`h-2 w-2 rounded-full ${user.status === "active" ? "bg-emerald-400" : "bg-zinc-600"}`}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActivityCard({ data }: { data: ApiData<Record<string, string>> }) {
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
            <p className="flex-1 text-sm text-zinc-300">
              <span className="font-medium text-zinc-100">{item.actor}</span>{" "}
              {item.action}
            </p>
            <span className="shrink-0 text-[11px] text-zinc-600">
              {item.timestamp}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrdersCard({ data }: { data: ApiData<Record<string, string>> }) {
  return (
    <div className="rounded-xl border border-white/5 bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <h3 className="text-sm font-medium text-zinc-200">{data.title}</h3>
        <span className="text-[11px] text-zinc-500">{data.fetchedAt}</span>
      </div>
      <ul className="divide-y divide-white/5">
        {data.items.map((order) => (
          <li
            key={order.id}
            className="flex items-center justify-between px-5 py-3"
          >
            <div>
              <p className="text-sm font-medium text-zinc-200">{order.id}</p>
              <p className="text-xs text-zinc-500">{order.customer}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-white">
                {order.amount}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${order.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : order.status === "refunded" ? "bg-red-500/10 text-red-400" : "bg-white/5 text-zinc-400"}`}
              >
                {order.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotificationsCard({
  data,
}: {
  data: ApiData<Record<string, string>>;
}) {
  const iconColor: Record<string, string> = {
    alert: "text-red-400 bg-red-500/10",
    warning: "text-amber-400 bg-amber-500/10",
    info: "text-blue-400 bg-blue-500/10",
  };
  return (
    <div className="rounded-xl border border-white/5 bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <h3 className="text-sm font-medium text-zinc-200">{data.title}</h3>
        <span className="text-[11px] text-zinc-500">{data.fetchedAt}</span>
      </div>
      <ul className="divide-y divide-white/5">
        {data.items.map((n, i) => (
          <li key={i} className="flex items-start gap-3 px-5 py-3">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${iconColor[n.type] ?? iconColor.info}`}
            >
              {n.type[0].toUpperCase()}
            </span>
            <div className="flex-1">
              <p className="text-sm text-zinc-300">{n.message}</p>
              <p className="mt-0.5 text-[11px] text-zinc-600">{n.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeploymentsCard({ data }: { data: ApiData<Record<string, string>> }) {
  const envColor: Record<string, string> = {
    production: "text-emerald-400 bg-emerald-500/10",
    staging: "text-amber-400 bg-amber-500/10",
    development: "text-blue-400 bg-blue-500/10",
  };
  return (
    <div className="rounded-xl border border-white/5 bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <h3 className="text-sm font-medium text-zinc-200">{data.title}</h3>
        <span className="text-[11px] text-zinc-500">{data.fetchedAt}</span>
      </div>
      <ul className="divide-y divide-white/5">
        {data.items.map((d) => (
          <li
            key={d.version}
            className="flex items-center justify-between px-5 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-semibold text-zinc-200">
                {d.version}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${envColor[d.env] ?? "bg-white/5 text-zinc-400"}`}
              >
                {d.env}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">{d.deployer}</span>
              <span className="text-[11px] text-zinc-600">{d.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
