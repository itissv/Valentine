import type { Metadata } from "next";
import { Inter, Dancing_Script } from "next/font/google";
import "./globals.css";
import { PusherProvider } from "@/providers/PusherProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dancingScript = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing" });

export const metadata: Metadata = {
  title: "Be My Valentine?",
  description: "A romantic interactive experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${dancingScript.variable} font-sans antialiased`}>
        <PusherProvider>
          {children}
        </PusherProvider>
      </body>
    </html>
  );
}
