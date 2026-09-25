"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { autosaveSiteAction, checkSlugAvailabilityAction, updateSiteAction } from "@/server/actions/sites";
import { AUTOSAVE_DOMAINS, type AutosaveDomain } from "@/lib/constants";
import { isValidSlug, slugify } from "@/lib/slug-format";
import { STEP_ERROR_KEYS, validateSite } from "@/lib/validate-site";
import type { SiteData } from "@/types/site";
import { Button, Notice, ValidationContext, cx } from "../ui/ui";
import { CreatedScreen } from "./CreatedScreen";
import { PreviewPane } from "./PreviewPane";
import { SectionsStep } from "./SectionsStep";
import {
  AddressStep, BasicsStep, BrandingStep, HoursStep, ImagesStep, ServicesStep, SocialStep,
  type StepProps,
} from "./steps";
import {
  AreasStep, BookingStep, CertificationsStep, DeliveryStep, EducationStep, EmergencyStep, ExperienceStep,
  FaqStep, HighlightsStep, ProjectsStep, SkillsStep, TestimonialsStep,
} from "./steps-content";

const sectionOn = (d: SiteData, type: string) => d.sections.some((s) => s.type === type && s.enabled);

/** Live, debounced slug-availability feedback - see the effect below. Purely informational; the server re-checks on every real save. */
export interface SlugCheck {
  slug: string;
  status: "idle" | "checking" | "available" | "taken" | "invalid";
}

interface StepDef {
  id: string;
  label: (d: SiteData) => string;
  Component: (p: StepProps) => React.JSX.Element;
  /** Steps for optional sections only appear when that section is switched on. */
  show?: (d: SiteData) => boolean;
}

const STEPS: StepDef[] = [
  { id: "basics", label: () => "פרטי העסק", Component: BasicsStep },
  { id: "branding", label: () => "עיצוב", Component: BrandingStep },
  { id: "sections", label: () => "מה יופיע באתר", Component: SectionsStep },
  { id: "hours", label: () => "שעות פתיחה", Component: HoursStep, show: (d) => sectionOn(d, "hours") },
  {
    id: "services",
    label: (d) => (sectionOn(d, "menu") && !sectionOn(d, "services") && !sectionOn(d, "prices") ? "תפריט" : "שירותים ומחירים"),
    Component: ServicesStep,
    show: (d) => sectionOn(d, "services") || sectionOn(d, "prices") || sectionOn(d, "menu"),
  },
  { id: "testimonials", label: () => "המלצות", Component: TestimonialsStep, show: (d) => sectionOn(d, "testimonials") },
  { id: "areas", label: () => "אזורי שירות", Component: AreasStep, show: (d) => sectionOn(d, "areas") },
  { id: "delivery", label: () => "משלוחים", Component: DeliveryStep, show: (d) => sectionOn(d, "delivery") },
  { id: "emergency", label: () => "שירות חירום", Component: EmergencyStep, show: (d) => sectionOn(d, "emergency") },
  { id: "booking", label: () => "קביעת תור", Component: BookingStep, show: (d) => sectionOn(d, "booking") },
  { id: "faq", label: () => "שאלות נפוצות", Component: FaqStep, show: (d) => sectionOn(d, "faq") },
  { id: "highlights", label: () => "למה לבחור בנו", Component: HighlightsStep, show: (d) => sectionOn(d, "highlights") },
  { id: "experience", label: () => "ניסיון תעסוקתי", Component: ExperienceStep, show: (d) => sectionOn(d, "experience") },
  { id: "education", label: () => "השכלה", Component: EducationStep, show: (d) => sectionOn(d, "education") },
  { id: "skills", label: () => "כישורים", Component: SkillsStep, show: (d) => sectionOn(d, "skills") },
  { id: "projects", label: () => "פרויקטים", Component: ProjectsStep, show: (d) => sectionOn(d, "projects") },
  { id: "certifications", label: () => "הסמכות וקורסים", Component: CertificationsStep, show: (d) => sectionOn(d, "certifications") },
  { id: "images", label: () => "תמונות", Component: ImagesStep },
  { id: "address", label: () => "כתובת האתר", Component: AddressStep },
  { id: "social", label: () => "יצירת קשר", Component: SocialStep },
];

