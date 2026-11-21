/** Shared subject -> icon key mapping (safe on both server and client). */
export type SubjectIconKey =
  | "math"
  | "physics"
  | "chemistry"
  | "biology"
  | "programming"
  | "english"
  | "bangla"
  | "economics"
  | "science";

export function iconForSubject(subject: string): SubjectIconKey {
  const value = subject.toLowerCase();
  if (/chem/.test(value)) return "chemistry";
  if (/phys/.test(value)) return "physics";
  if (/bio/.test(value)) return "biology";
  if (/ict|program|computer|code|software/.test(value)) return "programming";
  if (/english|ielts|spoken|grammar/.test(value)) return "english";
  if (/bangla/.test(value)) return "bangla";
  if (/econ|business|account/.test(value)) return "economics";
  if (/scien/.test(value)) return "science";
  return "math";
}
