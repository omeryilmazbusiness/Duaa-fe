import { ManagerLoginForm } from "@/components/login/manager-login-form";

export default async function TenantLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ManagerLoginForm slug={slug} />;
}
