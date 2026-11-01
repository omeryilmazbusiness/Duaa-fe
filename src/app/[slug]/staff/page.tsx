import { StaffPortal } from "@/components/staff/portal";

export default async function StaffPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StaffPortal slug={slug} />;
}
