import Link from "next/link";

export default function NotFound() {
  return (
    <div className="ios-settings flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-[17px] font-semibold text-ios-label">404</p>
      <p className="mt-1 text-[15px] text-ios-secondary">This page could not be found.</p>
      <Link href="/" className="mt-6 text-[17px] text-ios-blue">
        Back
      </Link>
    </div>
  );
}
