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
    { label: 'Code', before: '`', after: '`', tooltip: 'Inline Code' },
    { label: 'Link', before: '[', after: '](url)', tooltip: 'Link' },
    { label: 'List', before: '- ', tooltip: 'Bullet List' },
    { label: 'Numbered', before: '1. ', tooltip: 'Numbered List' },
    { label: 'Quote', before: '> ', tooltip: 'Quote' },
    { label: 'Code Block', before: '```\n', after: '\n```', tooltip: 'Code Block' },
  ];

  return (
    <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex flex-wrap gap-1">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => onInsert(action.before, action.after)}
          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-black hover:bg-gray-50 hover:border-gray-400 transition-colors"
          title={action.tooltip}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
