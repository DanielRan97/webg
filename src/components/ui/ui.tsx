"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { InfoIcon, UploadIcon } from "../icons";

import { cx } from "@/lib/cx";
export { cx };

/** Tells fields to show their errors even if the user has not touched them yet (after pressing "continue"/"save"). */
export const ValidationContext = createContext({ submitted: false });

export function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export function Button({
  variant = "primary",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
}) {
  const styles = {
    primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-[0_8px_20px_-8px_rgb(21_70_209/0.55)]",
    secondary: "bg-white text-ink-900 border border-ink-200 shadow-sm hover:border-ink-300 hover:bg-ink-50",
    ghost: "text-ink-800 hover:bg-ink-50",
    danger: "bg-white text-red-700 border border-red-300 hover:bg-red-50",
  }[variant];
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
        styles,
        className,
      )}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

/** One short message after an action. Icon + text, so it never relies on color alone. */
export function Notice({ kind, children }: { kind: "success" | "error" | "info"; children: ReactNode }) {
  const look = {
    success: { cls: "bg-green-50 text-green-900 border-green-300", icon: "✓" },
    error: { cls: "bg-red-50 text-red-900 border-red-300", icon: "⚠" },
    info: { cls: "bg-ink-50 text-ink-900 border-ink-200", icon: "ℹ" },
  }[kind];
  return (
    <p role={kind === "error" ? "alert" : "status"} className={cx("flex gap-2 rounded-lg border p-3 text-sm font-medium", look.cls)}>
      <span aria-hidden className="font-bold">{look.icon}</span>
      <span>{children}</span>
    </p>
  );
}

/**
 * "Signal" text field: a soft filled surface whose bottom edge is a solid line (ink-400, enough contrast
 * to read as a field boundary). On focus the surface tints blue and that line is redrawn as a cyan-to-blue
 * gradient sweeping in from the start edge - a background on the input itself, so no wrapper is needed.
 */
export const inputClass =
  "min-h-12 w-full rounded-xl border border-ink-200 border-b-2 border-b-ink-400 bg-ink-50 bg-no-repeat px-4 text-base text-ink-900 outline-none transition-[background-color,background-size,border-color] duration-500 ease-out placeholder:text-ink-400 [background-image:linear-gradient(90deg,#22b8cf,#1546d1)] [background-origin:border-box] [background-position:100%_100%] [background-size:0%_2px] hover:bg-ink-100 focus:border-b-transparent focus:bg-brand-50 focus:[background-size:100%_2px] focus-visible:outline-none aria-[invalid=true]:border-b-red-600 aria-[invalid=true]:bg-red-50";

interface ControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  onBlur: () => void;
}

