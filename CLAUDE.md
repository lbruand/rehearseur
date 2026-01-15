# Claude Code Instructions for rrweb-driver-editor

## Project Overview

React application that replays rrweb session recordings with driver.js annotation overlays.

## Running Tests

### Prerequisites
```bash
pip install -r tests/requirements.txt
```

### Running Tests

1. **Start the dev server first** (required):
```bash
npm run dev
```

2. **Run all tests**:
```bash
pytest tests/test_rrweb_player.py -v
```

3. **For Firefox tests**, start Docker container first:
```bash
docker run -d --name selenium-firefox --network host --shm-size=2gb selenium/standalone-firefox:latest
```

### Test Commands

| Command | Description |
|---------|-------------|
| `pytest tests/test_rrweb_player.py -v` | Run all tests |
| `pytest tests/test_rrweb_player.py::TestDriverJsIntegration -v` | Driver.js overlay tests only |
| `pytest tests/test_rrweb_player.py::TestRrwebPlayer::test_page_loads -v` | Single test |

### Test Structure

- `tests/test_rrweb_player.py` - Selenium browser tests
  - `TestRrwebPlayer` - Basic player functionality
  - `TestDriverJsIntegration` - Driver.js annotation overlay tests
    - Uses Chromium (snap) and Firefox (Docker)

### Important Notes

- Dev server runs on `http://localhost:5174`
- Chromium binary: `/snap/bin/chromium`
- Firefox connects to: `http://localhost:4444/wd/hub`
- Tests run in headless mode
- The iframe sandbox is removed to allow driver.js to work

## Development

```bash
npm install    # Install dependencies
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # Run linter
```