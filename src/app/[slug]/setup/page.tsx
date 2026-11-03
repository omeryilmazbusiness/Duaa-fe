import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { SetupScreen } from "@/components/setup/setup-screen";

export default async function SetupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense
      fallback={
        <div className="night-glass flex min-h-dvh items-center justify-center bg-[#050816]">
          <div aria-hidden className="night-aurora fixed inset-0 -z-10" />
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      }
    >
      <SetupScreen slug={slug} />
    </Suspense>
  );
}
