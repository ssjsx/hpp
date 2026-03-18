import { MicroAppShell } from "@/components/portal/MicroAppShell";
import { getPortalAppByKey, getPortalBootstrapData } from "@/lib/portal-config";

export default async function App1PortalPage() {
  const app = getPortalAppByKey("app1");
  const bootstrap = await getPortalBootstrapData();
  const status = bootstrap.statuses.find((item) => item.key === "app1");

  return (
    <MicroAppShell
      title={app.title}
      appKey={app.key}
      baseUrl={app.baseUrl}
      reachable={status?.reachable ?? false}
    />
  );
}
