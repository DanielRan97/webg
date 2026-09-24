import type { Metadata } from "next";
import { AuthCard } from "@/components/AuthCard";
import { VerifyEmailConfirm, VerifyEmailLinks } from "@/components/VerifyEmailConfirm";

export const metadata: Metadata = { title: "אימות אימייל", robots: { index: false } };

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { token } = await searchParams;

  return (
    <AuthCard heading="אימות כתובת האימייל" footer={<VerifyEmailLinks />}>
      <VerifyEmailConfirm token={typeof token === "string" ? token : ""} />
    </AuthCard>
  );
}
