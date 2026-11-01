import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ManagerShell } from "@/components/manager/shell";

export default async function ManagerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      }
    >
      <ManagerShell slug={slug} />
    </Suspense>
  );
}
