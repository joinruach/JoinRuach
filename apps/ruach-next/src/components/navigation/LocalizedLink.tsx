"use client";

import NextLink, { type LinkProps } from "next/link";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { forwardRef, useMemo, type ComponentPropsWithoutRef } from "react";

const SUPPORTED_LOCALES = new Set(["en", "es", "fr", "pt"]);

function prefixHref(href: LinkProps["href"], locale?: string) {
  if (!locale || typeof href !== "string") {
    return href;
  }

  if (!href.startsWith("/")) {
    return href;
  }

  if (href === "/") {
    return `/${locale}`;
  }

  const [, maybeLocale] = href.split("/", 2);
  if (maybeLocale && SUPPORTED_LOCALES.has(maybeLocale)) {
    return href;
  }

  return `/${locale}${href}`;
}

type Props = ComponentPropsWithoutRef<typeof NextLink>;

const LocalizedLink = forwardRef<HTMLAnchorElement, Props>(function LocalizedLink(
  { href, ...rest },
  ref
) {
  const params = useParams();
  const hookLocale = useLocale();
  const locale = (params?.locale as string) || hookLocale;
  const localizedHref = useMemo(() => prefixHref(href, locale), [href, locale]);

  return <NextLink ref={ref} href={localizedHref} {...rest} />;
});

export type { LinkProps };
export default LocalizedLink;
