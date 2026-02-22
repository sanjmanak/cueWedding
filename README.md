# Cue — Wedding DJ Planning Platform

A premium React single-page application for planning Indian wedding entertainment. Built for Special Occasions DJ as an interactive client planning tool.

## Features

- **6-Phase Planning Flow**: Story, People, Soundtrack, Program, Details, Review
- **Spotify Integration**: Search and add songs via Spotify Web API (with demo fallback)
- **PDF Run Sheet Generation**: Download a complete run sheet for the DJ team
- **Demo Mode**: Pre-filled with sample data, localStorage persistence
- **Mobile-First Design**: Elegant, luxury-inspired aesthetic with Tailwind CSS

## Tech Stack

- React 19 with Hooks
- Vite 7 for build tooling
- Tailwind CSS v4
- React Router v7 (HashRouter for GitHub Pages)
- jsPDF for PDF generation
- canvas-confetti for celebrations

## Getting Started

```bash
npm install
npm run dev
```

## Spotify API (Optional)

Create a `.env` file with your Spotify credentials:

```
VITE_SPOTIFY_CLIENT_ID=your_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_client_secret
```

Without these, the app uses demo/mock search results.

## Deployment

Configured for GitHub Pages at `/cueWedding/`.

```bash
npm run build
```

The `dist/` folder can be deployed to any static host. For GitHub Pages, push the `dist/` contents to the `gh-pages` branch or configure GitHub Actions.
