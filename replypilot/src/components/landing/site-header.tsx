import Link from "next/link";

import { Logo } from "@/components/logo";
import { buttonClass } from "@/components/ui";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#demo" className="hover:text-slate-900">Live demo</a>
          <a href="#how-it-works" className="hover:text-slate-900">How it works</a>
          <a href="#pricing" className="hover:text-slate-900">Pricing</a>
          <a href="#faq" className="hover:text-slate-900">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonClass("ghost", "px-3")}>
            Log in
          </Link>
          <Link href="/signup" className={buttonClass("primary", "px-3 sm:px-4")}>
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
