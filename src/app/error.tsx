"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-red-800 mb-2">
          Something went wrong!
        </h2>
        <p className="text-sm text-red-600 mb-4">
          An unexpected error occurred while rendering this page.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 transition"
          >
            Try again
          </button>
          <a
            href="https://github.com/Harbor-hq/harbor-frontend/issues/new?title=[BUG]%20Render%20Error"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition"
          >
            Report issue
          </a>
        </div>
      </div>
    </div>
  );
}
