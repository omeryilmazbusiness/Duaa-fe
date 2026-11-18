"use client";

import { ErrorPanel } from "@/components/errors/error-panel";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPanel error={error} onRetry={reset} fullScreen />;
}
