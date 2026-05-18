import { type NextRequest } from "next/server";

const SECTIONS = [
  {
    id: "analytics",
    title: "Analytics Overview",
    items: Array.from({ length: 6 }, (_, i) => ({
      label: [
        "Page Views",
        "Unique Visitors",
        "Bounce Rate",
        "Avg. Session",
        "Conversions",
        "Revenue",
      ][i],
      value: ["24,891", "8,342", "32.1%", "4m 12s", "1,205", "$48,920"][i],
      change: ["+12.3%", "+8.7%", "-2.4%", "+18s", "+5.2%", "+11.8%"][i],
    })),
  },
  {
    id: "users",
    title: "Recent Users",
    items: Array.from({ length: 5 }, (_, i) => ({
      name: [
        "Alice Chen",
        "Bob Martinez",
        "Carol Davis",
        "Dan Wilson",
        "Eve Park",
      ][i],
      email: [
        "alice@example.com",
        "bob@example.com",
        "carol@example.com",
        "dan@example.com",
        "eve@example.com",
      ][i],
      role: ["Admin", "Editor", "Viewer", "Editor", "Admin"][i],
      status: ["active", "active", "inactive", "active", "active"][i],
    })),
  },
  {
    id: "activity",
    title: "Activity Feed",
    items: Array.from({ length: 8 }, (_, i) => ({
      action: [
        "deployed v2.4.1 to production",
        "merged PR #347 — fix auth redirect",
        "updated environment variables",
        "created staging branch release/2.5",
        "resolved incident #42 — API timeout",
        "added monitoring alerts for CPU",
        "approved PR #351 — rate limiter",
        "rotated database credentials",
      ][i],
      actor: ["alice", "bob", "carol", "dan", "eve", "alice", "bob", "carol"][
        i
      ],
      timestamp: `${i * 12 + 3}m ago`,
    })),
  },
  {
    id: "metrics",
    title: "System Metrics",
    items: [
      { label: "CPU Usage", value: "34%", status: "healthy" },
      { label: "Memory", value: "2.1 / 4 GB", status: "healthy" },
      { label: "Disk I/O", value: "12 MB/s", status: "healthy" },
      { label: "Network In", value: "8.4 MB/s", status: "healthy" },
      { label: "Network Out", value: "3.2 MB/s", status: "healthy" },
      { label: "Req/sec", value: "1,247", status: "healthy" },
      { label: "Error Rate", value: "0.12%", status: "warning" },
      { label: "P99 Latency", value: "142ms", status: "healthy" },
    ],
  },
];

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const section = url.searchParams.get("section") ?? "analytics";
  const delay = Math.min(Number(url.searchParams.get("delay") ?? "1500"), 5000);

  const data = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];

  await new Promise((resolve) => setTimeout(resolve, delay));

  return Response.json({
    section: data.id,
    title: data.title,
    items: data.items,
    fetchedAt: new Date().toISOString(),
  });
}
