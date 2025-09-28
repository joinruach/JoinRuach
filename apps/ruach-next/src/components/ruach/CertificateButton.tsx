"use client";
import { track } from "@/lib/analytics";
export default function CertificateButton({ completed,total,courseSlug,courseTitle,href }:{ completed:number; total:number; courseSlug:string; courseTitle:string; href:string; }){
  const ready = total>0 && completed>=total;
  return (
    <a
      href={ready ? href : undefined}
      onClick={(e)=>{
        if(!ready){
          e.preventDefault();
          return;
        }
        track("CertificateDownload",{courseSlug,courseTitle});
      }}
      aria-disabled={!ready}
      title={ready?"Download your certificate":"Complete all lessons to unlock your certificate."}
      className={[
        "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition",
        ready
          ? "bg-amber-400 text-black hover:bg-amber-300"
          : "cursor-not-allowed border border-white/15 bg-white/5 text-white/50"
      ].join(" ")}
    >
      {ready?"Download Certificate":"Certificate Locked"}
    </a>
  );
}
