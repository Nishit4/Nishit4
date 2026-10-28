"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/business", label: "Business profile" },
  { href: "/billing", label: "Billing" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="-mx-2 flex w-full gap-1 overflow-x-auto md:order-none md:mr-auto md:w-auto">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
