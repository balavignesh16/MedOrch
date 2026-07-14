import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MedOrch | Command Center",
  description: "Healthcare Analytics Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} h-screen w-screen overflow-hidden flex text-slate-100 selection:bg-brand-teal/30`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
