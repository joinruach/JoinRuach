"use client";
import { track } from "../../utils/analytics";
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";

type TrackEventButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  event: string;
  props?: Record<string, any>;
  className?: string;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export default function TrackEventButton({
  event,
  props,
  className = "",
  children,
  onClick,
  type = "button",
  ...rest
}: TrackEventButtonProps) {
  return (
    <button
      type={type}
      className={className}
      onClick={(e) => {
        track(event, props);
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
