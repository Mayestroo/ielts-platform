import { describe, it, expect } from 'vitest';
import { normalizeTextAnswer, countIELTSWords, evaluateTextualAnswer } from '../src/scoring/normalizer.js';

describe('IELTS Text Normalization and Word Limits', () => {
  it('normalizes casing and whitespace', () => {
    expect(normalizeTextAnswer('  Central  Library  ')).toBe('central library');
    expect(normalizeTextAnswer('"Theatre"')).toBe('theatre');
  });

  it('counts words according to IELTS whitespace rules', () => {
    expect(countIELTSWords('two words')).toBe(2);
    expect(countIELTSWords('three long words')).toBe(3);
    expect(countIELTSWords('')).toBe(0);
  });

  it('evaluates answers against multiple accepted variations', () => {
    const accepted = ['theater', 'theatre', 'a theater', 'a theatre'];
    expect(evaluateTextualAnswer('Theater', accepted).is_correct).toBe(true);
    expect(evaluateTextualAnswer('THEATRE', accepted).is_correct).toBe(true);
    expect(evaluateTextualAnswer('cinema', accepted).is_correct).toBe(false);
  });

  it('strictly rejects answers exceeding max_words constraint (ADR-0010)', () => {
    const accepted = ['in the central library', 'central library'];
    // 4 words for a max 2 word limit
    const result = evaluateTextualAnswer('in the central library', accepted, 2);
    expect(result.is_correct).toBe(false);
    expect(result.reason).toBe('exceeded_word_limit');

    // 2 words within limit
    const valid = evaluateTextualAnswer('central library', accepted, 2);
    expect(valid.is_correct).toBe(true);
  });
});
