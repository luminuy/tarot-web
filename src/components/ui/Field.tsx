"use client";

import React, { useId } from "react";

/**
 * props ที่ต้องถูกส่งต่อไปที่ **ตัว control จริง** (ไม่ใช่กล่องที่ห่อมันอยู่)
 *
 * ⚠️ `aria-describedby` ต้องอยู่บน `<input>` / `<textarea>` / `<select>` เท่านั้น
 * ถ้าไปอยู่บน `<div>` ที่ห่อ control อยู่ screen reader **จะไม่อ่านคำอธิบายหรือข้อความ
 * ผิดพลาดออกมาเลย** — ของเดิมของไฟล์นี้เป็นแบบนั้นอยู่ คือผูก `id` ของ hint/error ไว้
 * เรียบร้อยแต่แปะ `aria-describedby` ผิดที่ ทำให้ข้อความที่อุตส่าห์เขียนไม่เคยถูกอ่านสักครั้ง (UX-09)
 */
export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: (props: FieldControlProps) => React.ReactNode;
}

/**
 * ห่อ label + control + hint/error ให้ a11y ครบ
 *
 * ⚠️ **ต้อง spread props ที่ได้รับลงบน control เสมอ** อย่าหยิบไปแค่ `id`
 *   <Field label="รหัสผ่าน" error={err}>{(field) => <Input {...field} type="password" />}</Field>
 *
 * `aria-invalid` จะถูกตั้งให้อัตโนมัติเมื่อมี `error` — ผู้ใช้ screen reader จึงรู้ว่า
 * ช่องไหนกรอกผิดโดยไม่ต้องเดา (ทั้งโค้ดเบสเคยไม่มี `aria-invalid` เลยแม้แต่จุดเดียว)
 */
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold tracking-wide text-[#8F5C1A]">
        {label}
      </label>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {error ? (
        <p id={`${id}-err`} className="text-xs text-[#A6392C]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-[#635B4E]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
