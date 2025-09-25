/*
Developed by Tomás Vera & Luis Romero
Version 1.1
Layout Component
*/
import type { Metadata } from "next";
import "@/styles/globals.css";
import Footer from "@/components/Footer";
import AppSplash from "@/components/AppSplash";

export const viewport = { width: 'device-width', initialScale: 1 };

export const metadata: Metadata = {
  title: "SmartTraffic",
  description: "Página web de SmartTraffic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="layout">
        <AppSplash minMs={1600} />
        <main className="content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
