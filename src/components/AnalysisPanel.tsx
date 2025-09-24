'use client';

import { useState, useEffect } from 'react';
import { AnalysisResult } from '@/lib/analysis';
import { EvaluationResult, evaluateText, getProviders } from '@/lib/ai';
import { loadSettings } from '@/lib/storage';

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  text: string;
  onHoverIssue?: (type: string | null) => void;
}

export default function AnalysisPanel({ analysis, text, onHoverIssue }: AnalysisPanelProps) {
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
      <h2 className="text-lg font-semibold mb-4 text-black">Analysis</h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm text-black">Statistics</h3>
          <div className="mt-2 space-y-1 text-sm text-black">
            <div>Words: {analysis.wordCount}</div>
            <div>Characters: {analysis.charCount}</div>
            <div>Sentences: {analysis.sentenceCount}</div>
            <div>Paragraphs: {analysis.paragraphCount}</div>
            <div>Reading Time: {analysis.readingTime.toFixed(1)} min</div>
            <div>
              Flesch Score: {analysis.fleschScore.toFixed(1)}{' '}
              <a
                href="https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                (?)
              </a>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-sm text-black mb-3">Issues</h3>
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
                  <span className="text-lg font-bold text-blue-600">{issues.length}</span>
                </div>
                <div className="text-xs text-gray-600">
                  {issues.length === 1
                    ? `"${issues[0].text}"`
                    : `${issues.length} instances found`
                  }
                </div>
                {issues[0]?.suggestion && (
                  <div className="text-xs text-blue-600 mt-1">{issues[0].suggestion}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <button
            onClick={handleEvaluate}
            disabled={isEvaluating || !text.trim()}
            className="w-full px-3 py-2 bg-green-500 text-black rounded hover:bg-green-600 disabled:bg-gray-300"
          >
            {isEvaluating ? 'Evaluating...' : 'AI Evaluation'}
          </button>
        </div>

        {evaluation && (
          <div>
            <h3 className="font-medium text-sm text-black">AI Evaluation</h3>
            <div className="mt-2 space-y-2 text-sm text-black">
              <div>Grammar: {evaluation.scores.grammar}/100</div>
              <div>Clarity: {evaluation.scores.clarity}/100</div>
              <div>Overall: {evaluation.scores.overall}/100</div>
              <div>
                <strong className="text-black">Suggestions:</strong>
                <ul className="list-disc list-inside mt-1">
                  {evaluation.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-black">{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
