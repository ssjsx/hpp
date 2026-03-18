import type {
  PortalAppDefinition,
  PortalAppKey,
  PortalAppStatus,
  PortalBootstrapData,
} from "@/lib/portal-types";

const app1Base = process.env.PORTAL_APP1_URL ?? "http://127.0.0.1:3000";
const app2Base = process.env.PORTAL_APP2_URL ?? "http://127.0.0.1:3002";

export const PORTAL_APPS: PortalAppDefinition[] = [
  {
    key: "app1",
    title: "Property Value Estimator",
    description: "Regression-based property estimate workflow and history.",
    path: "/app1",
    baseUrl: app1Base,
    mountPath: "/app1",
  },
  {
    key: "app2",
    title: "Property Market Analysis",
    description: "Segment dashboards, what-if analysis, and exports.",
    path: "/app2",
    baseUrl: app2Base,
    mountPath: "/app2",
  },
];

async function probeApp(app: PortalAppDefinition): Promise<PortalAppStatus> {
  try {
    const res = await fetch(app.baseUrl, {
      method: "GET",
      cache: "no-store",
    });

    return {
      key: app.key,
      reachable: res.ok,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      key: app.key,
      reachable: false,
      checkedAt: new Date().toISOString(),
    };
  }
}

export async function getPortalBootstrapData(): Promise<PortalBootstrapData> {
  const statuses = await Promise.all(PORTAL_APPS.map((app) => probeApp(app)));
  return { apps: PORTAL_APPS, statuses };
}

export function getPortalAppByKey(key: PortalAppKey): PortalAppDefinition {
  const app = PORTAL_APPS.find((item) => item.key === key);
  if (!app) {
    throw new Error(`Unknown app key: ${key}`);
  }
  return app;
}
