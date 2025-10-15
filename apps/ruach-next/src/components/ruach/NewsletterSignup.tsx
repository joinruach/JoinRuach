"use client";

import { useState, type FormEvent } from "react";
import EmbedScript from "@/components/ruach/embeds/EmbedScript";
import { cn } from "@/lib/cn";

const convertKitEmbedHtml = process.env.NEXT_PUBLIC_CONVERTKIT_EMBED_HTML;
const convertKitFormAction = process.env.NEXT_PUBLIC_CONVERTKIT_FORM_ACTION;
const convertKitFormMethod = process.env.NEXT_PUBLIC_CONVERTKIT_FORM_METHOD || "post";
const convertKitFormTarget = process.env.NEXT_PUBLIC_CONVERTKIT_FORM_TARGET || "_blank";
const convertKitFormId = process.env.NEXT_PUBLIC_CONVERTKIT_FORM_ID;

type Status = "idle" | "loading" | "success" | "error";

export type NewsletterSignupProps = {
  variant?: "light" | "dark";
  className?: string;
  buttonLabel?: string;
  id?: string;
};

export default function NewsletterSignup({
  variant = "light",
  className,
  buttonLabel = "Join the newsletter",
  id
}: NewsletterSignupProps) {
  const isDark = variant === "dark";
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const manualMode = !convertKitFormId;
  const manualSuccessFallback =
    "Thanks for joining! Our team will add you manually while the newsletter finishes setup.";
  const directSuccessFallback = "Thanks for joining! Check your inbox to confirm.";
  const [successMessage, setSuccessMessage] = useState(
    manualMode ? manualSuccessFallback : directSuccessFallback
  );

  if (convertKitEmbedHtml) {
    return <EmbedScript html={convertKitEmbedHtml} />;
  }

  if (convertKitFormAction) {
    const inputId = id ?? (variant === "dark" ? "newsletter-email-dark" : "newsletter-email-light");
    return (
      <form
        action={convertKitFormAction}
        method={convertKitFormMethod}
        className={cn("space-y-3", className)}
        target={convertKitFormTarget}
        rel="noopener noreferrer"
      >
        <div>
          <label
            htmlFor={inputId}
            className={cn(
              "text-xs uppercase tracking-wide",
              isDark ? "text-white/60" : "text-neutral-500"
            )}
          >
            Email address
          </label>
          <input
            id={inputId}
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className={cn(
              "mt-2 w-full rounded-lg border px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-400",
              isDark
                ? "border-white/10 bg-white/10 text-white"
                : "border-neutral-200 bg-white text-neutral-900"
            )}
          />
        </div>
        <button
          type="submit"
          className={cn(
            "flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition",
            isDark
              ? "bg-amber-500 text-black hover:bg-amber-400"
              : "bg-neutral-900 text-white hover:bg-neutral-800"
          )}
        >
          {buttonLabel}
        </button>
        <p className={cn("text-xs", isDark ? "text-white/50" : "text-neutral-500")}>We respect your inbox. Unsubscribe anytime.</p>
      </form>
    );
  }

  const emailInputId = id ?? (variant === "dark" ? "newsletter-email-dark" : "newsletter-email-light");
  const nameInputId = `${emailInputId}-name`;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setError(null);
    setSuccessMessage(manualMode ? manualSuccessFallback : directSuccessFallback);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus("success");
        setEmail("");
        setFirstName("");
        const message = (json as { message?: string }).message;
        if (message) {
          setSuccessMessage(message);
        }
      } else {
        setStatus("error");
        setError((json as { error?: string }).error || "Unable to subscribe right now.");
      }
    } catch {
      setStatus("error");
      setError("Network error. Please try again in a moment.");
    }
  }

  return (
    <form onSubmit={submit} className={cn("space-y-3", className)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={nameInputId}
            className={cn(
              "text-xs uppercase tracking-wide",
              isDark ? "text-white/60" : "text-neutral-500"
            )}
          >
            Name (optional)
          </label>
          <input
            id={nameInputId}
            name="firstName"
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Your first name"
            className={cn(
              "mt-2 w-full rounded-lg border px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-400",
              isDark
                ? "border-white/10 bg-white/10 text-white"
                : "border-neutral-200 bg-white text-neutral-900"
            )}
          />
        </div>
        <div>
          <label
            htmlFor={emailInputId}
            className={cn(
              "text-xs uppercase tracking-wide",
              isDark ? "text-white/60" : "text-neutral-500"
            )}
          >
            Email address
          </label>
          <input
            id={emailInputId}
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={cn(
              "mt-2 w-full rounded-lg border px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-400",
              isDark
                ? "border-white/10 bg-white/10 text-white"
                : "border-neutral-200 bg-white text-neutral-900"
            )}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className={cn(
          "flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition",
          status === "loading"
            ? "cursor-wait bg-neutral-500 text-white"
            : isDark
              ? "bg-amber-500 text-black hover:bg-amber-400"
              : "bg-neutral-900 text-white hover:bg-neutral-800"
        )}
      >
        {status === "loading" ? "Submitting..." : buttonLabel}
      </button>
      {status === "success" ? (
        <p className={cn("text-xs", isDark ? "text-emerald-300" : "text-emerald-600")}>{successMessage}</p>
      ) : error ? (
        <p className={cn("text-xs", isDark ? "text-red-300" : "text-red-600")}>{error}</p>
      ) : (
        <p className={cn("text-xs", isDark ? "text-white/50" : "text-neutral-500")}>
          {manualMode ? "We’ll add you manually and follow up by email." : "We respect your inbox. Unsubscribe anytime."}
        </p>
      )}
    </form>
  );
}
