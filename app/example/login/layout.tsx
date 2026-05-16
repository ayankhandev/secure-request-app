import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login example",
  description: "Example sign-in with encrypted credentials.",
};

export default function LoginExampleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
