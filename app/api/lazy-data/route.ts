import { type NextRequest } from "next/server";

const SECTIONS: Record<
  string,
  { title: string; items: Record<string, string>[] }
> = {
  analytics: {
    title: "Analytics Overview",
    items: [
      { label: "Page Views", value: "24,891", change: "+12.3%" },
      { label: "Unique Visitors", value: "8,342", change: "+8.7%" },
      { label: "Bounce Rate", value: "32.1%", change: "-2.4%" },
      { label: "Avg. Session", value: "4m 12s", change: "+18s" },
      { label: "Conversions", value: "1,205", change: "+5.2%" },
      { label: "Revenue", value: "$48,920", change: "+11.8%" },
    ],
  },
  users: {
    title: "Recent Users",
    items: [
      {
        name: "Alice Chen",
        email: "alice@example.com",
        role: "Admin",
        status: "active",
      },
      {
        name: "Bob Martinez",
        email: "bob@example.com",
        role: "Editor",
        status: "active",
      },
      {
        name: "Carol Davis",
        email: "carol@example.com",
        role: "Viewer",
        status: "inactive",
      },
      {
        name: "Dan Wilson",
        email: "dan@example.com",
        role: "Editor",
        status: "active",
      },
      {
        name: "Eve Park",
        email: "eve@example.com",
        role: "Admin",
        status: "active",
      },
      {
        name: "Frank Lee",
        email: "frank@example.com",
        role: "Viewer",
        status: "active",
      },
      {
        name: "Grace Kim",
        email: "grace@example.com",
        role: "Editor",
        status: "inactive",
      },
      {
        name: "Henry Zhao",
        email: "henry@example.com",
        role: "Admin",
        status: "active",
      },
    ],
  },
  activity: {
    title: "Activity Feed",
    items: [
      {
        action: "deployed v2.4.1 to production",
        actor: "alice",
        timestamp: "3m ago",
      },
      {
        action: "merged PR #347 — fix auth redirect",
        actor: "bob",
        timestamp: "15m ago",
      },
      {
        action: "updated environment variables",
        actor: "carol",
        timestamp: "27m ago",
      },
      {
        action: "created staging branch release/2.5",
        actor: "dan",
        timestamp: "39m ago",
      },
      {
        action: "resolved incident #42 — API timeout",
        actor: "eve",
        timestamp: "51m ago",
      },
      {
        action: "added monitoring alerts for CPU",
        actor: "alice",
        timestamp: "63m ago",
      },
      {
        action: "approved PR #351 — rate limiter",
        actor: "bob",
        timestamp: "75m ago",
      },
      {
        action: "rotated database credentials",
        actor: "carol",
        timestamp: "87m ago",
      },
      {
        action: "enabled CDN caching for static assets",
        actor: "dan",
        timestamp: "99m ago",
      },
      {
        action: "rolled back canary deployment",
        actor: "eve",
        timestamp: "111m ago",
      },
    ],
  },
  metrics: {
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
  orders: {
    title: "Recent Orders",
    items: [
      {
        id: "#ORD-7291",
        customer: "Liam Johnson",
        amount: "$142.50",
        status: "completed",
      },
      {
        id: "#ORD-7290",
        customer: "Mia Williams",
        amount: "$89.00",
        status: "processing",
      },
      {
        id: "#ORD-7289",
        customer: "Noah Brown",
        amount: "$234.99",
        status: "completed",
      },
      {
        id: "#ORD-7288",
        customer: "Olivia Jones",
        amount: "$56.75",
        status: "shipped",
      },
      {
        id: "#ORD-7287",
        customer: "Ethan Garcia",
        amount: "$310.00",
        status: "completed",
      },
      {
        id: "#ORD-7286",
        customer: "Sophia Miller",
        amount: "$178.25",
        status: "refunded",
      },
      {
        id: "#ORD-7285",
        customer: "Lucas Davis",
        amount: "$92.10",
        status: "processing",
      },
      {
        id: "#ORD-7284",
        customer: "Ava Rodriguez",
        amount: "$445.00",
        status: "completed",
      },
    ],
  },
  notifications: {
    title: "Notifications",
    items: [
      {
        type: "alert",
        message: "CPU usage exceeded 90% on node-3",
        time: "2m ago",
      },
      {
        type: "info",
        message: "New deployment v2.4.1 rolled out successfully",
        time: "8m ago",
      },
      {
        type: "warning",
        message: "SSL certificate expires in 14 days",
        time: "1h ago",
      },
      {
        type: "alert",
        message: "Database connection pool at 85% capacity",
        time: "2h ago",
      },
      {
        type: "info",
        message: "Backup completed — 12.4 GB archived",
        time: "3h ago",
      },
      {
        type: "warning",
        message: "Disk usage on /var/log at 78%",
        time: "4h ago",
      },
      {
        type: "info",
        message: "Rate limiter configuration updated",
        time: "5h ago",
      },
      {
        type: "alert",
        message: "Failed login attempts from 192.168.1.x",
        time: "6h ago",
      },
    ],
  },
  performance: {
    title: "Performance Scores",
    items: [
      { page: "Homepage", lcp: "1.2s", cls: "0.04", fid: "12ms", score: "98" },
      { page: "Dashboard", lcp: "1.8s", cls: "0.08", fid: "24ms", score: "91" },
      { page: "Settings", lcp: "0.9s", cls: "0.02", fid: "8ms", score: "99" },
      { page: "Profile", lcp: "1.4s", cls: "0.06", fid: "18ms", score: "94" },
      { page: "Reports", lcp: "2.1s", cls: "0.12", fid: "32ms", score: "86" },
      { page: "Checkout", lcp: "1.6s", cls: "0.05", fid: "20ms", score: "93" },
    ],
  },
  deployments: {
    title: "Deployments",
    items: [
      {
        version: "v2.4.1",
        env: "production",
        status: "live",
        deployer: "alice",
        time: "12m ago",
      },
      {
        version: "v2.4.0",
        env: "production",
        status: "previous",
        deployer: "bob",
        time: "2d ago",
      },
      {
        version: "v2.5.0-rc.1",
        env: "staging",
        status: "testing",
        deployer: "carol",
        time: "4h ago",
      },
      {
        version: "v2.3.9",
        env: "production",
        status: "superseded",
        deployer: "dan",
        time: "7d ago",
      },
      {
        version: "v2.5.0-beta.3",
        env: "development",
        status: "canary",
        deployer: "eve",
        time: "1h ago",
      },
    ],
  },
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const section = url.searchParams.get("section") ?? "analytics";
  const delay = Math.min(Number(url.searchParams.get("delay") ?? "1500"), 5000);

  const data = SECTIONS[section] ?? SECTIONS.analytics;

  await new Promise((resolve) => setTimeout(resolve, delay));

  return Response.json({
    section,
    title: data.title,
    items: data.items,
    fetchedAt: new Date().toISOString(),
  });
}
