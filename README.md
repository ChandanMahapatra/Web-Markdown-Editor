# Web Markdown Editor

A privacy-first, local-first single-page Next.js markdown editor that runs entirely in the browser. Features instant local analysis, optional AI evaluation via configurable providers, and static export for GitHub Pages deployment.

## Features

- **Local-first**: All editing and basic analysis work offline without network calls
- **Real-time Analysis**: Word count, readability scoring, grammar suggestions, and issue detection
- **AI Evaluation**: Optional AI-powered feedback using providers from ai-sdk registry
- **Rich Editor**: CodeMirror-based markdown editor with syntax highlighting and preview mode
- **Export Options**: Download as Markdown, HTML, or PDF
- **Storage**: IndexedDB for local document storage
- **Static Deployment**: Built for GitHub Pages with zero server requirements

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the editor.

### Build for Production

```bash
npm run build
```

### Static Export for GitHub Pages

```bash
npm run export
```

The `out/` directory contains the static files ready for deployment.

## Architecture

- **Frontend**: Next.js 15 with App Router, configured for static export
- **Editor**: CodeMirror 6 with markdown language support
- **Styling**: Tailwind CSS
- **Storage**: IndexedDB via idb library
- **Analysis**: Custom TypeScript algorithms for real-time text analysis
- **AI Integration**: Client-side provider wrappers (currently mocked)
- **Export**: jsPDF + html2canvas for PDF, custom HTML generation

## Deployment

This app is designed for static hosting on GitHub Pages:

1. Build the project: `npm run export`
2. Deploy the `out/` directory to GitHub Pages
3. Access via `https://<username>.github.io/<repo>/`

## Privacy & Security

- No telemetry or external calls without explicit user consent
- All analysis runs locally in the browser
- AI features require user to configure providers and accept terms
- Documents stored locally in IndexedDB (no cloud sync)

## Browser Support

- Modern Chromium-based browsers (Chrome, Edge)
- Firefox
- Safari (limited testing)

## Contributing

This is a complete MVP implementation. Areas for enhancement:

- Real AI provider integration with ai-sdk
- Multiple document management
- Enhanced markdown rendering
- Keyboard shortcuts
- Mobile responsiveness improvements
