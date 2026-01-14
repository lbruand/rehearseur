# rrweb-driver-editor

A React application that replays [rrweb](https://github.com/rrweb-io/rrweb) recordings.

## Features

- Replays rrweb session recordings
- Supports both raw event arrays and wrapped `{events: [...]}` JSON formats
- Supports gzip-compressed recordings (`.json.gz`)
- Playback controls (play/pause, speed, progress bar)

## Getting Started

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

## Usage

Place your rrweb recording JSON file in the `public/` directory and update the `recordingUrl` prop in `src/App.tsx`:

```tsx
<RrwebPlayer recordingUrl="/your-recording.json" />
```

## Tech Stack

- React 19
- TypeScript
- Vite
- rrweb-player