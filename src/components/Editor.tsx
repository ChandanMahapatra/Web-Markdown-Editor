'use client';

import { useEffect, useRef } from 'react';
import { EditorView, keymap, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLineGutter, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldKeymap } from '@codemirror/language';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentWithTab } from '@codemirror/commands';
import { analyzeText, AnalysisResult } from '@/lib/analysis';
import EditorToolbar from './EditorToolbar';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  isPreview: boolean;
  onAnalysisUpdate: (analysis: AnalysisResult) => void;
  hoveredIssueType?: string | null;
  analysis?: AnalysisResult | null;
}

export default function Editor({ value, onChange, isPreview, onAnalysisUpdate, hoveredIssueType, analysis }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current || isPreview) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
        ]),
        markdown(),
        oneDark,
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-editor': { height: '100%' },
          '.cm-scroller': { height: '100%' }
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
            onChange(newValue);
            const analysis = analyzeText(newValue);
            onAnalysisUpdate(analysis);
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [isPreview]);

  useEffect(() => {
    if (viewRef.current && !isPreview) {
      const currentValue = viewRef.current.state.doc.toString();
      if (currentValue !== value) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentValue.length, insert: value },
        });
      }
    }
  }, [value, isPreview]);

  useEffect(() => {
    if (!isPreview) {
      const analysis = analyzeText(value);
      onAnalysisUpdate(analysis);
    }
  }, [value, isPreview, onAnalysisUpdate]);

  const handleInsert = (before: string, after = '') => {
    if (!viewRef.current) return;

    const view = viewRef.current;
    const state = view.state;
    const selection = state.selection.main;

    if (selection.empty) {
      // No selection, insert at cursor
      view.dispatch({
        changes: { from: selection.head, insert: before + after },
        selection: { anchor: selection.head + before.length }
      });
    } else {
      // Wrap selected text
      view.dispatch({
        changes: [
          { from: selection.from, insert: before },
          { from: selection.to, insert: after }
        ],
        selection: { anchor: selection.from + before.length, head: selection.to + before.length }
      });
    }

    view.focus();
  };

  if (isPreview) {
    return (
      <div className="h-full p-4 prose max-w-none overflow-auto bg-gray-50 text-black">
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(value, analysis, hoveredIssueType) }} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <EditorToolbar onInsert={handleInsert} />
      <div ref={editorRef} className="flex-1 overflow-auto" />
    </div>
  );
}

function getHighlightColor(type: string): string {
  switch (type) {
    case 'adverb': return '#DC2626'; // red-600
    case 'passive': return '#EA580C'; // orange-600
    case 'complex': return '#9333EA'; // purple-600
    case 'qualifier': return '#16A34A'; // green-600
    default: return '#2563EB'; // blue-600
  }
}

function renderMarkdown(text: string, analysis?: AnalysisResult | null, hoveredIssueType?: string | null): string {
  // Simple markdown renderer - in real app, use a library
  let processedText = text;
  if (hoveredIssueType && analysis) {
    const issues = analysis.issues.filter(i => i.type === hoveredIssueType);
    for (const issue of issues) {
      const escaped = issue.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const color = getHighlightColor(hoveredIssueType);
      processedText = processedText.replace(new RegExp(escaped, 'g'), `<mark style="background-color: ${color}; color: white;">${issue.text}</mark>`);
    }
  }
  return processedText
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-400 pl-4 italic text-gray-700 my-4">$1</blockquote>')
    .replace(/^---$/gm, '<hr class="w-full border-t border-gray-300 my-4">')
    .replace(/\*\*(.*)\*\*/gim, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)]*)\)/gim, '<img alt="$1" src="$2" class="max-w-full h-auto" />')
    .replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2" class="text-blue-600 underline">$1</a>')
    .replace(/\n\n/gim, '</p><p class="mb-4">')
    .replace(/\n/gim, '<br/>')
    .replace(/^/, '<p class="mb-4">')
    .replace(/$/, '</p>');
}
