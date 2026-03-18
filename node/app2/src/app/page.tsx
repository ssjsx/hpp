import Link from "next/link";

export default function Home() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
          App 2
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Property Market Analysis
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          Interactive market dashboard with filters, what-if prediction
          analysis, and data export.
        </p>
        <Link
          href="/app2"
          className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Open Dashboard
        </Link>
      </div>
    </div>
  );
}
