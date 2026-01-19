# Web Markdown Editor

<img width="1280" height="800" alt="Screen Shot 2025-09-24 at 15 33 31" src="https://github.com/user-attachments/assets/3e8e325e-ab50-4ce5-b98e-b8f8767c91b1" />


A privacy-first, local-first single-page Next.js markdown editor that runs entirely in the browser. This app was "vibe coded" with AI assistance, emphasizing privacy and local processing. Features instant local analysis, optional AI evaluation via configurable providers (including local models), and static export for GitHub Pages deployment.

**Key Philosophy**: All data stays local. No analytics, no telemetry, no external data collection. AI features are optional and run locally or through user-configured providers only.

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
npm run build
```

The `out/` directory contains the static files ready for deployment.

**Note**: API routes in this project (proxy, test endpoints) are only available during local development with `npm run dev`. When deploying as a static site to GitHub Pages or similar platforms, these API routes are not available. Use cloud AI providers (OpenRouter, OpenAI, Anthropic) for full functionality in production deployments.

## AI Setup (Optional)

The app supports optional AI evaluation for grammar, clarity, and overall quality. AI features are completely optional and run locally or through user-configured providers.

### Local AI with LM Studio

For maximum privacy, use LM Studio to run AI models locally. **Note**: Local AI only works when running the app locally (npm run dev), not on the deployed GitHub Pages version due to HTTPS mixed content restrictions.

1. **Download and Install LM Studio**: Get it from [https://lmstudio.ai/](https://lmstudio.ai/)

2. **Download Gemma 12B Model**:
   - In LM Studio, go to "My Models" → "Download Models"
   - Search for "gemma-2-12b-it" or similar Gemma 12B variant
   - Download and load the model

3. **Start Local Server**:
   - In LM Studio, go to "Local Server"
   - Select the Gemma 12B model
   - Set port to 1234 (default)
   - Toggle CORS switch if necessary
   - Start the server

4. **Run App Locally**:
   - Use `npm run dev` to start the local development server
   - Open http://localhost:3000

5. **Configure in App**:
   - Go to Settings → AI Configuration
   - Select "LM Studio (Local)" as provider
   - Add model name (e.g., "gemma-2-12b-it")
   - Base URL should be `http://localhost:1234/v1`
   - No API key required for local models
   - Test connection and save

6. **Use AI Evaluation**:
   - Write or paste markdown text
   - Click "Evaluate with AI" in the Analysis panel
   - Get grammar, clarity scores and suggestions

### Cloud AI Providers

The app also supports cloud AI providers for evaluation:
- **OpenRouter**: Requires API key, access to multiple models from one key (get it from [openrouter.ai](https://openrouter.ai))
  - Popular models: `anthropic/claude-3.5-sonnet`, `openai/gpt-4o`, `google/gemini-pro-1.5`
- **OpenAI**: Requires API key, connects to OpenAI's servers
- **Anthropic**: Requires API key, connects to Anthropic's servers
- **Ollama**: Local models via Ollama (alternative to LM Studio)

All AI evaluations are processed client-side or through direct API calls - no data is sent to external analytics services (unless you configure Google Analytics).

### HTTPS Mixed Content Limitation

**Important**: When the app is deployed on HTTPS (like GitHub Pages), it cannot connect to local HTTP servers due to browser security restrictions. This means:

- ✅ **Local development** (`npm run dev`): Local AI works perfectly
- ❌ **Deployed HTTPS version**: Local AI providers are automatically hidden
- ✅ **Cloud providers** (OpenAI, Anthropic): Work on both local and deployed versions

#### Workarounds for Using Local AI with Deployed App:

1. **HTTPS Local Server**: Set up a reverse proxy (nginx/Caddy) with SSL certificates for your local AI server
2. **mkcert**: Use mkcert to create local SSL certificates for LM Studio/Ollama
3. **Development Mode**: Use the local development server for local AI features

## Google Analytics Configuration (Optional)

The app supports Google Analytics 4 to track:
- Page views and visitor statistics
- User location (via Google Analytics)
- Settings modal opens
- AI provider selection and usage

### Setup

1. **Create a Google Analytics Property**:
   - Go to [Google Analytics](https://analytics.google.com/)
   - Create a new property (Web)
   - Get your Measurement ID (starts with "G-")

2. **Configure Environment Variable**:
   - Create a `.env.local` file in the project root
   - Add your GA Measurement ID:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

3. **Restart Development Server**:
   ```bash
   npm run dev
   ```

### Tracked Events

- `settings_modal_opened`: User opens settings modal
- `ai_provider_selected`: User selects an AI provider (label shows provider name)
- `ai_evaluation_completed`: User completes an AI evaluation (label shows provider ID)

**Note**: Analytics is completely optional. If `NEXT_PUBLIC_GA_MEASUREMENT_ID` is not set, no tracking code will run.

## Architecture

- **Frontend**: Next.js 15 with App Router, configured for static export
- **Editor**: CodeMirror 6 with markdown language support
- **Styling**: Tailwind CSS
- **Storage**: IndexedDB via idb library
- **Analysis**: Custom TypeScript algorithms for real-time text analysis
- **AI Integration**: Client-side provider wrappers for OpenRouter, Anthropic, OpenAI, and local models
- **Export**: jsPDF + html2canvas for PDF, custom HTML generation
- **Analytics**: Google Analytics 4 for optional visitor and usage tracking

## Deployment

This app is designed for static hosting on GitHub Pages:

1. Build the project: `npm run build`
2. Deploy the `out/` directory to GitHub Pages
3. Access via `https://<username>.github.io/<repo>/`

## Privacy & Security

- **No Telemetry**: Next.js telemetry is disabled in development and build scripts
- **Optional Analytics**: Google Analytics can be configured via environment variable (off by default)
- **No external calls without explicit user consent**
- **All analysis runs locally in browser**
- **AI features require user to configure providers and accept terms**
- **Documents stored locally in IndexedDB (no cloud sync)**

## Browser Support

- Modern Chromium-based browsers (Chrome, Edge)
- Firefox
- Safari (limited testing)
