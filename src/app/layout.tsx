import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "TanyaHukum - Asisten Legal Ketenagakerjaan",
  description: "Asisten hukum berbasis AI untuk pekerja Indonesia. Bukan pengganti penasihat hukum resmi.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${outfit.variable}`}>
      <body className="font-outfit antialiased selection:bg-blue-500/30">
        {children}
      </body>
    </html>
  );
}
