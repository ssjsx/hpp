import { AppCard } from "@/components/portal/AppCard";
import { getPortalBootstrapData } from "@/lib/portal-config";

// RSC initial load: fetch app definitions and live status on the server.
export default async function HomePage() {
  const bootstrap = await getPortalBootstrapData();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
          Unified Portal
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Property Intelligence Workspace
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
          This portal uses Next.js App Router and server components for initial
          bootstrap. App 1 and App 2 are integrated as independent micro
          frontends.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {bootstrap.apps.map((app) => (
          <AppCard
            key={app.key}
            app={app}
            status={bootstrap.statuses.find((status) => status.key === app.key)}
          />
        ))}
      </section>
    </div>
  );
}
