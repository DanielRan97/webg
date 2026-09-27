import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listOwnedWebsitesForPicker } from "@/server/support";
import { NewSupportTicketForm } from "@/components/NewSupportTicketForm";

export const metadata: Metadata = { title: "פנייה חדשה - תמיכה" };
export const dynamic = "force-dynamic";

export default async function NewSupportTicketPage() {
  const user = await requireUser();
  const websites = await listOwnedWebsitesForPicker(user.id);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <Link href="/support" className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-800 underline">← תמיכה</Link>
        <h1 className="text-2xl font-extrabold">פנייה חדשה</h1>
      </div>
      <NewSupportTicketForm websites={websites} />
    </main>
  );
}
