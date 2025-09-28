export type Strength = 0|1|2|3|4;
export function scorePassword(pw: string): { score: Strength; hints: string[] } {
  const hints: string[] = []; let score: Strength = 0;
  if (!pw || pw.length < 8) hints.push("Use at least 8 characters");
  if (!/[A-Z]/.test(pw)) hints.push("Add an uppercase letter");
  if (!/[a-z]/.test(pw)) hints.push("Add a lowercase letter");
  if (!/[0-9]/.test(pw)) hints.push("Add a number");
  if (!/[^A-Za-z0-9]/.test(pw)) hints.push("Add a symbol");
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 12) score++;
  return { score: Math.min(score, 4) as Strength, hints };
}
export const labelForScore = (s: Strength) => ["Very weak","Weak","Fair","Good","Strong"][s];
