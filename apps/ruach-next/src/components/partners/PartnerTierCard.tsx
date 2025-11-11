import Link from "next/link";

type PartnerTier = {
  name: string;
  price: number;
  interval: "month" | "year";
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaText?: string;
  ctaHref?: string;
};

type PartnerTierCardProps = {
  tier: PartnerTier;
};

export default function PartnerTierCard({ tier }: PartnerTierCardProps) {
  const { name, price, interval, description, features, highlighted, ctaText, ctaHref } = tier;

  return (
    <div
      className={`relative rounded-2xl p-8 transition ${
        highlighted
          ? "border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-white shadow-lg"
          : "border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md"
      }`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-amber-400 px-4 py-1 text-xs font-semibold text-black">
            Most Popular
          </span>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-neutral-900">{name}</h3>
          <p className="text-sm text-neutral-600">{description}</p>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-neutral-900">${price}</span>
          <span className="text-sm text-neutral-600">/{interval}</span>
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                ✓
              </span>
              <span className="text-neutral-700">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href={ctaHref ?? "/give"}
          className={`block w-full rounded-full py-3 text-center text-sm font-semibold transition ${
            highlighted
              ? "bg-amber-400 text-black hover:bg-amber-500"
              : "bg-neutral-900 text-white hover:bg-neutral-800"
          }`}
        >
          {ctaText ?? "Become a Partner"}
        </Link>
      </div>
    </div>
  );
}