/** Label is always visible (never a placeholder). Hint sits under it; the error appears inline once the field is touched. */
export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: ControlProps) => ReactNode;
}) {
  const id = useId();
  const { submitted } = useContext(ValidationContext);
  const [touched, setTouched] = useState(false);
  const showError = Boolean(error) && (touched || submitted);
  const describedBy = [hint && `${id}-hint`, showError && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-ink-900">
        {label}
        {required && <span className="ms-1 font-normal text-ink-700">(חובה)</span>}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": showError || undefined, onBlur: () => setTouched(true) })}
      {hint && <p id={`${id}-hint`} className="text-sm text-ink-500">{hint}</p>}
      {showError && (
        <p id={`${id}-err`} role="alert" className="flex gap-1.5 text-sm font-medium text-red-700">
          <span aria-hidden>⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  required,
  value,
  onChange,
  ...rest
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {(p) => {
        const ok = required && !error && value.trim().length >= 2;
        return (
          <div className="relative">
            <input {...p} value={value} onChange={(e) => onChange(e.target.value)} className={cx(inputClass, required && "pe-11")} {...rest} />
            {ok && (
              <span aria-hidden className="webg-pop pointer-events-none absolute end-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">✓</span>
            )}
          </div>
        );
      }}
    </Field>
  );
}

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c7 0 10.5 7 10.5 7a13.6 13.6 0 0 1-3.1 3.9M6.6 6.6C3.4 8.6 1.5 12 1.5 12s3.5 7 10.5 7a10.4 10.4 0 0 0 5.4-1.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

/** A password field with a show/hide toggle. Same Field/inputClass foundation as TextField, so it looks and behaves identically otherwise. */
export function PasswordField({
  label,
  hint,
  error,
  required,
  value,
  onChange,
  name,
  autoComplete,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  name: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  // Same visual result as `inputClass`, just with room on the end side for the toggle button.
  const fieldClass = inputClass.replace("px-4", "ps-4 pe-12");
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {(p) => (
        <div dir="ltr" className="relative">
          <input
            {...p}
            name={name}
            type={visible ? "text" : "password"}
            dir="ltr"
            autoComplete={autoComplete}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={fieldClass}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "הסתרת הסיסמה" : "הצגת הסיסמה"}
            className="absolute end-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-ink-500 transition hover:text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      )}
    </Field>
  );
}

export function TextArea({
  label,
  hint,
  error,
  value,
  onChange,
  rows = 4,
  ...rest
}: {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(p) => (
        <textarea {...p} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={cx(inputClass, "py-3")} {...rest} />
      )}
    </Field>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  labelClassName,
  hint,
  disabled,
  onText,
  offText,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  /** Override the visible label's styling (e.g. "sr-only" when the name is already shown elsewhere in the card). Accessible name is unaffected. */
  labelClassName?: string;
  hint?: string;
  disabled?: boolean;
  /** Optional visible words next to the switch, so state is never shown by color alone. */
  onText?: string;
  offText?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full items-center justify-between gap-4 rounded-lg text-start disabled:opacity-60"
    >
      <span>
        <span className={labelClassName ?? "block font-semibold text-ink-900"}>{label}</span>
        {hint && <span className="block text-sm text-ink-500">{hint}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {(onText || offText) && <span className="text-sm font-semibold text-ink-800">{checked ? onText : offText}</span>}
        <span className={cx("webg-switch relative h-7 w-12 rounded-full transition-colors duration-300", checked ? "bg-brand-600" : "bg-ink-400")}>
          <span
            className={cx(
              "absolute top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold shadow transition-all",
              checked ? "start-6 text-brand-600" : "start-1 text-transparent",
            )}
          >
            ✓
          </span>
        </span>
      </span>
    </button>
  );
}

/** Big selectable card used for categories, templates and call-to-action choices. */
export function ChoiceCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        "relative flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center font-semibold transition duration-200 hover:-translate-y-0.5 active:translate-y-0",
        selected
          ? "border-brand-600 bg-brand-50 text-ink-900 shadow-[0_12px_28px_-16px_rgb(21_70_209/0.65)] ring-2 ring-brand-600/25"
          : "border-ink-200 bg-white text-ink-900 hover:border-ink-400 hover:shadow-md",
      )}
    >
      {selected && <span aria-hidden className="webg-pop absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs text-white">✓</span>}
      {children}
    </button>
  );
}

/** What a phone may hand over: photos from new phones are often 5-15MB. */
const MAX_ORIGINAL_BYTES = 30 * 1024 * 1024;
/** What is actually sent: Vercel refuses request bodies over 4.5MB, so larger photos are reduced first. */
const MAX_SEND_BYTES = 4 * 1024 * 1024;
/** Same long-side size the server keeps (see lib/storage/optimize.ts) - shrinking further here would lose detail. */
const MAX_SIDE = 2400;
const OK_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Makes a file small enough to upload: a photo larger than MAX_SEND_BYTES or MAX_SIDE is redrawn upright
 * at no more than MAX_SIDE pixels and re-encoded (WebP, or JPEG where the browser can't make WebP; PNG
 * keeps transparency). GIFs aren't touched (they may be animated). The server optimizes again anyway.
 */
async function prepareForUpload(file: File): Promise<{ ok: true; blob: Blob } | { ok: false; error: string }> {
  if (file.type === "image/gif") {
    return file.size <= MAX_SEND_BYTES ? { ok: true, blob: file } : { ok: false, error: `"${file.name}" גדולה מדי. קובץ GIF אפשר להעלות עד 4MB.` };
  }
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // The browser can't read it here; small files still go up and the server decides.
    return file.size <= MAX_SEND_BYTES ? { ok: true, blob: file } : { ok: false, error: `לא הצלחנו לעבד את "${file.name}". נסו תמונה אחרת או צילום מסך שלה.` };
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  if (scale === 1 && file.size <= MAX_SEND_BYTES) {
    bmp.close();
    return { ok: true, blob: file };
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  for (const quality of [0.86, 0.72, 0.6]) {
    let blob = await toBlob(canvas, "image/webp", quality);
    // Some browsers can't encode WebP and quietly hand back PNG: use JPEG then (PNG for transparent images).
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, file.type === "image/png" ? "image/png" : "image/jpeg", quality);
    if (blob && blob.size <= MAX_SEND_BYTES) return { ok: true, blob };
  }
  return { ok: false, error: `"${file.name}" גדולה מדי גם אחרי הקטנה. נסו תמונה אחרת.` };
}

/** Pixel size of an image file, or null if the browser can't read it (the upload still goes ahead). */
async function imageSize(file: File): Promise<{ w: number; h: number } | null> {
  try {
    const bmp = await createImageBitmap(file);
    const size = { w: bmp.width, h: bmp.height };
    bmp.close();
    return size;
  } catch {
    return null;
  }
}

