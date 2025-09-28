"use client";
import { track } from "../../utils/analytics";
export default function TrackEventButton({ event, props, className="", children, onClick }:{ event: string; props?: Record<string, any>; className?: string; children: React.ReactNode; onClick?: React.MouseEventHandler }) {
  return (
    <button className={className} onClick={(e)=>{ track(event, props); onClick?.(e); }}>{children}</button>
  );
}
