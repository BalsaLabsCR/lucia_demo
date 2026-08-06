"use client";

import type { ReactNode } from "react";

/** Primitivas de formulario compartidas por las secciones de /lucia/knowledge. */

export const inputCls =
  "w-full rounded-[10px] border border-arena-200 bg-blanco px-3 py-2 text-[14px] text-tinta-900 placeholder:text-tinta-500/60 focus:border-verde-600 focus:outline-none";

export const textareaCls = `${inputCls} min-h-[72px] resize-y leading-relaxed`;

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[13px] font-semibold text-tinta-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-tinta-500">{hint}</span>}
    </label>
  );
}

export function SectionCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-[140px] rounded-[14px] border border-arena-200 bg-blanco p-5 shadow-suave dk:p-7"
    >
      <h2 className="font-display text-[22px] font-bold tracking-[-0.01em]">{title}</h2>
      {description && <p className="mt-1 text-[13.5px] text-tinta-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border-[1.5px] border-menta-200 bg-blanco px-4 py-2 text-[13.5px] font-semibold text-verde-800 transition-colors hover:bg-verde-50"
    >
      + {children}
    </button>
  );
}

export function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-lg px-2.5 py-1 text-[13px] font-semibold text-error-tx transition-colors hover:bg-error-bg"
    >
      Eliminar
    </button>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-tinta-900">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-verde-600"
      />
      {children}
    </label>
  );
}
