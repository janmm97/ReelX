import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Trending 2025 display font — editorial, bold, variable weight.
// Popular with creative agencies, brand studios, and AI tools.
const bricolage = Bricolage_Grotesque({
  variable: "--font-syne",       // keep var name so all existing references work
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Clean, geometric modern sans — ideal for body copy in creative products.
// Used widely across leading SaaS and creative-tool landing pages.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-manrope",    // keep var name so all existing references work
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "InstaArt — AI Creative Studio",
  description:
    "From Prompt to Published. The AI creative studio for content creators and marketing teams — 25+ AI models for image and video generation.",
  openGraph: {
    title: "InstaArt — AI Creative Studio",
    description:
      "From Prompt to Published. The AI creative studio for content creators and marketing teams — 25+ AI models for image and video generation.",
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
      className={`${bricolage.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
