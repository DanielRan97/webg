"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTicketAction } from "@/server/actions/support";
import { SUPPORT_CATEGORY, SUPPORT_CATEGORY_LABELS, type SupportCategory } from "@/lib/constants";
import { ChoiceCard, Notice, TextArea, TextField, Button } from "./ui/ui";

const CATEGORIES = Object.keys(SUPPORT_CATEGORY) as SupportCategory[];

export function NewSupportTicketForm({ websites }: { websites: { id: string; businessName: string }[] }) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [category, setCategory] = useState<SupportCategory>("QUESTION");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [relatedWebsiteId, setRelatedWebsiteId] = useState("");
  const [error, setError] = useState("");

  function submit() {
    setError("");
    start(async () => {
      const res = await createTicketAction({ category, subject, message, relatedWebsiteId: relatedWebsiteId || null });
      if (!res.ok || !res.id) {
        setError(res.error ?? "משהו השתבש. נסו שוב.");
        return;
      }
      router.push(`/support/${res.id}?created=1`);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5"
    >
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-900">קטגוריה</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <ChoiceCard key={c} selected={category === c} onClick={() => setCategory(c)}>
              {SUPPORT_CATEGORY_LABELS[c]}
            </ChoiceCard>
          ))}
        </div>
      </div>

      <TextField label="נושא" required value={subject} onChange={setSubject} placeholder="לדוגמה: לא מצליח להעלות תמונה" maxLength={150} />
      <TextArea label="הודעה" value={message} onChange={setMessage} rows={6} placeholder="ספרו לנו מה קורה - ככל שיהיה יותר מפורט, כך נוכל לעזור מהר יותר." />

      {websites.length > 0 && (
        <div className="space-y-1.5">
          <label htmlFor="related-site" className="block text-sm font-semibold text-gray-900">
            באיזה אתר מדובר? <span className="font-normal text-gray-600">(אופציונלי)</span>
          </label>
          <select
            id="related-site"
            value={relatedWebsiteId}
            onChange={(e) => setRelatedWebsiteId(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-gray-400 bg-white px-4 text-base outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">לא קשור לאתר מסוים</option>
            {websites.map((w) => (
              <option key={w.id} value={w.id}>{w.businessName}</option>
            ))}
          </select>
        </div>
      )}

      {error && <Notice kind="error">{error}</Notice>}

      <Button type="submit" loading={isPending} className="w-full">שליחת הפנייה</Button>
    </form>
  );
}
