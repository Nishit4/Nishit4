import type { ReactNode } from "react";
import { Suspense } from "react";

import { Logo } from "@/components/logo";
import { AppNav } from "./app-nav";
import { UserMenu } from "./user-menu";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-3">
          <Logo href="/dashboard" />
          <Suspense fallback={<div className="h-9 w-48" />}>
            <UserMenu />
          </Suspense>
          <AppNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
