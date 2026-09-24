"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createSiteAction, updateSiteAction } from "@/server/actions/sites";
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

interface StepDef {
  id: string;
  label: (d: SiteData) => string;
  Component: (p: StepProps) => React.JSX.Element;
  /** Steps for optional sections only appear when that section is switched on. */
  show?: (d: SiteData) => boolean;
  editOnly?: boolean;
}

const STEPS: StepDef[] = [
  { id: "basics", label: () => "פרטי העסק", Component: BasicsStep },
  { id: "branding", label: () => "עיצוב", Component: BrandingStep },
  { id: "hours", label: () => "שעות פתיחה", Component: HoursStep },
  { id: "sections", label: () => "מה יופיע באתר", Component: SectionsStep },
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
  { id: "social", label: () => "יצירת קשר", Component: SocialStep },
  { id: "address", label: () => "כתובת האתר", Component: AddressStep, editOnly: true },
];

const stepHasError = (stepId: string, errors: Record<string, string>) =>
  Object.keys(errors).some((k) => (STEP_ERROR_KEYS[stepId] ?? []).some((p) => k.startsWith(p)));

interface Props {
  initial: SiteData;
  /** Present when editing an existing website. */
  siteId?: string;
  liveUrl?: string | null;
}

export function SiteForm({ initial, siteId, liveUrl }: Props) {
  const router = useRouter();
  const isNew = !siteId;
  const [data, setData] = useState<SiteData>(initial);
  const [stepIndexRaw, setStepIndex] = useState(0);
  // Only ask about the sections the owner actually switched on.
  const steps = useMemo(
    () => STEPS.filter((s) => (!s.editOnly || !isNew) && (!s.show || s.show(data))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isNew, data.sections],
  );
  const stepIndex = Math.min(stepIndexRaw, steps.length - 1);
  const [view, setView] = useState<"form" | "preview">("form");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [errorIsValidation, setErrorIsValidation] = useState(false);
  const [saved, setSaved] = useState(false);
  const [created, setCreated] = useState<{ id: string; slug: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const errors = useMemo(() => validateSite(data, { checkSlug: !isNew }), [data, isNew]);
  const step = steps[stepIndex];
  const last = stepIndex === steps.length - 1;

  const update = (patch: Partial<SiteData>) => {
    setSaved(false);
    setData((d) => ({ ...d, ...patch }));
  };

  function focusFirstInvalid() {
    setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 60);
  }

  function fail(message: string, validation: boolean) {
    setError(message);
    setErrorIsValidation(validation);
  }

  function go(i: number) {
    setError("");
    setSubmitted(false);
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
    startTransition(async () => {
      try {
        const res = isNew ? await createSiteAction(data) : await updateSiteAction(siteId, data);
        if (!res.ok) {
          fail(res.error, false);
          if (!isNew && /כתובת/.test(res.error)) {
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
              <p className="mb-2 text-sm font-semibold text-indigo-800">שלב {stepIndex + 1} מתוך {steps.length}: {step.label(data)}</p>
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
            <step.Component data={data} update={update} isNew={isNew} errors={errors} />
          </div>

          <div className="mt-4 space-y-3" aria-live="polite">
            {error && (!errorIsValidation || Object.keys(errors).length > 0) && <Notice kind="error">{error}</Notice>}
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
