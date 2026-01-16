import { RrwebPlayer } from './components/RrwebPlayer';
import { CONFIG } from './constants/config';
import './App.css';

function App() {
  const recordingUrl = CONFIG.RECORDING.DEFAULT_URL;
  const annotationsUrl = recordingUrl.replace(/\.json$/, CONFIG.RECORDING.ANNOTATIONS_SUFFIX);

  return (
    <div className="app">
      <RrwebPlayer recordingUrl={recordingUrl} annotationsUrl={annotationsUrl} />
    </div>
  );
}

export default App;