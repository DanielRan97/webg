import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata: Metadata = { title: "שכחתם סיסמה?", robots: { index: false } };

export default async function ForgotPasswordPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <ForgotPasswordForm />;
}
