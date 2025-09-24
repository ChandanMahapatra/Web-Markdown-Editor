'use client';

import { useState, useEffect } from 'react';
import Editor from '@/components/Editor';
import AnalysisPanel from '@/components/AnalysisPanel';
import SettingsModal from '@/components/SettingsModal';
import { AnalysisResult } from '@/lib/analysis';
import { EvaluationResult, getProviders, testConnection } from '@/lib/ai';
import { downloadFile, markdownToHtml, exportToPdf } from '@/lib/export';
import { loadSettings } from '@/lib/storage';

export default function Home() {
  const [markdown, setMarkdown] = useState(`# Welcome to Markdown Editor

This is a privacy-first markdown editor that works entirely in your browser. All analysis and editing happens locally - no data is sent to external servers unless you explicitly enable AI evaluation.

## Getting Started

Start writing your markdown content below. The editor provides real-time analysis including:

- Word and character counts
- Readability scoring
- Grammar and style suggestions
- Passive voice detection
- Complex sentence identification

## Features

- **Local Analysis**: Instant feedback without internet connection
- **AI Evaluation**: Optional AI-powered suggestions (requires provider setup)
- **Export Options**: Download as Markdown, HTML, or PDF
- **Privacy First**: Your content stays on your device

## Sample Content

Here's some sample text to demonstrate the analysis features:

> The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet and is often used for testing purposes. It demonstrates basic sentence structure and can be analyzed for readability.

Some people write very long sentences that contain multiple clauses and ideas, which can make the text harder to read and understand. Shorter sentences are generally easier to follow.

**Bold text** and *italic text* can be used for emphasis. Code blocks \`like this\` highlight technical terms.

### Lists

- Item one
- Item two
- Item three

1. Numbered item
2. Another numbered item

### Links and Images

[Markdown Guide](https://www.markdownguide.org/)

![Sample Image](https://via.placeholder.com/300x200?text=Sample+Image)

---

Feel free to edit this content or start fresh with your own writing!`);
  const [isPreview, setIsPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [hoveredIssueType, setHoveredIssueType] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<'disconnected' | 'connected' | 'connecting'>('disconnected');

  const checkAIStatus = async () => {
    const settings = await loadSettings();
    if (!settings?.provider || settings.provider === '') {
      setAiStatus('disconnected');
      return;
    }
    setAiStatus('connecting');
    const providers = await getProviders();
    const provider = providers.find(p => p.id === settings.provider);
    if (!provider) {
      setAiStatus('disconnected');
      return;
    }
    const connected = await testConnection(provider, settings.apiKey, settings.baseURL);
    setAiStatus(connected ? 'connected' : 'disconnected');
  };

  useEffect(() => {
    checkAIStatus();
  }, []);

  const handleSave = async () => {
    // Save to IndexedDB
    await import('@/lib/storage').then(({ saveDocument }) => {
      const id = 'current-doc'; // For now, single document
      const title = markdown.split('\n')[0].replace(/^#+\s*/, '') || 'Untitled';
      saveDocument(id, title, markdown);
    });
  };

  const handleExport = (format: 'md' | 'html' | 'pdf') => {
    setShowExport(false);
    const title = markdown.split('\n')[0].replace(/^#+\s*/, '') || 'Untitled';

    if (format === 'md') {
      downloadFile(`${title}.md`, markdown);
    } else if (format === 'html') {
      const html = markdownToHtml(markdown);
      downloadFile(`${title}.html`, html);
    } else if (format === 'pdf') {
      exportToPdf(markdown, title);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-black">Markdown Editor</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isPreview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={() => handleSave()}
            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Save
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Export ▼
            </button>
            {showExport && (
              <div className="absolute top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-[140px]">
                <button
                  onClick={() => handleExport('md')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 text-black"
                >
                  📄 Export as MD
                </button>
                <button
                  onClick={() => handleExport('html')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 text-black"
                >
                  🌐 Export as HTML
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 text-black"
                >
                  📕 Export as PDF
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Settings
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 min-w-0">
          <Editor
            value={markdown}
            onChange={setMarkdown}
            isPreview={isPreview}
            onAnalysisUpdate={setAnalysis}
            hoveredIssueType={hoveredIssueType}
            analysis={analysis}
          />
        </div>
        <div className="w-[30%] min-w-[420px] max-w-[420px]">
          <AnalysisPanel
            analysis={analysis}
            text={markdown}
            onHoverIssue={setHoveredIssueType}
            aiStatus={aiStatus}
          />
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={(saved) => { if (saved) checkAIStatus(); setShowSettings(false); }} />
      )}
    </div>
  );
}
