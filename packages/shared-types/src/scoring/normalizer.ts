/**
 * Normalizes user-submitted textual answers for IELTS gap-fill and short-answer questions.
 * Removes extra whitespace, punctuation quirks, and performs case-insensitive trimming.
 */
export function normalizeTextAnswer(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  return raw
    .trim()
    .toLowerCase()
    // Replace multiple whitespace/tabs with a single space
    .replace(/\s+/g, ' ')
    // Strip surrounding quotes or stray edge punctuation
    .replace(/^["']+|["']+$/g, '');
}

/**
 * Counts words in a string according to IELTS conventions (whitespace-separated tokens).
 */
export function countIELTSWords(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (trimmed === '') return 0;

  return trimmed.split(/\s+/).length;
}

export interface EvaluationResult {
  is_correct: boolean;
  normalized_answer: string;
  reason?: 'correct' | 'incorrect' | 'exceeded_word_limit';
}

/**
 * Evaluates a textual candidate answer against accepted answer strings and word limits.
 *
 * @param candidate - Raw input from the student
 * @param acceptedAnswers - List of valid answers configured by the instructor
 * @param maxWords - Optional max word limit (e.g. 2 for "NO MORE THAN TWO WORDS")
 */
export function evaluateTextualAnswer(
  candidate: string,
  acceptedAnswers: string[],
  maxWords?: number
): EvaluationResult {
  const normalizedCandidate = normalizeTextAnswer(candidate);

  if (!normalizedCandidate) {
    return {
      is_correct: false,
      normalized_answer: '',
      reason: 'incorrect',
    };
  }

  // Pre-evaluation gate: Strict Word Count Enforcement (ADR-0010)
  if (maxWords && maxWords > 0) {
    const wordCount = countIELTSWords(normalizedCandidate);
    if (wordCount > maxWords) {
      return {
        is_correct: false,
        normalized_answer: normalizedCandidate,
        reason: 'exceeded_word_limit',
      };
    }
  }

  const normalizedAccepted = acceptedAnswers.map(normalizeTextAnswer);
  const isMatch = normalizedAccepted.includes(normalizedCandidate);

  return {
    is_correct: isMatch,
    normalized_answer: normalizedCandidate,
    reason: isMatch ? 'correct' : 'incorrect',
  };
}
