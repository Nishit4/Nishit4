import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold text-slate-900">
      <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
          <path
            d="M4 12.5 20 4l-4.5 16-4-6.5L4 12.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="m11.5 13.5 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      ReplyPilot
    </Link>
  );
}
