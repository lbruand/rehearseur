import { RrwebPlayer } from './components/RrwebPlayer';
import './App.css';

function App() {
  const recordingUrl = "/recording_jupyterlite.json";
  const annotationsUrl = recordingUrl.replace(/\.json$/, '.annotations.md');

  return (
    <div className="app">
      <RrwebPlayer recordingUrl={recordingUrl} annotationsUrl={annotationsUrl} />
    </div>
  );
}

export default App;