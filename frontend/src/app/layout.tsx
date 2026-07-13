import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} h-screen w-screen overflow-hidden flex bg-slate-900 text-slate-100`}>
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto p-10 ml-64">
          {children}
        </main>
      </body>
    </html>
  );
}