const stepHasError = (stepId: string, errors: Record<string, string>) =>
  Object.keys(errors).some((k) => (STEP_ERROR_KEYS[stepId] ?? []).some((p) => k.startsWith(p)));

/**
 * The slice of `SiteData` each autosave domain owns, for change detection.
 * Mirrors exactly which fields each wizard step below edits - see
 * AUTOSAVE_DOMAINS in @/lib/constants for the server-side counterpart.
 */
const DOMAIN_SELECTORS: Record<AutosaveDomain, (d: SiteData) => unknown> = {
  basics: (d) => [d.businessName, d.subtitle, d.category, d.description, d.phone, d.whatsapp, d.email, d.address, d.city],
  branding: (d) => [d.logoUrl, d.primaryColor, d.secondaryColor, d.templateId],
  hours: (d) => [d.hours, d.openSaturday, d.openHolidays],
  sections: (d) => d.sections,
  services: (d) => d.services,
  testimonials: (d) => d.testimonials,
  areas: (d) => d.areas,
  delivery: (d) => d.delivery,
  emergency: (d) => d.emergency,
  booking: (d) => d.booking,
  faq: (d) => d.faq,
  highlights: (d) => d.highlights,
  experience: (d) => d.experience,
  education: (d) => d.education,
  skills: (d) => d.skills,
  projects: (d) => d.projects,
  certifications: (d) => d.certifications,
  images: (d) => [d.heroImageUrl, d.gallery],
  social: (d) => [d.ctaType, d.socials, d.resumeUrl],
  address: (d) => d.slug,
};

/** Which domains differ between two snapshots - only these get written on autosave. */
function diffDomains(a: SiteData, b: SiteData): AutosaveDomain[] {
  const out: AutosaveDomain[] = [];
  for (const domain of AUTOSAVE_DOMAINS) {
    const select = DOMAIN_SELECTORS[domain];
    if (JSON.stringify(select(a)) !== JSON.stringify(select(b))) out.push(domain);
  }
  return out;
}

interface Props {
  initial: SiteData;
  siteId: string;
  /**
   * Non-null while the owner is still walking through the first-time wizard
   * (the step id they were last on) - drives both the linear "step X of Y"
   * UI (vs. the free-edit tab UI) and where autosave resumes from. Pass
   * `null` for an already-finished site.
   */
  wizardStep: string | null;
  /** The site's current plan (BASIC/PRO) - drives the wizard's plan-awareness banner and premium-template gating in the template picker. */
  plan: string;
  liveUrl?: string | null;
}

const AUTOSAVE_DEBOUNCE_MS = 800;

