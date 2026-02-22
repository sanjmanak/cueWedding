import { useState, useCallback, useRef } from 'react';

const ITUNES_API = 'https://itunes.apple.com/search';

export function useMusic() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const audioRef = useRef(null);

  const search = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${ITUNES_API}?term=${encodeURIComponent(query)}&entity=song&limit=10`
        );
        const data = await response.json();
        const tracks = (data.results || []).map((track) => ({
          id: String(track.trackId),
          name: track.trackName,
          artist: track.artistName,
          album: track.collectionName,
          albumArt: track.artworkUrl100?.replace('100x100', '200x200') || '',
          duration: formatDuration(track.trackTimeMillis),
          previewUrl: track.previewUrl || '',
        }));
        setResults(tracks);
      } catch {
        setError('Search failed. Please try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  const playPreview = useCallback((previewUrl) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (previewUrl) {
      audioRef.current = new Audio(previewUrl);
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  return { results, loading, error, search, clearResults, playPreview, stopPreview };
}

function formatDuration(ms) {
  if (!ms) return '';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
