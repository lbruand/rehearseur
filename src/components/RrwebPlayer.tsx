import { useEffect, useRef, useState } from 'react';
import rrwebPlayer from 'rrweb-player';
import { decode } from '@toon-format/toon';
import 'rrweb-player/dist/style.css';

interface RrwebPlayerProps {
  recordingUrl: string;
}

type PlayerInstance = rrwebPlayer & { $destroy?: () => void };

export function RrwebPlayer({ recordingUrl }: RrwebPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const distanceFromBottom = window.innerHeight - e.clientY;
      setShowControls(distanceFromBottom < 100);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    async function loadRecording() {
      if (!containerRef.current) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(recordingUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch recording: ${response.statusText}`);
        }

        let data;
        if (recordingUrl.endsWith('.toon')) {
          const text = await response.text();
          data = decode(text, { strict: false, indent: 2 });
        } else if (recordingUrl.endsWith('.gz')) {
          const decompressedStream = response.body!.pipeThrough(
            new DecompressionStream('gzip')
          );
          const decompressedResponse = new Response(decompressedStream);
          data = await decompressedResponse.json();
        } else {
          data = await response.json();
        }

        // Handle both raw event arrays and wrapped {events: [...]} format
        const events = Array.isArray(data) ? data : (data as { events: unknown[] }).events;

        if (playerRef.current) {
          playerRef.current.pause();
          playerRef.current.$destroy?.();
        }

        containerRef.current.innerHTML = '';

        playerRef.current = new rrwebPlayer({
          target: containerRef.current,
          props: {
            events,
            showController: true,
            autoPlay: false,
          },
        });

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recording');
        setLoading(false);
      }
    }

    loadRecording();

    return () => {
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.$destroy?.();
        playerRef.current = null;
      }
    };
  }, [recordingUrl]);

  return (
    <div className="rrweb-player-wrapper">
      {loading && <div className="loading">Loading recording...</div>}
      {error && <div className="error">Error: {error}</div>}
      <div ref={containerRef} className={`player-container ${showControls ? 'show-controls' : ''}`} />
    </div>
  );
}