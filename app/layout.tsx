import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const openSansHeading = DM_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const openSansBody = DM_Sans({
  variable: "--font-body-text",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://reelx.ai"),
  icons: { icon: "/brand/reelx-tab-icon.svg" },
  title: "Reelx — AI Creative Studio",
  description:
    "Create images, videos, and avatar content at the speed of content. Reelx is an AI creative studio with fast workflows, flexible models, and production-ready output.",
  openGraph: {
    title: "Reelx — AI Creative Studio",
    description:
      "Create images, videos, and avatar content at the speed of content. Reelx is an AI creative studio with fast workflows, flexible models, and production-ready output.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${openSansHeading.variable} ${openSansBody.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
