"use client";

import Link, { type LinkProps } from "next/link";
import { track } from "@/lib/analytics";
import type { AnchorHTMLAttributes, MouseEvent } from "react";

type Props = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    event: string;
    eventProps?: Record<string, any>;
  };

export default function TrackedLink({ event, eventProps, onClick, ...rest }: Props) {
  function handleClick(eventObj: MouseEvent<HTMLAnchorElement>) {
    if (onClick) {
      onClick(eventObj);
    }
    if (!eventObj.defaultPrevented) {
      track(event, eventProps);
    }
  }

  return <Link {...rest} onClick={handleClick} />;
}
