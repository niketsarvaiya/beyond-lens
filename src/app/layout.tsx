import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { StoreHydration } from "@/components/layout/store-hydration";

export const metadata: Metadata = {
  title: "Beyond Lens",
  description: "AI-powered content review and social media management for Beyond Alliance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex h-screen overflow-hidden bg-[#0a0a0b]">
        <StoreHydration />
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </body>
    </html>
  );
}
