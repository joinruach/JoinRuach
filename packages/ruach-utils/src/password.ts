/**
 * Password utilities for validation and strength scoring
 */

export type Strength = 0 | 1 | 2 | 3 | 4;

export interface PasswordScore {
  score: Strength;
  hints: string[];
}

/**
 * Score password strength and provide improvement hints
 * @param pw - Password to score
 * @returns Score (0-4) and array of hints for improvement
 */
export function scorePassword(pw: string): PasswordScore {
  const hints: string[] = [];
  let score: Strength = 0;

  if (!pw || pw.length < 8) {
    hints.push("Use at least 8 characters");
  }

  if (!/[A-Z]/.test(pw)) {
    hints.push("Add an uppercase letter");
  }

  if (!/[a-z]/.test(pw)) {
    hints.push("Add a lowercase letter");
  }

  if (!/[0-9]/.test(pw)) {
    hints.push("Add a number");
  }

  if (!/[^A-Za-z0-9]/.test(pw)) {
    hints.push("Add a symbol");
  }

  // Calculate score
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 12) score++;

  return { score: Math.min(score, 4) as Strength, hints };
}

/**
 * Get human-readable label for password strength score
 * @param score - Strength score (0-4)
 * @returns Label string
 */
export function labelForScore(score: Strength): string {
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  return labels[score];
}

/**
 * Get color class for password strength
 * @param score - Strength score (0-4)
 * @returns Tailwind color class
 */
export function colorForScore(score: Strength): string {
  const colors = [
    "text-red-600",
    "text-orange-600",
    "text-yellow-600",
    "text-blue-600",
    "text-green-600",
  ];
  return colors[score];
}
