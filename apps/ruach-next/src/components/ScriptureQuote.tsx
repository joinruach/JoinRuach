"use client";

type ResolvedScripture = {
  osis: string;
  translationRequested: string | null;
  translationServed: string | null;
  reference: string | null;
  text: string | null;
  copyright: string | null;
  sourceId: number | null;
  notice?: string;
  error?: string;
};

function fallbackReferenceFromOsis(osis: string) {
  const parts = String(osis ?? "").split(".");
  if (parts.length !== 3) return osis;
  const [book, chapter, verse] = parts;
  return `${book} ${chapter}:${verse}`;
}

export function ScriptureQuote({
  osis,
  translationRequested,
  resolved,
  loading,
}: {
  osis: string;
  translationRequested: string | null;
  resolved?: ResolvedScripture;
  loading?: boolean;
}) {
  const reference = resolved?.reference ?? fallbackReferenceFromOsis(osis);
  const served = resolved?.translationServed ?? null;
  const requested = translationRequested ?? null;

  const translationLabel =
    served && requested && served !== requested
      ? `${served} (requested ${requested})`
      : served || requested || "";

  if (loading) {
    return (
      <div>
        <p className="opacity-60">Loading scripture…</p>
        <p className="text-sm opacity-60">
          {reference} {translationLabel ? `(${translationLabel})` : null}
        </p>
      </div>
    );
  }

  if (!resolved || !resolved.text) {
    return (
      <div>
        <p className="text-sm opacity-80">
          {reference} {translationLabel ? `(${translationLabel})` : null}
        </p>
        <p className="opacity-80">
          {resolved?.notice || resolved?.error || "Scripture text unavailable."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p>
        <em>“{resolved.text}”</em>
      </p>
      <p className="text-sm opacity-80">
        {reference} {translationLabel ? `(${translationLabel})` : null}
      </p>
    </div>
  );
}

