"use client";
import { useEffect } from "react";

export default function DoubleTheDonation(){
  useEffect(()=>{
    const src = process.env.NEXT_PUBLIC_DOUBLE_DONATION_SRC;
    if (!src) return;
    const s = document.createElement("script");
    s.async = true; s.src = src;
    document.body.appendChild(s);
    return () => { document.body.removeChild(s); };
  }, []);
  return (
    <div className="rounded-xl border border-black/10 p-4">
      <h3 className="font-semibold">Double Your Gift</h3>
      <div id="double-the-donation-embed" className="mt-3" />
    </div>
  );
}
