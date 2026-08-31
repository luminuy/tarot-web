"use client";

import React, { useId } from "react";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string) => React.ReactNode;
}

/**
 * ห่อ label + control + hint/error ให้ a11y ครบ (htmlFor / aria-describedby)
 *   <Field label="รหัสผ่าน">{(id) => <Input id={id} type="password" />}</Field>
 */
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold tracking-wide text-[#e5c07b]">
        {label}
      </label>
      <div aria-describedby={describedBy}>{children(id)}</div>
      {error ? (
        <p id={`${id}-err`} className="text-xs text-[#f0a0a0]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-[#9c93b8]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
