import type { Metadata } from "next";
import Link from "next/link";
import { VerifyEmailConfirm, VerifyEmailLinks } from "@/components/VerifyEmailConfirm";

export const metadata: Metadata = { title: "אימות אימייל", robots: { index: false } };

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-gray-300 bg-white p-6 text-center shadow-sm sm:p-8">
        <Link href="/" className="inline-flex min-h-11 items-center text-3xl font-extrabold text-indigo-700">WEBG</Link>
        <h1 className="text-2xl font-bold">אימות כתובת האימייל</h1>
        <VerifyEmailConfirm token={typeof token === "string" ? token : ""} />
        <VerifyEmailLinks />
      </div>
    </main>
  );
}
