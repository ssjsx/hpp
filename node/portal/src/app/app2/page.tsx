import { MicroAppShell } from "@/components/portal/MicroAppShell";
import { getPortalAppByKey, getPortalBootstrapData } from "@/lib/portal-config";

export default async function App2PortalPage() {
  const app = getPortalAppByKey("app2");
  const bootstrap = await getPortalBootstrapData();
  const status = bootstrap.statuses.find((item) => item.key === "app2");

  return (
    <MicroAppShell
      title={app.title}
      appKey={app.key}
      baseUrl={app.baseUrl}
      reachable={status?.reachable ?? false}
    />
  );
}
