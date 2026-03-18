import Link from "next/link";

const APPS = [
  {
    href: "/app1",
    title: "Property Value Estimator",
    description:
      "Enter property details and get an instant price estimate powered by a trained regression model.",
    badge: "App 1",
    active: true,
  },
];

export default function Home() {
  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">
          PropIQ
        </h1>
        <p className="text-lg text-slate-500">
          Property intelligence at your fingertips.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 max-w-3xl mx-auto">
        {APPS.map((app) => (
          <Link
            key={app.badge}
            href={app.active ? app.href : "#"}
            aria-disabled={!app.active}
            className={[
              "block rounded-2xl border bg-white p-6 shadow-sm transition-shadow",
              app.active
                ? "hover:shadow-md hover:border-blue-300 cursor-pointer"
                : "opacity-50 cursor-not-allowed pointer-events-none",
            ].join(" ")}
          >
            <div className="flex items-start gap-4">
              <div>
                <span
                  className={`text-xs font-semibold uppercase tracking-widest ${
                    app.active ? "text-blue-600" : "text-slate-400"
                  }`}
                >
                  {app.badge}
                </span>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  {app.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  {app.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
