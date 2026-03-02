import { explainError, type ErrorExplanation } from "@errlens/core";

export function generateExplanation(message: string): ErrorExplanation | null {
  return explainError(message);
}
