import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared shell for every auth screen (login, signup, forgot/reset password,
 * verify email) so card width, radius, border, padding and the
 * wordmark/heading hierarchy never drift between them.
 */
export function AuthCard({
  heading,
  subtitle,
  children,
  footer,
}: {
  heading: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-6 sm:py-8">
      <div className="w-full max-w-md space-y-5 rounded-3xl border border-gray-300 bg-white p-6 shadow-sm sm:p-7">
        <div className="text-center">
          <Link href="/" className="inline-flex min-h-8 items-center text-xl font-bold tracking-tight text-indigo-700">WEBG</Link>
          <h1 className="mt-3 text-2xl font-bold">{heading}</h1>
          {subtitle && <p className="mt-1 text-gray-700">{subtitle}</p>}
        </div>
        {children}
        {footer}
      </div>
    </main>
  );
}
