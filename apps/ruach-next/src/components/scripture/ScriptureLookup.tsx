"use client";

import { useState } from "react";
import ScriptureReference from "./ScriptureReference";
import ScriptureModal from "./ScriptureModal";

export interface ScriptureLookupProps {
  reference: string;
  variant?: "inline" | "badge" | "button";
  className?: string;
}

/**
 * ScriptureLookup - Combined component with reference + modal
 *
 * This is the easiest way to add scripture lookup to your page.
 * It handles both the clickable reference and the modal automatically.
 *
 * Usage:
 * <ScriptureLookup reference="John 3:16" variant="inline" />
 */
export default function ScriptureLookup({
  reference,
  variant = "inline",
  className = "",
}: ScriptureLookupProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <ScriptureReference
        reference={reference}
        onClick={() => setIsModalOpen(true)}
        variant={variant}
        className={className}
      />

      <ScriptureModal
        reference={reference}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
