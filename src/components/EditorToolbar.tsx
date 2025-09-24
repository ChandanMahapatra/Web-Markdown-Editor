'use client';

interface EditorToolbarProps {
  onInsert: (before: string, after?: string) => void;
}

export default function EditorToolbar({ onInsert }: EditorToolbarProps) {
  const actions = [
    { label: 'H1', before: '# ', tooltip: 'Heading 1' },
    { label: 'H2', before: '## ', tooltip: 'Heading 2' },
    { label: 'H3', before: '### ', tooltip: 'Heading 3' },
    { label: 'Bold', before: '**', after: '**', tooltip: 'Bold' },
    { label: 'Italic', before: '*', after: '*', tooltip: 'Italic' },
    { label: 'Link', before: '[', after: '](url)', tooltip: 'Link' },
    { label: 'List', before: '- ', tooltip: 'Bullet List' },
    { label: 'Numbered', before: '1. ', tooltip: 'Numbered List' },
    { label: 'Quote', before: '> ', tooltip: 'Quote' },
  ];

  return (
    <div className="bg-[var(--color-background-secondary)] border-b border-[var(--color-border-primary)] px-4 py-2 flex flex-wrap gap-1">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => onInsert(action.before, action.after)}
          className="px-3 py-1 bg-[var(--color-background-primary)] border border-[var(--color-border-primary)] rounded text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-background-tertiary)] hover:border-[var(--color-accent-primary)] transition-colors"
          title={action.tooltip}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
