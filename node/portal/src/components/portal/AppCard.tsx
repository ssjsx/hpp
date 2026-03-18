import type { PortalAppDefinition, PortalAppStatus } from "@/lib/portal-types";

interface Props {
  app: PortalAppDefinition;
  status?: PortalAppStatus;
}

export function AppCard({ app, status }: Props) {
  const reachable = status?.reachable ?? false;

  return (
    <a
      href={app.path}
      className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
          {app.key.toUpperCase()}
        </p>
        <span
          className={[
            "rounded-full px-2 py-1 text-xs font-medium",
            reachable
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700",
          ].join(" ")}
        >
          {reachable ? "Online" : "Unavailable"}
        </span>
      </div>
      <h2 className="mt-3 text-xl font-semibold text-slate-900">{app.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        {app.description}
      </p>
    </a>
  );
}
