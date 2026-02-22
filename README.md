# Cue — Wedding DJ Planning Platform

A premium React single-page application for planning Indian wedding entertainment. Built for Special Occasions DJ as an interactive client planning tool.

## Features

- **6-Phase Planning Flow**: Story, People, Soundtrack, Program, Details, Review
- **iTunes Music Search**: Search songs via iTunes API (free, no auth required) with 30-second audio previews
- **PDF Run Sheet Generation**: Download a complete run sheet for the DJ team
- **Demo Mode**: Pre-filled with sample data, localStorage persistence
- **Mobile-First Design**: Elegant, luxury-inspired aesthetic with Tailwind CSS

## Tech Stack

- React 19 with Hooks
- Vite 7 for build tooling
- Tailwind CSS v4
- React Router v7 (HashRouter for GitHub Pages)
- iTunes Search API for song lookup
- jsPDF for PDF generation
- canvas-confetti for celebrations

## Getting Started

```bash
npm install
npm run dev
```

No API keys needed — the iTunes Search API is free and requires no authentication.

## Deployment

Configured for GitHub Pages at `/cueWedding/`.

```bash
npm run build
```

The `dist/` folder can be deployed to any static host. For GitHub Pages, push the `dist/` contents to the `gh-pages` branch or configure GitHub Actions.
