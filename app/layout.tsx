import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: {
      default: "Inspiration — Aurora",
      template: "%s — Aurora",
    },
    description:
      "A considered edit of experiences, shaped around your time, tastes, and people.",
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
    },
    openGraph: {
      title: "Inspiration — Aurora",
      description: "Inspiration, shaped around your life—from discovery to fulfilment in one private context.",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1731, height: 909, alt: "Aurora — Inspiration, shaped around your life" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Inspiration — Aurora",
      description: "Inspiration, shaped around your life—from discovery to fulfilment in one private context.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
