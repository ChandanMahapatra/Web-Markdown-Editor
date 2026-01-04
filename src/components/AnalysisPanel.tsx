'use client';

import { useState, useEffect } from 'react';
import { AnalysisResult } from '@/lib/analysis';
import { EvaluationResult, evaluateText, getProviders } from '@/lib/ai';
import { loadSettings } from '@/lib/storage';

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  text: string;
  onHoverIssue?: (type: string | null) => void;
  aiStatus: 'disconnected' | 'connected' | 'connecting';
}

function formatReadingTime(minutes: number): string {
  const totalSeconds = Math.round(minutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const minutesPart = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutesPart}m ${seconds}s`;
}

function getFleschNote(score: number): string {
  if (score >= 90) return 'Very easy to read. Easily understood by an average 11-year-old student.';
  if (score >= 80) return 'Easy to read. Conversational English for consumers.';
  if (score >= 70) return 'Fairly easy to read.';
  if (score >= 60) return 'Plain English. Easily understood by 13- to 15-year-old students.';
  if (score >= 50) return 'Fairly difficult to read.';
  if (score >= 30) return 'Difficult to read.';
  if (score >= 10) return 'Very difficult to read. Best understood by university graduates.';
  return 'Extremely difficult to read. Best understood by university graduates.';
}

function getIssueColor(type: string): string {
  switch (type) {
    case 'adverb': return 'var(--color-status-error)';
    case 'passive': return 'var(--color-status-warning)';
    case 'complex': return 'var(--color-accent-primary)';
    case 'qualifier': return 'var(--color-status-success)';
    default: return 'var(--color-accent-primary)';
  }
}

export default function AnalysisPanel({ analysis, text, onHoverIssue, aiStatus }: AnalysisPanelProps) {
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleEvaluate = async () => {
    if (!text.trim()) return;

    setIsEvaluating(true);
    try {
      const settings = await loadSettings();
      if (!settings?.provider) {
        alert('Please select an AI provider in settings.');
        return;
      }
      const providers = await getProviders();
      const provider = providers.find(p => p.id === settings.provider);
      if (!provider) {
        alert('Provider not found.');
        return;
      }
      
      const modelToUse = settings.model || provider.models[0];
      console.log('Starting evaluation:', { provider: provider.id, model: modelToUse });
      
      const result = await evaluateText(text, provider, modelToUse, settings.apiKey, settings.baseURL);
      setEvaluation(result);
    } catch (error) {
      console.error('Evaluation failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Evaluation failed: ${errorMessage}\n\nCheck your console for more details.`);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!analysis) {
    return (
      <div className="w-full h-full bg-[var(--color-background-primary)] border-l border-[var(--color-border-primary)] p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Analysis</h2>
        <p className="text-[var(--color-text-secondary)]">No analysis available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[var(--color-background-primary)] border-l border-[var(--color-border-primary)] p-4 overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4 text-[var(--color-text-primary)]">Analysis</h2>

      <div className="space-y-4">
        <div>
          <div className="text-lg"><strong className="text-[var(--color-text-primary)]">Grade Level: {analysis.gradeLevel}</strong></div>
          <div className="mt-2 text-lg">
            <strong className="text-[var(--color-text-primary)]">Score: {analysis.score.toFixed(1)}</strong><span className="text-[var(--color-text-primary)]"> (</span>
            <a
              href="https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent-primary)] hover:text-[var(--color-accent-hover)] underline"
            >
              Flesch Score: {analysis.fleschScore.toFixed(1)}
            </a>
            <span className="text-[var(--color-text-primary)])">)</span>
            <div className="text-sm text-[var(--color-text-secondary)] mt-1">{getFleschNote(analysis.fleschScore)}</div>
          </div>
          <div className="mt-2 text-sm text-[var(--color-text-primary)]">
            <div className="grid grid-cols-2 gap-1">
              <div>Characters: {analysis.charCount.toLocaleString()}</div>
              <div>Words: {analysis.wordCount.toLocaleString()}</div>
              <div>Sentences: {analysis.sentenceCount}</div>
              <div>Paragraphs: {analysis.paragraphCount}</div>
            </div>
            <div className="mt-1">Reading time: {formatReadingTime(analysis.readingTime)}</div>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-lg text-[var(--color-text-primary)] mb-3">Issues</h3>
          <div className="space-y-3">
            {Object.entries(
              analysis.issues.reduce((acc, issue) => {
                if (!acc[issue.type]) acc[issue.type] = [];
                acc[issue.type].push(issue);
                return acc;
              }, {} as Record<string, typeof analysis.issues>)
            ).map(([type, issues]) => (
              <div
                key={type}
                className="border border-[var(--color-border-primary)] rounded-lg p-3 hover:bg-[var(--color-background-tertiary)] cursor-pointer transition-colors"
                onMouseEnter={() => onHoverIssue?.(type)}
                onMouseLeave={() => onHoverIssue?.(null)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize text-[var(--color-text-primary)] text-sm">{type}</span>
                  <span className="text-lg font-bold" style={{ color: getIssueColor(type) }}>{issues.length}</span>
                </div>
                {issues[0]?.suggestion && (
                  <div className="text-xs text-[var(--color-accent-primary)] mt-1">{issues[0].suggestion}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-3 h-3 rounded-full ${aiStatus === 'connected' ? 'bg-[var(--color-status-success)]' : aiStatus === 'connecting' ? 'bg-[var(--color-status-warning)]' : 'bg-[var(--color-status-error)]'}`}
            ></div>
            <span className="text-sm text-[var(--color-text-primary)]">AI Connection Status: {aiStatus}</span>
          </div>
          <button
            onClick={handleEvaluate}
            disabled={isEvaluating || !text.trim() || aiStatus !== 'connected'}
            className="w-full px-3 py-2 bg-[var(--color-status-success)] text-[var(--color-accent-text)] rounded hover:bg-[var(--color-status-warning)] disabled:bg-[var(--color-text-disabled)] disabled:text-[var(--color-text-secondary)] disabled:cursor-not-allowed"
          >
            {isEvaluating ? 'Evaluating...' : 'AI Evaluation'}
          </button>
        </div>

        {evaluation && (
          <div className="mt-2 space-y-2 text-sm text-[var(--color-text-primary)]">
            <div className="flex gap-4">
              <strong>Time taken: {(evaluation.timeTaken / 1000).toFixed(1)}s</strong>
              <strong>Tokens used: {evaluation.tokensUsed}</strong>
            </div>
            <div>
              <strong className="text-[var(--color-text-primary)]">Suggestions:</strong>
              <ul className="list-disc list-inside mt-1">
                {evaluation.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-[var(--color-text-primary)]">{suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
