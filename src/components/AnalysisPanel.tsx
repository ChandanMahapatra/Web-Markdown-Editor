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
    case 'adverb': return 'text-red-600';
    case 'passive': return 'text-orange-600';
    case 'complex': return 'text-purple-600';
    case 'qualifier': return 'text-green-600';
    default: return 'text-blue-600';
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
      const result = await evaluateText(text, provider, settings.model || provider.models[0], settings.apiKey, settings.baseURL);
      setEvaluation(result);
    } catch (error) {
      console.error('Evaluation failed:', error);
      alert('Evaluation failed. Check your settings and try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!analysis) {
    return (
      <div className="w-full h-full bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-black">Analysis</h2>
        <p className="text-gray-500">No analysis available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4 text-black">Analysis</h2>

      <div className="space-y-4">
        <div>
          <div className="text-lg"><strong className="text-black">Grade Level: {analysis.gradeLevel}</strong></div>
          <div className="mt-2 text-lg">
            <strong className="text-black">Score: {analysis.score.toFixed(1)}</strong><span className="text-black"> (</span>
            <a
              href="https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Flesch Score: {analysis.fleschScore.toFixed(1)}
            </a>
            <span className="text-black">)</span>
            <div className="text-sm text-gray-600 mt-1">{getFleschNote(analysis.fleschScore)}</div>
          </div>
          <div className="mt-2 text-sm text-black">
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
          <h3 className="font-medium text-lg text-black mb-3">Issues</h3>
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
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onMouseEnter={() => onHoverIssue?.(type)}
                onMouseLeave={() => onHoverIssue?.(null)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize text-black text-sm">{type}</span>
                  <span className={`text-lg font-bold ${getIssueColor(type)}`}>{issues.length}</span>
                </div>
                {issues[0]?.suggestion && (
                  <div className="text-xs text-blue-600 mt-1">{issues[0].suggestion}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-3 h-3 rounded-full ${aiStatus === 'connected' ? 'bg-green-500' : aiStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`}
            ></div>
            <span className="text-sm text-black">AI Connection Status: {aiStatus}</span>
          </div>
          <button
            onClick={handleEvaluate}
            disabled={isEvaluating || !text.trim() || aiStatus !== 'connected'}
            className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {isEvaluating ? 'Evaluating...' : 'AI Evaluation'}
          </button>
        </div>

        {evaluation && (
          <div className="mt-2 space-y-2 text-sm text-black">
            <div className="flex gap-4">
              <strong>Time taken: {(evaluation.timeTaken / 1000).toFixed(1)}s</strong>
              <strong>Tokens used: {evaluation.tokensUsed}</strong>
            </div>
            <div>
              <strong className="text-black">Suggestions:</strong>
              <ul className="list-disc list-inside mt-1">
                {evaluation.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-black">{suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
