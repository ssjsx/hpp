"use client";

import { useEffect } from "react";

export default function App2Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
      <h2 className="text-xl font-semibold text-slate-800">
        Error loading Market Analysis
      </h2>
      <p className="text-sm text-slate-500 max-w-sm">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
