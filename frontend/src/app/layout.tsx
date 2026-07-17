import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

export const metadata: Metadata = {
  title: "ForgeAI — AI-Powered Data Scientist",
  description:
    "Upload a raw CSV and ForgeAI reasons like an experienced data scientist — profiling, planning, collaborating, and producing ML-ready datasets with full reproducibility.",
  keywords: "AI, data science, machine learning, data preprocessing, Gemma, CSV cleaner",
  openGraph: {
    title: "ForgeAI — AI-Powered Data Scientist",
    description: "Upload messy data. Get ML-ready datasets. Powered by Gemma 4.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
