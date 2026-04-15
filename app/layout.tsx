import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";

/* Brand typography spec: FreeSans Bold (headers) / FreeSans (body)
   Open Sans is used as the closest available web-font approximation. */
const openSansHeading = Open_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const openSansBody = Open_Sans({
  variable: "--font-body-text",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://reelx.ai"),
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
