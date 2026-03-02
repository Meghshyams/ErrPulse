import { ERROR_PATTERNS, type ErrorPattern } from "./patterns.js";

export interface ErrorExplanation {
  title: string;
  explanation: string;
  suggestion: string;
}

export function explainError(message: string): ErrorExplanation | null {
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.pattern.test(message)) {
      return {
        title: pattern.title,
        explanation: pattern.explanation,
        suggestion: pattern.suggestion,
      };
    }
  }
  return null;
}

export function matchPattern(message: string): ErrorPattern | null {
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.pattern.test(message)) {
      return pattern;
    }
  }
  return null;
}
