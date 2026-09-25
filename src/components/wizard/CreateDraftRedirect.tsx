"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createDraftSiteAction } from "@/server/actions/sites";
import { Button, Notice, Spinner } from "../ui/ui";

/**
 * `/create`'s entire job: start a brand-new draft exactly once and hand off
 * to the real wizard at `/sites/[id]/edit`, which then autosaves into that
 * same row as the owner fills it in. Runs in a client effect (not the
 * server page render) so a hovered/prefetched link can never create a
 * phantom draft before the owner actually opens the page - the same reason
 * the admin inbox's "mark seen" lives in an effect rather than the page.
 */
export function CreateDraftRedirect() {
  const router = useRouter();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const res = await createDraftSiteAction();
        if (!res.ok) {
          setError(res.error);
          return;
        }
        router.replace(`/sites/${res.id}/edit`);
      } catch {
        setError("לא הצלחנו להתחיל אתר חדש. בדקו את החיבור לאינטרנט ונסו שוב.");
      }
    })();
  }, [router]);

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      {error ? (
        <>
          <Notice kind="error">{error}</Notice>
          <Button type="button" onClick={() => window.location.reload()}>נסו שוב</Button>
        </>
      ) : (
        <>
          <Spinner />
          <p className="text-gray-700">מכינים את האתר שלכם...</p>
        </>
      )}
    </main>
  );
}
