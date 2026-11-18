"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { postLoginPath, switchLandingTab } from "@/domain/staff-scope";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";

/** Switches the signed-in manager to another business and opens that business's dashboard. */
export function useSwitchBusiness() {
  const { switchWorkspace } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const busy = useRef(false);

  return useCallback(
    async (workspaceId: string) => {
      // A second tap while the first switch is still running would race two sessions.
      if (busy.current) return;
      busy.current = true;
      try {
        const res = await switchWorkspace(workspaceId);
        if (!res.session) return;
        toast.success(t.switchedTo.replace("{name}", res.session.workspace.name));
        router.replace(
          postLoginPath({
            slug: res.session.workspace.slug,
            surface: res.session.surface,
            defaultTab: switchLandingTab(res.session.tabs, res.session.defaultTab),
          }),
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.errorTitle);
      } finally {
        busy.current = false;
      }
    },
    [switchWorkspace, router, t],
  );
}
