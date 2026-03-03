import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight">FounderOS</h1>
        <p className="text-zinc-400 text-lg">Personal productivity intelligence</p>
        <nav className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/journal"
            className="px-6 py-3 border border-zinc-700 rounded-lg font-medium hover:border-zinc-500 transition"
          >
            Journal
          </Link>
          <Link
            href="/voice"
            className="px-6 py-3 border border-zinc-700 rounded-lg font-medium hover:border-zinc-500 transition"
          >
            Voice
          </Link>
        </nav>
      </div>
    </main>
  );
}
