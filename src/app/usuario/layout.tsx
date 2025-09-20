import type { Metadata } from "next";
import "@/styles/globals.css";
import Header from "@/components/Header";

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
        <Header />
        <main className="content">{children}</main>
      </body>
    </html>
  );
}