/** Uploads one or more images. Always shows what is accepted, and clearly reports progress and results. */
export function ImageUploader({
  label,
  hint,
  multiple,
  onUploaded,
  disabled,
  minSize,
}: {
  label: string;
  hint: string;
  multiple?: boolean;
  onUploaded: (urls: string[]) => void;
  disabled?: boolean;
  /** Below this the image will look blurry where it's shown: it's still uploaded, with a gentle warning. */
  minSize?: { w: number; h: number };
}) {
  const ref = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [small, setSmall] = useState("");
  const [over, setOver] = useState(false);

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    setDone("");
    setSmall("");
    const urls: string[] = [];
    const tooSmall: string[] = [];
    for (const file of Array.from(files)) {
      if (!OK_TYPES.includes(file.type)) {
        setError(`"${file.name}" אינו קובץ תמונה מתאים. אפשר להעלות PNG, JPG, WEBP או GIF.`);
        continue;
      }
      if (file.size > MAX_ORIGINAL_BYTES) {
        setError(`"${file.name}" גדולה מדי (עד 30MB). נסו תמונה קטנה יותר.`);
        continue;
      }
      if (minSize) {
        const size = await imageSize(file);
        if (size && (size.w < minSize.w || size.h < minSize.h)) tooSmall.push(`״${file.name}״ (${size.w}×${size.h})`);
      }
      const prepared = await prepareForUpload(file);
      if (!prepared.ok) {
        setError(prepared.error);
        continue;
      }
      const body = new FormData();
      body.append("file", prepared.blob, file.name);
      try {
        const res = await fetch("/api/upload", { method: "POST", body });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "ההעלאה נכשלה");
        urls.push(json.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "ההעלאה נכשלה. נסו שוב.");
      }
    }
    if (tooSmall.length && minSize) {
      setSmall(
        `${tooSmall.length === 1 ? "התמונה" : "התמונות"} ${tooSmall.join(", ")} ${tooSmall.length === 1 ? "קטנה מהמומלץ, ולכן עלולה להיראות מטושטשת" : "קטנות מהמומלץ, ולכן עלולות להיראות מטושטשות"} במסך גדול. כדאי להעלות תמונה של לפחות ${minSize.w}×${minSize.h} פיקסלים.`,
      );
    }
    if (urls.length) {
      onUploaded(urls);
      setDone(urls.length === 1 ? "התמונה הועלתה ✓" : `${urls.length} תמונות הועלו ✓`);
    }
    setBusy(false);
    if (ref.current) ref.current.value = "";
  }

  return (
    <div className="space-y-2">
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple={multiple}
        hidden
        aria-describedby={hintId}
        onChange={(e) => handle(e.target.files)}
      />
      <button
        type="button"
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        aria-describedby={hintId}
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!disabled && !busy) handle(e.dataTransfer.files);
        }}
        className={cx(
          "flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-5 py-4 text-center transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-64",
          over ? "border-brand-600 bg-brand-50" : "border-ink-300 bg-white hover:border-brand-400 hover:bg-ink-50",
        )}
      >
        {busy ? <Spinner /> : <UploadIcon className={cx("h-6 w-6 transition", over ? "-translate-y-0.5 text-brand-600" : "text-ink-500")} />}
        <span className="font-semibold text-ink-900">{busy ? "מעלה..." : label}</span>
        <span className="text-xs text-ink-500">או גררו קובץ לכאן</span>
      </button>
      <p id={hintId} className="text-sm text-ink-500">{hint}</p>
      <div aria-live="polite">
        {done && !error && <p className="text-sm font-medium text-green-800">{done}</p>}
        {small && <p className="flex gap-1.5 text-sm font-medium text-amber-800"><span aria-hidden>⚠</span>{small}</p>}
        {error && <p role="alert" className="flex gap-1.5 text-sm font-medium text-red-700"><span aria-hidden>⚠</span>{error}</p>}
      </div>
    </div>
  );
}

/** A reassurance line the wizard shows under each step title: what is not final yet and what can still change later. Provided by SiteForm for new sites only. */
export const StepNoteContext = createContext<string | null>(null);

export function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const note = useContext(StepNoteContext);
  return (
    <div className="mb-6">
      <h2 id="step-title" tabIndex={-1} className="text-2xl font-bold tracking-tight text-ink-900 outline-none md:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-ink-700">{subtitle}</p>}
      {note && (
        <p className="mt-4 flex gap-2.5 rounded-xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-900">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <span>{note}</span>
        </p>
      )}
    </div>
  );
}

/** Modal confirmation built on the native <dialog>: focus is trapped and Escape cancels. */
export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel,
  danger,
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(92vw,28rem)] rounded-2xl border border-ink-200 p-6 shadow-2xl backdrop:bg-ink-950/50"
    >
      <h2 id={titleId} className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-ink-700">{text}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="secondary" autoFocus onClick={onCancel}>ביטול</Button>
        <Button variant={danger ? "danger" : "primary"} loading={pending} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </dialog>
  );
}
