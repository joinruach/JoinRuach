"use client";
export default function RecurringToggle({ value, onChange }:{ value: boolean; onChange:(v:boolean)=>void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)} className="h-4 w-4" />
      <span className="text-sm">Make this monthly</span>
    </label>
  );
}
