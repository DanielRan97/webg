import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetTicket } from "@/server/support";
import { SupportThread } from "@/components/SupportThread";
import { TicketStatusControl } from "@/components/admin/TicketStatusControl";

export const metadata: Metadata = { title: "פנייה - WEBG Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSupportTicketPage({ params }: PageProps<"/admin/support/[id]">) {
  const { id } = await params;
  const ticket = await adminGetTicket(id);
  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/admin/support" className="inline-flex min-h-11 items-center text-sm font-semibold text-ink-700 underline">← כל הפניות</Link>
      <TicketStatusControl ticketId={ticket.id} status={ticket.status} />
      <SupportThread role="ADMIN" ticket={ticket} />
    </div>
  );
}
