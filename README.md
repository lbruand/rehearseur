# rrweb-driver-editor

A React application that replays [rrweb](https://github.com/rrweb-io/rrweb) recordings.

## Features

- Replays rrweb session recordings ( you can use for instance for the [rrweb chrome extension](https://github.com/rrweb-io/rrweb/tree/master/packages/web-extension) for the that)
- Supports both raw event arrays and wrapped `{events: [...]}` JSON formats
- Supports gzip-compressed recordings (`.json.gz`)
- Playback controls (play/pause, speed, progress bar)
- Support hierarchical annotation bookmarks to go around the demo quickly

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

## Running Tests

The project includes Selenium tests for browser automation testing.

### Prerequisites

```bash
pip install -r tests/requirements.txt
```

### Running tests with Chromium

```bash
# Start the dev server
npm run dev

# In another terminal, run the tests
pytest tests/test_rrweb_player.py -v
```

### Running tests with Firefox (via Docker)

Firefox tests run in a Docker container to avoid snap compatibility issues:

```bash
# Start the Selenium Firefox container
docker run -d --name selenium-firefox --network host --shm-size=2gb selenium/standalone-firefox:latest

# Run the tests
pytest tests/test_rrweb_player.py -v

# Stop the container when done
docker stop selenium-firefox && docker rm selenium-firefox
```

### Running specific tests

```bash
# Run only the driver.js overlay tests
pytest tests/test_rrweb_player.py::TestDriverJsIntegration -v

# Run a single test
pytest tests/test_rrweb_player.py::TestRrwebPlayer::test_page_loads -v
```

## Tech Stack

- React 19
- TypeScript
- Vite
- rrweb-player