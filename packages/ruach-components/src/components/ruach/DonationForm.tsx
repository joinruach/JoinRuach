"use client";
import { useState, type FormEvent, type ReactElement } from "react";
import RecurringToggle from "./RecurringToggle";
import { Button } from "./../ruach/ui/Button";
import { track } from "../../utils/analytics";

export type DonationFormProps = {
  processorUrl?: string;
};

export default function DonationForm({ processorUrl="https://givebutter.com/ruach-studios" }: DonationFormProps): ReactElement {
  const [amount, setAmount] = useState<number | "">("");
  const [monthly, setMonthly] = useState(false);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const a = typeof amount === "number" ? amount : 0;
    track("GiveClick", { placement:"donation_form", amount: a, monthly });
    const newWindow = window.open(processorUrl, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = null;
  }
  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-black/10 p-4">
      <label className="block text-sm">Amount</label>
      <div className="flex gap-2">
        {[25,50,100,250].map(v=>(
          <button type="button" key={v} onClick={()=>setAmount(v)}
            className={`rounded-lg px-3 py-2 ring-1 ${amount===v ? "ring-black bg-black text-white" : "ring-black/10 hover:ring-black/30"}`}>
            ${v}
          </button>
        ))}
        <input type="number" placeholder="Custom" min={1} value={amount === "" ? "" : amount}
          onChange={e=>setAmount(e.target.value ? Number(e.target.value) : "")}
          className="w-24 rounded-lg border border-black/10 px-3 py-2" />
      </div>
      <RecurringToggle value={monthly} onChange={setMonthly} />
      <Button type="submit" variant="gold" className="w-full mt-2">Give</Button>
      <p className="text-xs text-neutral-500">You’ll be taken to our secure processor.</p>
    </form>
  );
}
