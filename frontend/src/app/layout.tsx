import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", style: ["normal", "italic"], axes: ["opsz", "SOFT"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: "only pain — you're not alone", template: "%s · only pain" },
  description: "A quiet corner of the internet for the heavy stuff. Post anonymously, find people who get it, and talk to Ember when nobody's awake.",
  applicationName: "only pain",
  openGraph: { type: "website", siteName: "only pain", title: "only pain — you're not alone", description: "A quiet corner of the internet for the heavy stuff.", url: APP_URL },
  twitter: { card: "summary_large_image", title: "only pain", description: "A quiet corner of the internet for the heavy stuff." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1a1620" },
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="grain min-h-dvh bg-bg text-fg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
