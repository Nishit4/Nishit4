import Link from "next/link";

// Placeholder until the landing page is built.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <Link href="/signup" className="font-semibold text-indigo-600">
        Get started with ReplyPilot
      </Link>
    </main>
  );
}
