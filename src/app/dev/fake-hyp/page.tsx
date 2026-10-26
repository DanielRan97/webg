import { notFound } from "next/navigation";
import { getGateway } from "@/lib/payments";
import { fakeCheckoutValid, fakeReturnQuery } from "@/lib/payments/fake";

export const dynamic = "force-dynamic";

/**
 * The fake gateway's "payment page" (lib/payments/fake.ts) - development and tests only; a 404 whenever the
 * fake gateway isn't the active one. No card details: just the outcome to simulate.
 */
export default async function FakeHypPage({ searchParams }: PageProps<"/dev/fake-hyp">) {
  if (getGateway()?.name !== "FAKE") notFound();
  const q = await searchParams;
  const one = (k: string) => (typeof q[k] === "string" ? (q[k] as string) : "");
  const [order, amount, desc, sig] = [one("Order"), one("Amount"), one("desc"), one("sig")];
  if (!fakeCheckoutValid(order, amount, sig)) notFound();

  const link = (card: "ok" | "declinelater") => `/api/billing/return?${fakeReturnQuery(order, amount, card)}`;
  return (
    <main className="mx-auto max-w-md space-y-5 px-4 py-12">
      <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">דף תשלום לבדיקה בלבד. זה לא HYP, ושום כסף לא עובר.</p>
      <h1 className="text-2xl font-bold">תשלום ₪{amount}</h1>
      <p className="text-ink-700">{desc}</p>
      <div className="flex flex-col gap-3">
        <a href={link("ok")} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700">
          אישור תשלום
        </a>
        <a href={link("declinelater")} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ink-200 bg-white px-5 font-semibold text-ink-900 hover:bg-ink-50">
          אישור, אבל החיובים הבאים בכרטיס ייכשלו
        </a>
        <a href="/dashboard" className="text-center text-sm text-ink-700 underline">ביטול וחזרה</a>
      </div>
    </main>
  );
}
