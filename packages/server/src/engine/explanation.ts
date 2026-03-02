import { explainError, type ErrorExplanation } from "@errpulse/core";

export function generateExplanation(message: string): ErrorExplanation | null {
  return explainError(message);
}
