"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth-provider";
import { LocaleProvider } from "./locale-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (count, error) => {
              const status = (error as { status?: number }).status;
              if (status === 401 || status === 403 || status === 404) return false;
              return count < 1;
            },
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <LocaleProvider>
        <AuthProvider>
          {children}
          <Toaster theme="light" position="top-center" richColors />
        </AuthProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
