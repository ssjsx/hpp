"use client";

import { useMemo, useState } from "react";

interface UseMicroAppFrameInput {
  baseUrl: string;
  initialPath?: string;
}

export function useMicroAppFrame({
  baseUrl,
  initialPath = "/",
}: UseMicroAppFrameInput) {
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const frameSrc = useMemo(() => {
    const normalizedPath = initialPath.startsWith("/")
      ? initialPath
      : `/${initialPath}`;

    const url = new URL(
      normalizedPath,
      baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
    );
    // Helps bypass stale iframe caches when manual reload is triggered.
    url.searchParams.set("portalReload", String(reloadToken));
    return url.toString();
  }, [baseUrl, initialPath, reloadToken]);

  function handleLoad() {
    setIsLoading(false);
  }

  function reload() {
    setIsLoading(true);
    setReloadToken((prev) => prev + 1);
  }

  return {
    frameSrc,
    isLoading,
    reloadToken,
    handleLoad,
    reload,
  };
}
