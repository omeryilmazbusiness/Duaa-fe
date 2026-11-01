import type { Metadata, Viewport } from "next";
import { QRGuestCard } from "@/components/public/qr-guest-card";

export const metadata: Metadata = {
  title: "Duaa Cafe",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f2f2f7",
};

export default async function PublicQRPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <QRGuestCard token={token} />;
}
