"use client";
import { track } from "../../utils/analytics";

export default function CertificateButton({
  completed, total, courseSlug, courseTitle, href,
}: { completed: number; total: number; courseSlug: string; courseTitle: string; href: string; }) {
  const ready = total > 0 && completed >= total;
  return (
    <a
      href={ready ? href : undefined}
      onClick={(e) => {
        if (!ready) { e.preventDefault(); return; }
        track("CertificateDownload", { courseSlug, courseTitle });
      }}
      aria-disabled={!ready}
      title={ready ? "Download your certificate" : "Complete all lessons to unlock your certificate."}
      className={[
        "inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold transition",
        ready ? "bg-amber-500 text-black hover:bg-amber-400" : "cursor-not-allowed bg-neutral-200 text-neutral-500",
      ].join(" ")}
    >
      {ready ? "Download Certificate" : "Certificate Locked"}
    </a>
  );
}
