import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { StatusStrip } from "@/components/status-strip";

const sans = Geist({ variable: "--font-sans-stack", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono-stack", subsets: ["latin"] });
const serif = Source_Serif_4({ variable: "--font-serif-stack", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "FreshBuild Pro — Permit Operations",
  description:
    "Pre-submission compliance intelligence for residential building permits. Catch the problem before the city does.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <StatusStrip />
            <main className="flex-1 px-8 py-7">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
