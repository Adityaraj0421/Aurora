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
      icon: [
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicon-32.png",
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title: "Inspiration — Aurora",
      description: "Inspiration, shaped around your life—from discovery to fulfilment in one private context.",
      type: "website",
      images: [{ url: `${origin}/og.jpg`, width: 1200, height: 630, alt: "Aurora — Inspiration, shaped around your life" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Inspiration — Aurora",
      description: "Inspiration, shaped around your life—from discovery to fulfilment in one private context.",
      images: [`${origin}/og.jpg`],
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
