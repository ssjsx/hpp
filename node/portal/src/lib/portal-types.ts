export type PortalAppKey = "app1" | "app2";

export interface PortalAppDefinition {
  key: PortalAppKey;
  title: string;
  description: string;
  path: string;
  baseUrl: string;
  mountPath: string;
}

export interface PortalAppStatus {
  key: PortalAppKey;
  reachable: boolean;
  checkedAt: string;
}

export interface PortalBootstrapData {
  apps: PortalAppDefinition[];
  statuses: PortalAppStatus[];
}
