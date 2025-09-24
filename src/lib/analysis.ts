export interface AnalysisResult {
  wordCount: number;
  charCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTime: number; // in minutes
  fleschScore: number;
  issues: Issue[];
}

export interface Issue {
  type: 'adverb' | 'passive' | 'complex' | 'qualifier';
  text: string;
  position: number;
  suggestion?: string;
}

export function analyzeText(text: string): AnalysisResult {
  const words = text.match(/\b\w+\b/g) || [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());

  const wordCount = words.length;
  const charCount = text.length;
  const sentenceCount = sentences.length;
  const paragraphCount = paragraphs.length;

  // Estimate reading time (200 words per minute)
  const readingTime = wordCount / 200;

  // Simple Flesch Reading Ease Score approximation
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const fleschScore = Math.max(0, 206.835 - 1.015 * avgWordsPerSentence - 84.6 * (wordCount / charCount || 0));

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
        text: sentence.substring(0, 50) + '...',
        position: pos,
        suggestion: 'Break into shorter sentences'
      });
    }
  });

  // Qualifiers
  const qualifierRegex = /\b(very|really|quite|somewhat|extremely|incredibly)\b/gi;
  while ((match = qualifierRegex.exec(text)) !== null) {
    issues.push({
      type: 'qualifier',
      text: match[0],
      position: match.index,
      suggestion: 'Use stronger language'
    });
  }

  return {
    wordCount,
    charCount,
    sentenceCount,
    paragraphCount,
    readingTime,
    fleschScore,
    issues
  };
}
