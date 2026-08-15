# Textual Answer Normalization and Word Limit Enforcement

Evaluating gap-fill and short-answer questions requires deterministic string matching and strict adherence to IELTS word count constraints. We decided that textual answers will be evaluated via normalized, case-insensitive, whitespace-trimmed comparisons against an explicit `accepted_answers: string[]` array. Furthermore, word count constraints (`max_words`) are enforced as an independent pre-evaluation validation gate: responses exceeding the word limit are marked incorrect regardless of semantic validity.
