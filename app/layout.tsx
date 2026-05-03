import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ashish Sah | Full Stack Engineer & R&D Software Engineer",
  description: "Portfolio of Ashish Sah, Full Stack Developer and R&D Software Engineer with expertise in React, Node.js, Next.js, Rust, and Python.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="antialiased font-sans min-h-screen text-gray-800 selection:bg-primary/30">
        {children}
      </body>
    </html>
  );
}
