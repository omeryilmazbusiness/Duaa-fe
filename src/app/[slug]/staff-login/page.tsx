import { StaffLoginForm } from "@/components/login/staff-login-form";

export default async function StaffLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StaffLoginForm slug={slug} />;
}