export function SiteForm({ initial, siteId, wizardStep, plan, liveUrl }: Props) {
  const router = useRouter();
  const isNew = wizardStep !== null;
  const [data, setData] = useState<SiteData>(initial);
  // Only ask about the sections the owner actually switched on.
  const steps = useMemo(
    () => STEPS.filter((s) => !s.show || s.show(data)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.sections],
  );
  // Resume on the last step the owner was on, resolved once against the
  // steps available for their current data - if that step no longer exists
  // (e.g. a section it depended on got disabled elsewhere), fall back to
  // the first step rather than breaking.
  const [stepIndexRaw, setStepIndex] = useState(() => {
    if (!wizardStep) return 0;
    const i = steps.findIndex((s) => s.id === wizardStep);
    return i >= 0 ? i : 0;
  });
  const stepIndex = Math.min(stepIndexRaw, steps.length - 1);
  const [view, setView] = useState<"form" | "preview">("form");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [errorIsValidation, setErrorIsValidation] = useState(false);
  const [saved, setSaved] = useState(false);
  const [created, setCreated] = useState<{ id: string; slug: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const errors = useMemo(() => validateSite(data, { checkSlug: true }), [data]);
  const step = steps[stepIndex];
  const last = stepIndex === steps.length - 1;

  const update = (patch: Partial<SiteData>) => {
    setSaved(false);
    setData((d) => ({ ...d, ...patch }));
  };

  // --- Live slug-availability check: purely informational (renders the
  // "✓ הכתובת זמינה" / "✗ תפוסה" line in AddressStep) - the authoritative
  // check happens server-side on every actual save (autosave/updateSiteAction),
  // this only stops an obviously-taken slug from being clicked past. Only the
  // async server round-trip result (`slugResult`) lives in state; "idle" /
  // "invalid" / "checking" are derived below, so the effect never calls
  // setState synchronously - only from its debounced, async callback.
  const [slugResult, setSlugResult] = useState<{ slug: string; available: boolean } | null>(null);
  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current);
    const slug = data.slug.trim().toLowerCase();
    if (!slug || !isValidSlug(slug)) return;
    slugDebounceRef.current = setTimeout(() => {
      checkSlugAvailabilityAction(siteId, slug).then((res) => {
        setSlugResult({ slug, available: res.available });
      });
    }, 400);
    return () => {
      if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current);
    };
  }, [data.slug, siteId]);

  const slugCheck: SlugCheck = useMemo(() => {
    const slug = data.slug.trim().toLowerCase();
    if (!slug) return { slug, status: "idle" };
    if (!isValidSlug(slug)) return { slug, status: "invalid" };
    if (slugResult?.slug !== slug) return { slug, status: "checking" };
    return { slug, status: slugResult.available ? "available" : "taken" };
  }, [data.slug, slugResult]);

  // --- Suggest a slug from the business name while the owner hasn't picked
  // their own yet. Adjusted during render, not in an effect (React's own
  // recommended pattern for "derive this piece of state from that one" -
  // avoids an extra render pass, and is idempotent by construction: once
  // `data.slug` matches the suggestion, `suggested === data.slug` and this
  // becomes a no-op). `autoSlug` tracks "the slug value we last suggested"
  // (seeded once from the server-assigned placeholder) and lives here, not
  // in AddressStep, so it survives navigating between wizard steps -
  // AddressStep itself remounts every time the owner leaves and returns to
  // it. The moment the owner types their own value, `data.slug` no longer
  // matches `autoSlug` and this stops touching it for good - it never
  // overwrites an already-valid chosen slug.
  const [autoSlug, setAutoSlug] = useState<string | null>(() => (isNew ? initial.slug : null));
  if (isNew && data.slug === autoSlug) {
    const suggested = slugify(data.businessName);
    if (suggested && suggested !== data.slug) {
      setAutoSlug(suggested);
      update({ slug: suggested });
    }
  }

  // --- Autosave: persists the draft in the background as the owner types/
  // toggles, so a refresh, closed tab or lost connection never loses
  // progress. Only runs while still mid-wizard - once the site has been
  // through one deliberate, validated save (updateSiteAction), `wizardStep`
  // is cleared and this component stops autosaving; free-edit mode keeps
  // its existing explicit "שמירת שינויים" button instead.
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [autosaveError, setAutosaveError] = useState("");
  const dataRef = useRef(data);
  const stepsRef = useRef(steps);
  const stepIndexRef = useRef(stepIndex);
  const inFlightRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const autosaveRef = useRef<(explicitStepId?: string) => void>(() => {});
  // What we last successfully persisted - autosave only ever sends the
  // domains that differ from this, and only advances it past a *successful*
  // save, so a failed request never makes a later save think something was
  // already saved when it wasn't.
  const lastSavedRef = useRef(initial);
  const lastSavedStepRef = useRef(wizardStep);

  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { stepsRef.current = steps; }, [steps]);
  useEffect(() => { stepIndexRef.current = stepIndex; }, [stepIndex]);

  const autosave = useCallback((explicitStepId?: string) => {
    if (!isNew) return;
    if (inFlightRef.current) {
      pendingSaveRef.current = true;
      return;
    }
    const snapshot = dataRef.current;
    const domains = diffDomains(lastSavedRef.current, snapshot);
    const stepId = explicitStepId ?? stepsRef.current[stepIndexRef.current]?.id ?? null;
    const stepChanged = stepId !== lastSavedStepRef.current;
    // Nothing actually differs from what's already saved - skip the request
    // entirely instead of sending an empty no-op autosave.
    if (domains.length === 0 && !stepChanged) return;

    inFlightRef.current = true;
    setAutosaveStatus("saving");
    autosaveSiteAction(siteId, snapshot, domains, stepChanged ? stepId : undefined)
      .then((res) => {
        if (res.ok) {
          lastSavedRef.current = snapshot;
          if (stepChanged) lastSavedStepRef.current = stepId;
          setAutosaveStatus("saved");
          setAutosaveError("");
        } else {
          setAutosaveStatus("error");
          setAutosaveError(res.error ?? "לא הצלחנו לשמור את השינויים. בדקו את החיבור ונסו שוב.");
        }
      })
      .catch(() => {
        setAutosaveStatus("error");
        setAutosaveError("לא הצלחנו לשמור את השינויים. בדקו את החיבור ונסו שוב.");
      })
      .finally(() => {
        inFlightRef.current = false;
        if (pendingSaveRef.current) {
          pendingSaveRef.current = false;
          autosaveRef.current();
        }
      });
  }, [isNew, siteId]);

  useEffect(() => { autosaveRef.current = autosave; }, [autosave]);

  // Debounced autosave on every data change (skips the very first render).
  useEffect(() => {
    if (!isNew) return;
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => autosave(), AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isNew]);

  // Flush any pending debounced save as soon as the tab is hidden/closed -
  // this shrinks the loss window to a fraction of a second, but (like any
  // async write) cannot make the save land before a hard browser kill.
  useEffect(() => {
    if (!isNew) return;
    function flush() {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      autosave();
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") flush();
    }
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isNew, autosave]);

  function focusFirstInvalid() {
    setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 60);
  }

  function fail(message: string, validation: boolean) {
    setError(message);
    setErrorIsValidation(validation);
  }

  /** Blocks leaving/finishing the address step while the live availability check hasn't confirmed the slug is usable. */
  function slugBlockMessage(stepId: string): string | null {
    if (stepId !== "address") return null;
    if (slugCheck.status === "checking") return "בודקים את זמינות הכתובת... רגע בבקשה.";
    if (slugCheck.status === "taken") return "הכתובת הזו כבר תפוסה. בחרו כתובת אחרת.";
    if (slugCheck.status === "invalid") return "הכתובת לא תקינה. אפשר להשתמש באותיות באנגלית, מספרים ומקפים בלבד.";
    return null;
  }

  function go(i: number) {
    setError("");
    setSubmitted(false);
    if (isNew && steps[i]) {
      // Moving between steps is a discrete, meaningful checkpoint - save it
      // immediately instead of waiting for the debounce, so the resumed
      // step is always the one the owner actually last saw.
      if (debounceRef.current) clearTimeout(debounceRef.current);
      autosave(steps[i].id);
    }
    setStepIndex(i);
    window.scrollTo({ top: 0 });
    // Move keyboard / screen-reader focus to the new step's heading.
    setTimeout(() => document.getElementById("step-title")?.focus(), 60);
  }

  function next() {
    if (stepHasError(step.id, errors)) {
      setSubmitted(true);
      fail("יש כמה פרטים לתקן לפני שממשיכים. הם מסומנים למעלה.", true);
      focusFirstInvalid();
      return;
    }
    const slugMsg = slugBlockMessage(step.id);
    if (slugMsg) {
      setSubmitted(true);
      fail(slugMsg, true);
      focusFirstInvalid();
      return;
    }
    go(stepIndex + 1);
  }

  function save() {
    setError("");
    const bad = steps.findIndex((s) => stepHasError(s.id, errors));
    if (bad >= 0) {
      if (bad !== stepIndex) setStepIndex(bad);
      setSubmitted(true);
      fail(`יש פרטים לתקן בשלב ״${steps[bad].label(data)}״ לפני שמסיימים.`, true);
      focusFirstInvalid();
      return;
    }
    const addressIdx = steps.findIndex((s) => s.id === "address");
    const slugMsg = addressIdx >= 0 ? slugBlockMessage("address") : null;
    if (slugMsg) {
      setStepIndex(addressIdx);
      setSubmitted(true);
      fail(slugMsg, true);
      focusFirstInvalid();
      return;
    }
    startTransition(async () => {
      try {
        const res = await updateSiteAction(siteId, data);
        if (!res.ok) {
          fail(res.error, false);
          if (/כתובת/.test(res.error)) {
            const i = steps.findIndex((s) => s.id === "address");
            if (i >= 0) setStepIndex(i);
          }
          return;
        }
        if (isNew) {
          setCreated({ id: res.id, slug: res.slug });
          window.scrollTo({ top: 0 });
        } else {
          setData((d) => ({ ...d, slug: res.slug }));
          setSaved(true);
          router.refresh();
        }
      } catch {
        fail("לא הצלחנו לשמור. בדקו את החיבור לאינטרנט ונסו שוב. המידע שמילאתם עדיין כאן.", false);
      }
    });
  }

  if (created) return <CreatedScreen id={created.id} slug={created.slug} businessName={data.businessName} />;

  return (
    <ValidationContext.Provider value={{ submitted }}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Mobile: switch between form and preview */}
        <div className="flex rounded-xl bg-gray-100 p-1 lg:hidden">
          {(["form", "preview"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={cx("min-h-12 flex-1 rounded-lg font-semibold", view === v ? "bg-white shadow" : "text-gray-700")}>
              {v === "form" ? "הטופס" : "תצוגה מקדימה"}
            </button>
          ))}
        </div>

        <div className={cx(view === "form" ? "" : "hidden", "lg:block")}>
          {isNew ? (
            <div className="mb-6">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <p className="text-sm font-semibold text-indigo-800">שלב {stepIndex + 1} מתוך {steps.length}: {step.label(data)}</p>
                <p aria-live="polite" className={cx("text-sm", autosaveStatus === "error" ? "font-medium text-red-700" : "text-gray-500")}>
                  {autosaveStatus === "saving" && "שומר..."}
                  {autosaveStatus === "saved" && "נשמר"}
                  {autosaveStatus === "error" && (autosaveError || "לא הצלחנו לשמור את השינויים. בדקו את החיבור ונסו שוב.")}
                </p>
              </div>
              <div role="progressbar" aria-label="התקדמות" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={stepIndex + 1} className="h-2 rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-indigo-700 transition-all" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
              </div>
            </div>
          ) : (
            <nav aria-label="חלקי העריכה" className="mb-6 flex flex-wrap gap-2">
              {steps.map((s, i) => (
                <button key={s.id} type="button" onClick={() => go(i)} aria-current={i === stepIndex ? "step" : undefined} className={cx("min-h-11 rounded-full px-4 text-sm font-semibold", i === stepIndex ? "bg-indigo-700 text-white" : "bg-gray-100 text-gray-900 hover:bg-gray-200")}>
                  {s.label(data)}
                  {stepHasError(s.id, errors) && <span aria-label="יש פרטים לתקן"> ⚠</span>}
                </button>
              ))}
            </nav>
          )}

          <div className="rounded-3xl border border-gray-300 bg-white p-5 shadow-sm sm:p-8">
            <step.Component data={data} update={update} isNew={isNew} errors={errors} plan={plan} slugCheck={slugCheck} />
          </div>

          <div className="mt-4 space-y-3" aria-live="polite">
            {error && (!errorIsValidation || Object.keys(errors).length > 0 || slugBlockMessage(step.id)) && <Notice kind="error">{error}</Notice>}
            {saved && <Notice kind="success">השינויים נשמרו. אם האתר מפורסם, הם כבר מופיעים בו.</Notice>}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {isNew ? (
              <>
                <Button type="button" variant="secondary" disabled={stepIndex === 0 || pending} onClick={() => go(stepIndex - 1)}>חזרה</Button>
                {last ? (
                  <Button type="button" onClick={save} loading={pending}>{pending ? "יוצרים את האתר..." : "צור את האתר"}</Button>
                ) : (
                  <Button type="button" onClick={next}>המשך</Button>
                )}
              </>
            ) : (
              <>
                <Button type="button" onClick={save} loading={pending}>{pending ? "שומר..." : "שמירת שינויים"}</Button>
                {liveUrl && (
                  <Link href={liveUrl} target="_blank" className="inline-flex min-h-11 items-center font-semibold text-indigo-800 underline">
                    צפייה באתר החי
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        <aside aria-label="תצוגה מקדימה" className={cx(view === "preview" ? "" : "hidden", "lg:block")}>
          <div className="lg:sticky lg:top-24">
            <p className="mb-3 text-center text-sm font-semibold text-gray-700">כך האתר ייראה בטלפון</p>
            <PreviewPane data={data} />
          </div>
        </aside>
      </div>
    </ValidationContext.Provider>
  );
}
