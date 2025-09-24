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
}

export default function Editor({ value, onChange, isPreview, onAnalysisUpdate }: EditorProps) {
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
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }} />
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

function renderMarkdown(text: string): string {
  // Simple markdown renderer - in real app, use a library
  return text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)]*)\)/gim, '<img alt="$1" src="$2" />')
    .replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2">$1</a>')
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}
