import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FreshBuild Pro — Design. Comply. Build.",
  description:
    "Pre-submission compliance intelligence for residential building permits. Catch the problem before the city does.",
};

const NAV = [
  { href: "/", label: "Jobs" },
  { href: "/rules", label: "Rule set" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight text-foreground">FreshBuild Pro</span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:inline">
                Design. Comply. Build.
              </span>
            </Link>
            <nav className="ml-auto flex items-center gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/jobs/new"
                className="ml-2 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                New job
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>

        <footer className="border-t border-border bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-5 text-xs text-muted">
            FreshBuild LLC · Cincinnati, Ohio · Veteran owned — Deterministic rule engine. Every
            finding cites a primary source; nothing is inferred by a model.
          </div>
        </footer>
      </body>
    </html>
  );
}
