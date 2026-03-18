"use client";

import { useEffect, useMemo, useState } from "react";
import type { PortalAppKey } from "@/lib/portal-types";
import type { ComponentType } from "react";

type RemoteContainer = {
  init: (shareScope: unknown) => Promise<void>;
  get: (
    module: string,
  ) => Promise<() => { default?: ComponentType; [k: string]: unknown }>;
};

interface FederationRuntime {
  __webpack_init_sharing__?: (scope: string) => Promise<void>;
  __webpack_share_scopes__?: { default?: unknown };
  app1?: RemoteContainer;
  app2?: RemoteContainer;
}

const loadedScripts = new Set<string>();

function loadRemoteEntry(url: string): Promise<void> {
  if (loadedScripts.has(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.type = "text/javascript";
    script.async = true;
    script.onload = () => {
      loadedScripts.add(url);
      resolve();
    };
    script.onerror = () =>
      reject(new Error(`Failed to load remote entry: ${url}`));
    document.head.appendChild(script);
  });
}

interface Props {
  title: string;
  appKey: PortalAppKey;
  baseUrl: string;
  reachable: boolean;
}

export function MicroAppShell({ title, appKey, baseUrl, reachable }: Props) {
  const [reloadToken, setReloadToken] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [RemoteComponent, setRemoteComponent] = useState<ComponentType | null>(
    null,
  );

  const remoteModule = appKey === "app1" ? "./App1Remote" : "./App2Remote";
  const remoteEntryUrl = useMemo(
    () => `${baseUrl.replace(/\/$/, "")}/_next/static/chunks/remoteEntry.js`,
    [baseUrl],
  );

  useEffect(() => {
    let cancelled = false;

    async function mountRemote() {
      if (!reachable) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        await loadRemoteEntry(remoteEntryUrl);

        const runtime = globalThis as FederationRuntime;
        const webpackInitSharing = runtime.__webpack_init_sharing__;
        const webpackShareScopes = runtime.__webpack_share_scopes__;
        if (!webpackInitSharing || !webpackShareScopes?.default) {
          throw new Error("Webpack share scope is not available in host app");
        }

        await webpackInitSharing("default");

        const container = runtime[appKey];
        if (!container) {
          throw new Error(`Remote container not found on window: ${appKey}`);
        }

        await container.init(webpackShareScopes.default);
        const factory = await container.get(remoteModule);
        const mod = factory();
        const component = (mod.default ?? mod) as ComponentType;

        if (!cancelled) {
          setRemoteComponent(() => component);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load remote module",
          );
          setRemoteComponent(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    mountRemote();

    return () => {
      cancelled = true;
    };
  }, [appKey, reachable, remoteEntryUrl, remoteModule, reloadToken]);

  function reload() {
    setReloadToken((prev) => prev + 1);
  }

  if (!reachable) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-semibold text-amber-900">
          {title} is offline
        </h2>
        <p className="mt-2 text-sm text-amber-800">
          Start the micro frontend service and refresh this page.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        <button
          onClick={reload}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Reload
        </button>
      </div>

      <div className="relative h-[calc(100vh-11rem)] min-h-[600px] p-4">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && RemoteComponent && (
          <RemoteComponent key={reloadToken} />
        )}
      </div>
    </section>
  );
}
