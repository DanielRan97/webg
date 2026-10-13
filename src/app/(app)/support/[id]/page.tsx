import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getOwnedTicket } from "@/server/support";
import { SupportThread } from "@/components/SupportThread";

export const metadata: Metadata = { title: "פנייה - תמיכה" };
export const dynamic = "force-dynamic";

export default async function SupportTicketPage({ params, searchParams }: PageProps<"/support/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const ticket = await getOwnedTicket(user.id, id);
  if (!ticket) notFound();

  const sp = await searchParams;
  const justCreated = sp.created === "1";

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link href="/support" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">← תמיכה</Link>
      <SupportThread role="USER" ticket={ticket} justCreated={justCreated} />
    </main>
  );
}
