'use client';

import { useState } from 'react';
import { AnalysisResult } from '@/lib/analysis';
import { EvaluationResult, evaluateText, getProviders } from '@/lib/ai';

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  text: string;
}

export default function AnalysisPanel({ analysis, text }: AnalysisPanelProps) {
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleEvaluate = async () => {
    if (!text.trim()) return;

    setIsEvaluating(true);
    try {
      // For now, use mock provider
      const providers = await getProviders();
      const provider = providers[0]; // OpenAI as default
      const result = await evaluateText(text, provider, provider.models[0]);
      setEvaluation(result);
    } catch (error) {
      console.error('Evaluation failed:', error);
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
            <div>Flesch Score: {analysis.fleschScore.toFixed(1)}</div>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-sm text-black">Issues ({analysis.issues.length})</h3>
          <div className="mt-2 space-y-2">
            {analysis.issues.slice(0, 10).map((issue, index) => (
              <div key={index} className="border border-gray-200 rounded p-2 text-xs">
                <div className="font-medium capitalize text-black">{issue.type}</div>
                <div className="text-black">&ldquo;{issue.text}&rdquo;</div>
                {issue.suggestion && (
                  <div className="text-blue-600 mt-1">{issue.suggestion}</div>
                )}
              </div>
            ))}
            {analysis.issues.length > 10 && (
              <div className="text-xs text-gray-500">
                ... and {analysis.issues.length - 10} more
              </div>
            )}
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
