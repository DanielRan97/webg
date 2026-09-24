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

export const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

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
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-white text-gray-900 border border-gray-400 hover:bg-gray-50",
    ghost: "text-gray-800 hover:bg-gray-100",
    danger: "bg-white text-red-700 border border-red-300 hover:bg-red-50",
  }[variant];
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
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
    info: { cls: "bg-blue-50 text-blue-900 border-blue-300", icon: "ℹ" },
  }[kind];
  return (
    <p role={kind === "error" ? "alert" : "status"} className={cx("flex gap-2 rounded-xl border p-3 text-sm font-medium", look.cls)}>
      <span aria-hidden className="font-bold">{look.icon}</span>
      <span>{children}</span>
    </p>
  );
}

export const inputClass =
  "min-h-12 w-full rounded-xl border border-gray-400 bg-white px-4 text-base outline-none transition placeholder:text-gray-500 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 aria-[invalid=true]:border-red-600 aria-[invalid=true]:ring-red-100";

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
      <label htmlFor={id} className="block text-sm font-semibold text-gray-900">
        {label}
        {required && <span className="ms-1 font-normal text-gray-700">(חובה)</span>}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": showError || undefined, onBlur: () => setTouched(true) })}
      {hint && <p id={`${id}-hint`} className="text-sm text-gray-600">{hint}</p>}
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
      {(p) => <input {...p} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} {...rest} />}
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
            className="absolute end-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
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
      className="flex min-h-11 w-full items-center justify-between gap-4 rounded-xl text-start disabled:opacity-60"
    >
      <span>
        <span className={labelClassName ?? "block font-semibold text-gray-900"}>{label}</span>
        {hint && <span className="block text-sm text-gray-600">{hint}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {(onText || offText) && <span className="text-sm font-semibold text-gray-800">{checked ? onText : offText}</span>}
        <span className={cx("relative h-7 w-12 rounded-full transition", checked ? "bg-indigo-700" : "bg-gray-400")}>
          <span className={cx("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all", checked ? "end-0.5" : "start-0.5")} />
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
        "relative flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-3 text-center font-semibold transition",
        selected ? "border-indigo-700 bg-indigo-50 text-indigo-900" : "border-gray-300 bg-white hover:border-gray-400",
      )}
    >
      {selected && <span aria-hidden className="absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-700 text-xs text-white">✓</span>}
      {children}
    </button>
  );
}

const MAX_BYTES = 5 * 1024 * 1024;
const OK_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/** Uploads one or more images. Always shows what is accepted, and clearly reports progress and results. */
export function ImageUploader({
  label,
  hint,
  multiple,
  onUploaded,
  disabled,
}: {
  label: string;
  hint: string;
  multiple?: boolean;
  onUploaded: (urls: string[]) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    setDone("");
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      if (!OK_TYPES.includes(file.type)) {
        setError(`"${file.name}" אינו קובץ תמונה מתאים. אפשר להעלות PNG, JPG, WEBP או GIF.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" גדולה מדי (עד 5MB). נסו תמונה קטנה יותר.`);
        continue;
      }
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "ההעלאה נכשלה");
        urls.push(json.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "ההעלאה נכשלה. נסו שוב.");
      }
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
      <Button type="button" variant="secondary" loading={busy} disabled={disabled} onClick={() => ref.current?.click()}>
        {busy ? "מעלה..." : label}
      </Button>
      <p id={hintId} className="text-sm text-gray-600">{hint}</p>
      <div aria-live="polite">
        {done && !error && <p className="text-sm font-medium text-green-800">{done}</p>}
        {error && <p role="alert" className="flex gap-1.5 text-sm font-medium text-red-700"><span aria-hidden>⚠</span>{error}</p>}
      </div>
    </div>
  );
}

export function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 id="step-title" tabIndex={-1} className="text-2xl font-bold text-gray-900 outline-none">{title}</h2>
      {subtitle && <p className="mt-1 text-gray-700">{subtitle}</p>}
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
      className="m-auto w-[min(92vw,28rem)] rounded-3xl p-6 shadow-2xl backdrop:bg-black/50"
    >
      <h2 id={titleId} className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-gray-700">{text}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="secondary" autoFocus onClick={onCancel}>ביטול</Button>
        <Button variant={danger ? "danger" : "primary"} loading={pending} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </dialog>
  );
}
