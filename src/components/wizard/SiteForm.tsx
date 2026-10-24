"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { autosaveSiteAction, checkSlugAvailabilityAction, updateSiteAction } from "@/server/actions/sites";
import { PublishButton } from "../PlanChoice";
import { ContactVerifyContext, useContactVerifyState } from "./ContactVerify";
import { AUTOSAVE_DOMAINS, menuStepLabel, type AutosaveDomain } from "@/lib/constants";
import { isValidSlug, slugify } from "@/lib/slug-format";
import { publicSiteUrlDisplay } from "@/lib/site-url";
import { needsProToPublish } from "@/lib/plan";
import { ComingNext } from "../ComingNext";
import { STEP_ERROR_KEYS, validateSite } from "@/lib/validate-site";
import type { SiteData } from "@/types/site";
import { Button, Notice, StepNoteContext, ValidationContext, cx } from "../ui/ui";
import { PreviewPane } from "./PreviewPane";
import { PREVIEW_SCROLL_EVENT } from "./preview-scroll";
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

/**
 * Shown under each wizard step's title (new sites only), so owners never feel a choice is final:
 * what the preview is, and what they can still change later. Steps without an entry get CONTENT_NOTE.
 */
const STEP_NOTES: Partial<Record<string, string>> = {
  basics: "העיצוב שבתצוגה הוא רק דוגמה לפי סוג העסק, וכרגע רואים בעיקר את ראש האתר. בשלבים הבאים תבחרו צבעים ועיצוב ותוסיפו שירותים, תמונות ועוד. את כל מה שכאן אפשר לשנות בכל רגע, גם אחרי שהאתר באוויר.",
  branding: "שום בחירה כאן אינה סופית. אפשר להחליף צבעים, לוגו ותבנית בכל רגע, גם אחרי הפרסום, והתוכן שכתבתם נשמר.",
  sections: "אפשר להדליק, לכבות ולסדר את החלקים גם אחר כך. חלק שתכבו לא יופיע באתר, והמידע שבו נשמר.",
  images: "אין עכשיו תמונה טובה? אפשר להמשיך בלי, ולהוסיף או להחליף תמונות בכל רגע.",
  address: "אפשר לשנות את הכתובת גם אחר כך. אם כבר שיתפתם אותה עם לקוחות, כדאי לבחור כתובת סופית לפני הפרסום.",
  social: "לחיצה על ״צור את האתר״ עדיין לא מפרסמת אותו. קודם תראו את האתר, ותפרסמו רק כשתחליטו.",
};
const CONTENT_NOTE = "לא חייבים להשלים הכול עכשיו. אפשר להוסיף, לערוך ולמחוק את זה גם אחרי שהאתר באוויר.";

