export interface AnalysisResult {
  charCount: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTime: number; // in minutes
  fleschScore: number;
  score: number;
  gradeLevel: number;
  issues: Issue[];
}

export interface Issue {
  type: 'adverb' | 'passive' | 'complex' | 'qualifier';
  text: string;
  position: number;
  suggestion?: string;
}

function syllableCount(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

export function analyzeText(text: string): AnalysisResult {
  const words = text.match(/\b\w+\b/g) || [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());

  const wordCount = words.length;
  const charCount = text.length;
  const sentenceCount = sentences.length;
  const paragraphCount = paragraphs.length;

  // Estimate reading time (250 words per minute)
  const readingTime = wordCount / 250;

  // Flesch Reading Ease Score
  const totalSyllables = words.reduce((sum, word) => sum + syllableCount(word), 0);
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const avgSyllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 0;
  const fleschScore = wordCount > 0 && sentenceCount > 0
    ? Math.max(0, 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord)
    : 0;

  // Grade Level calculation
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  const gradeLevel = wordCount > 0 && sentenceCount > 0
    ? Math.round(4.71 * (letters / wordCount) + 0.5 * (wordCount / sentenceCount) - 21.43)
    : 0;

  // Find issues
  const issues: Issue[] = [];

  // Adverbs
  const adverbRegex = /\b\w+ly\b/gi;
  let match;
  while ((match = adverbRegex.exec(text)) !== null) {
    issues.push({
      type: 'adverb',
      text: match[0],
      position: match.index,
      suggestion: 'Consider if this adverb is necessary'
    });
  }

  // Passive voice (simple detection)
  const passiveRegex = /\b(is|are|was|were|be|been|being)\s+(\w+ed|\w+en)\b/gi;
  while ((match = passiveRegex.exec(text)) !== null) {
    issues.push({
      type: 'passive',
      text: match[0],
      position: match.index,
      suggestion: 'Consider active voice'
    });
  }

  // Complex sentences (long sentences)
  sentences.forEach((sentence) => {
    const wordsInSentence = sentence.split(/\s+/).length;
    if (wordsInSentence > 25) {
      const pos = text.indexOf(sentence);
      issues.push({
        type: 'complex',
        text: sentence.trim(),
        position: pos,
        suggestion: 'Break into shorter sentences'
      });
    }
  });

  // Qualifiers
  const qualifierPhrases = ['I think', 'we think', 'I believe', 'we believe', 'maybe', 'perhaps', 'possibly', 'probably', 'I guess', 'we guess', 'kind of', 'sort of', 'a bit', 'a little', 'really', 'extremely', 'incredibly'];
  qualifierPhrases.forEach((phrase) => {
    const regex = new RegExp('\\b' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      issues.push({
        type: 'qualifier',
        text: phrase,
        position: match.index,
        suggestion: 'Use stronger language'
      });
    }
  });

  // Calculate score
  const adverbCount = issues.filter(i => i.type === 'adverb').length;
  const passiveCount = issues.filter(i => i.type === 'passive').length;
  const complexCount = issues.filter(i => i.type === 'complex').length;
  const hardWords = words.filter(w => syllableCount(w) >= 3).length;
  const veryHardWords = words.filter(w => syllableCount(w) >= 4).length;

  const penalty_adverbs = Math.max(0, adverbCount - 2) * 2;
  const penalty_passive = Math.max(0, passiveCount - 4) * 2;
  const penalty_hard = (hardWords / Math.max(wordCount, 1)) * 15;
  const penalty_very_hard = (veryHardWords / Math.max(wordCount, 1)) * 25;
  const penalty_complex = complexCount * 1;

  const score = Math.max(0, 100 - penalty_adverbs - penalty_passive - penalty_hard - penalty_very_hard - penalty_complex);

  return {
    charCount,
    wordCount,
    sentenceCount,
    paragraphCount,
    readingTime,
    fleschScore,
    score,
    gradeLevel,
    issues
  };
}
