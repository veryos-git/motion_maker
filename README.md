# Motion Maker

Stop-motion animation web application. Upload image sequences, adjust playback, apply image corrections, crop, and export as animated GIF.

## Prerequisites

- **Deno** 2.x or later — [install](https://deno.com)
- **Node.js** 18+ (for frontend build)
- **ffmpeg** 6.x or later — `sudo apt install ffmpeg` (Linux), `brew install ffmpeg` (macOS), or [ffmpeg.org](https://ffmpeg.org)

## Quick Start

```bash
deno task start
```

This single command:
1. Checks that ffmpeg is available (exits with a clear message if missing).
2. Installs frontend dependencies (`npm install` in `client/`).
3. Builds the Vue frontend (`npm run build`).
4. Starts the Deno HTTP server on port 3000 (`PORT=8080` to customize).

Open `http://localhost:3000` in your browser.

## Development

```bash
deno task dev
```

Starts the Deno server with file watching. For frontend hot-reload, run separately:

```bash
cd client && npm run dev
```

The Vite dev server proxies `/api` requests to `localhost:3000`.

## Project Structure

```
├── deno.json              Task definitions (start, dev)
├── server/
│   ├── main.ts            Entry point, static file serving, API router
│   ├── routes/
│   │   └── projects.ts    API route handlers
│   ├── services/
│   │   ├── ffmpeg.ts      ffmpeg subprocess wrapper
│   │   └── projectStore.ts JSON file project persistence
│   └── projects/          Project data (gitignored)
├── client/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── App.vue        Main application layout
│   │   ├── main.ts        Vue entry point
│   │   ├── api/index.ts   API client
│   │   ├── composables/
│   │   │   ├── useProject.ts     Project state management
│   │   │   └── useDragResize.ts  Drag/resize logic for panels
│   │   └── components/
│   │       ├── OverlayWindow.vue    Reusable draggable panel
│   │       ├── FrameSequencer.vue   Upload, reorder, delete frames
│   │       ├── PlaybackControls.vue FPS, play/pause, timeline
│   │       ├── ImageAdjustments.vue Brightness, contrast, shadows, highlights
│   │       ├── CropTool.vue         Crop region definition
│   │       └── ExportPanel.vue      GIF export settings & download
│   └── index.html
└── README.md
```

## API

| Method | Path | Description |
|--------|------|-------------|
| POST   | /api/projects | Create a new project |
| GET    | /api/projects/:id | Get project state |
| POST   | /api/projects/:id/frames | Upload frames (multipart) |
| DELETE | /api/projects/:id/frames/:frameId | Remove a frame |
| PUT    | /api/projects/:id/frames/reorder | Update frame order |
| POST   | /api/projects/:id/preview | Generate mp4 preview via ffmpeg |
| POST   | /api/projects/:id/export | Export animated GIF via ffmpeg |
| PUT    | /api/projects/:id/settings | Update FPS, crop, adjustments |

## Data Storage

All project data is persisted as flat JSON files under `server/projects/<id>/`. No database required. Uploaded frames are stored as image files in `server/projects/<id>/frames/`.