const STEPS: StepDef[] = [
  { id: "basics", label: () => "פרטי העסק", Component: BasicsStep },
  { id: "branding", label: () => "עיצוב", Component: BrandingStep },
  { id: "sections", label: () => "מה יופיע באתר", Component: SectionsStep },
  { id: "hours", label: () => "שעות פתיחה", Component: HoursStep, show: (d) => sectionOn(d, "hours") },
  {
    id: "services",
    label: (d) => (sectionOn(d, "menu") && !sectionOn(d, "services") && !sectionOn(d, "prices") ? menuStepLabel(d.itemKind) : "שירותים ומחירים"),
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
  { id: "images", label: (d) => (sectionOn(d, "gallery") ? "תמונות" : "תמונה ראשית"), Component: ImagesStep },
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
  branding: (d) => [d.logoUrl, d.primaryColor, d.secondaryColor, d.templateId, d.navLayout],
  hours: (d) => [d.hours, d.holidayHours, d.openSaturday, d.openHolidays],
  sections: (d) => d.sections,
  services: (d) => [d.services, d.itemKind],
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
  /** The site is published (whatever its subscription state) - a live Basic site can't save a Pro template. */
  published?: boolean;
  /** Edit mode only: open this tab (a step id, e.g. "branding") instead of the first one. */
  initialTab?: string;
  /** Contact details already verified for this site ("EMAIL:x" / "PHONE:05..."), see ContactVerify. */
  verifiedContacts?: string[];
  /** Whether phone numbers can be verified (an SMS service is available). */
  phoneVerification?: boolean;
}

const AUTOSAVE_DEBOUNCE_MS = 800;

export function SiteForm({ initial, siteId, wizardStep, plan, liveUrl, published = false, initialTab, verifiedContacts = [], phoneVerification = false }: Props) {
  const contactVerify = useContactVerifyState(siteId, verifiedContacts, phoneVerification);
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
    const target = wizardStep ?? initialTab;
    if (!target) return 0;
    const i = steps.findIndex((s) => s.id === target);
    return i >= 0 ? i : 0;
  });
  // A link to this same page with a different ?tab= (e.g. "בחירת עיצוב רגיל" in the header) keeps this
  // component mounted, so follow the prop when it changes instead of only reading it once.
  const [seenTab, setSeenTab] = useState(initialTab);
  if (!wizardStep && initialTab !== seenTab) {
    setSeenTab(initialTab);
    const i = initialTab ? steps.findIndex((s) => s.id === initialTab) : -1;
    if (i >= 0) setStepIndex(i);
  }
  const stepIndex = Math.min(stepIndexRaw, steps.length - 1);
  const [view, setView] = useState<"form" | "preview">("form");
  // On small screens the preview is behind the form/preview switch: "show in preview" flips to it.
  useEffect(() => {
    const onShow = () => {
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        setView("preview");
        setTimeout(() => document.querySelector("aside[aria-label=\"תצוגה מקדימה\"]")?.scrollIntoView({ block: "start" }), 0);
      }
    };
    window.addEventListener(PREVIEW_SCROLL_EVENT, onShow);
    return () => window.removeEventListener(PREVIEW_SCROLL_EVENT, onShow);
  }, []);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [errorIsValidation, setErrorIsValidation] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishedNow, setPublishedNow] = useState(false);
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

  // Phones scroll the step list sideways: keep the current step in view.
  useEffect(() => {
    if (!isNew) return;
    const chip = document.querySelector<HTMLElement>('nav[aria-label="שלבי הטופס"] [aria-current="step"]');
    const list = chip?.closest("ol");
    if (chip && list && list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: chip.offsetLeft - list.clientWidth / 2 + chip.offsetWidth / 2, behavior: "smooth" });
    }
  }, [stepIndex, isNew]);

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

  /** Saves the whole site. `afterSave` (edit mode): runs after a successful save - "שמירה ופרסום" opens the publish dialog with it. */
  /**
   * The wizard's step list: back to any step freely; forward too, as long as every step on the way
   * is fine - otherwise it stops on the first one that needs fixing, with its problems shown.
   */
  function jump(target: number) {
    if (target === stepIndex) return;
    if (target < stepIndex) {
      go(target);
      return;
    }
    for (let i = stepIndex; i < target; i++) {
      const id = steps[i].id;
      const slugMsg = slugBlockMessage(id);
      if (stepHasError(id, errors) || slugMsg) {
        if (i !== stepIndex) go(i);
        setTimeout(() => {
          setSubmitted(true);
          fail(slugMsg ?? `יש כמה פרטים לתקן בשלב ״${steps[i].label(data)}״ לפני שממשיכים. הם מסומנים למעלה.`, true);
          focusFirstInvalid();
        }, 0);
        return;
      }
    }
    go(target);
  }

  function save(opts?: { afterSave?: () => void }) {
    setError("");
    setPublishedNow(false);
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
          // Its own route, so the server refresh that follows this save can't wipe it (see created/page.tsx).
          router.push(`/sites/${res.id}/created`);
        } else {
          setData((d) => ({ ...d, slug: res.slug }));
          if (opts?.afterSave) opts.afterSave();
          else setSaved(true);
          router.refresh();
        }
      } catch {
        fail("לא הצלחנו לשמור. בדקו את החיבור לאינטרנט ונסו שוב. המידע שמילאתם עדיין כאן.", false);
      }
    });
  }


  return (
    <ValidationContext.Provider value={{ submitted }}>
      <ContactVerifyContext.Provider value={contactVerify}>
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Mobile: switch between form and preview */}
          <div className="flex rounded-lg bg-ink-50 p-1 lg:hidden">
            {(["form", "preview"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={cx("min-h-12 flex-1 rounded-lg font-semibold", view === v ? "bg-white shadow" : "text-ink-700")}>
                {v === "form" ? "הטופס" : "תצוגה מקדימה"}
              </button>
            ))}
          </div>
  
          <div className={cx(view === "form" ? "" : "hidden", "lg:block")}>
            {isNew ? (
              <div className="mb-6">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <p className="text-sm font-semibold text-ink-800">שלב {stepIndex + 1} מתוך {steps.length}: {step.label(data)}</p>
                  <p aria-live="polite" className={cx("text-sm", autosaveStatus === "error" ? "font-medium text-red-700" : "text-ink-500")}>
                    {autosaveStatus === "saving" && "שומר..."}
                    {autosaveStatus === "saved" && "נשמר"}
                    {autosaveStatus === "error" && (autosaveError || "לא הצלחנו לשמור את השינויים. בדקו את החיבור ונסו שוב.")}
                  </p>
                </div>
                <div role="progressbar" aria-label="התקדמות" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={stepIndex + 1} className="h-2 rounded-full bg-ink-100">
                  <div className="h-2 rounded-full bg-linear-to-l from-brand-600 to-cyan-400 shadow-[0_0_12px_rgb(34_184_207/0.45)] transition-[width] duration-500 ease-out" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
                </div>
                <nav aria-label="שלבי הטופס" className="mt-3">
                  <p className="mb-1.5 text-xs text-ink-500">אפשר לעבור לכל שלב בלחיצה, אחורה או קדימה.</p>
                  <ol className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible">
                    {steps.map((s, i) => {
                      const done = i < stepIndex;
                      const current = i === stepIndex;
                      return (
                        <li key={s.id} className="shrink-0">
                          <button
                            type="button"
                            onClick={() => jump(i)}
                            aria-current={current ? "step" : undefined}
                            className={cx(
                              "flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition",
                              current ? "border-brand-600 bg-brand-600 text-white" : done ? "border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100" : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
                            )}
                          >
                            <span aria-hidden className="tabular-nums">{done ? "✓" : i + 1}</span>
                            {s.label(data)}
                            {stepHasError(s.id, errors) && i < stepIndex && <span className="sr-only"> (יש פרטים לתקן)</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </nav>
              </div>
            ) : (
              <nav aria-label="חלקי העריכה" className="mb-6 flex flex-wrap gap-2">
                {steps.map((s, i) => (
                  <button key={s.id} type="button" onClick={() => go(i)} aria-current={i === stepIndex ? "step" : undefined} className={cx("min-h-11 rounded-full px-4 text-sm font-semibold", i === stepIndex ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-900 hover:bg-ink-100")}>
                    {s.label(data)}
                    {stepHasError(s.id, errors) && <span aria-label="יש פרטים לתקן"> ⚠</span>}
                  </button>
                ))}
              </nav>
            )}
  
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-8">
              <StepNoteContext.Provider value={isNew ? (STEP_NOTES[step.id] ?? CONTENT_NOTE) : null}>
                {/* Keyed by step, so each step eases in as the owner moves through the wizard. */}
                <div key={step.id} className="webg-step-in">
                  <step.Component data={data} update={update} isNew={isNew} errors={errors} plan={plan} slugCheck={slugCheck} live={published} />
                </div>
              </StepNoteContext.Provider>
            </div>
  
            <div className="mt-4 space-y-3" aria-live="polite">
              {error && (!errorIsValidation || Object.keys(errors).length > 0 || slugBlockMessage(step.id)) && <Notice kind="error">{error}</Notice>}
              {saved && <Notice kind="success">{published ? "השינויים נשמרו, והם כבר מופיעים באתר." : "השינויים נשמרו. האתר עדיין טיוטה, ולקוחות יראו אותו אחרי הפרסום."}</Notice>}
              {publishedNow && <Notice kind="success">האתר נשמר ופורסם! מעכשיו הלקוחות יכולים לראות אותו.</Notice>}
            </div>
  
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              {isNew ? (
                <>
                  <Button type="button" variant="secondary" disabled={stepIndex === 0 || pending} onClick={() => go(stepIndex - 1)}>חזרה</Button>
                  {last ? (
                    <Button type="button" onClick={() => save()} loading={pending}>{pending ? "יוצרים את האתר..." : "צור את האתר"}</Button>
                  ) : (
                    <Button type="button" onClick={next}>המשך</Button>
                  )}
                </>
              ) : (
                <>
                  {/* A draft can go live right from here: save, then choose the plan and publish in the dialog. */}
                  {!published && (
                    <PublishButton
                      siteId={siteId}
                      slug={data.slug}
                      plan={plan}
                      templateId={data.templateId}
                      onPublished={() => setPublishedNow(true)}
                      trigger={(open) => (
                        <Button type="button" onClick={() => save({ afterSave: open })} loading={pending}>{pending ? "שומר..." : "שמירה ופרסום"}</Button>
                      )}
                    />
                  )}
                  <Button type="button" variant={published ? "primary" : "secondary"} onClick={() => save()} loading={pending}>{pending ? "שומר..." : "שמירת שינויים"}</Button>
                  {liveUrl && (
                    <Link href={liveUrl} target="_blank" className="inline-flex min-h-11 items-center font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">
                      צפייה באתר החי
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
  
          <aside aria-label="תצוגה מקדימה" className={cx(view === "preview" ? "" : "hidden", "scroll-mt-20 lg:block")}>
            <div className="lg:sticky lg:top-24">
              <p className="text-center text-sm font-semibold text-ink-700">כך האתר ייראה בטלפון</p>
              <p className="mb-3 text-center text-xs text-ink-500">{isNew ? "תצוגה מקדימה בלבד. שום דבר לא מתפרסם עד שתלחצו על ״פרסום״." : "התצוגה מתעדכנת תוך כדי עריכה."}</p>
              {needsProToPublish({ plan, templateId: data.templateId }) && (
                <p className="mb-3 text-center text-xs font-semibold text-brand-700">
                  <span className="me-1.5 rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">Pro</span>
                  התצוגה בעיצוב של מסלול Pro
                </p>
              )}
              {isNew && step.id === "basics" && (
                <div className="mb-3">
                  <ComingNext />
                </div>
              )}
              <PreviewPane newWindow data={data} address={publicSiteUrlDisplay({ slug: (isNew && !data.businessName.trim()) || !data.slug ? "your-business" : data.slug, plan })} />
              <p className="mt-3 text-center text-xs text-ink-500">מסגרת הטלפון ושורת הכתובת הן רק חלק מהתצוגה. באתר עצמו הלקוחות יראו רק את האתר שלכם.</p>
            </div>
          </aside>
        </div>
      </ContactVerifyContext.Provider>
    </ValidationContext.Provider>
  );
}
