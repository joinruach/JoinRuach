import EmbedScript from "./embeds/EmbedScript";
export default function SEOHead({ jsonLd }: { jsonLd: object }) {
  return <EmbedScript html={`<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`} />;
}
