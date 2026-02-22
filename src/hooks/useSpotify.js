import { useState, useCallback, useRef } from 'react';

const SPOTIFY_API = 'https://api.spotify.com/v1';

// Demo/mock results when no API key is configured
const mockResults = [
  { id: 'mock1', name: 'Chaiyya Chaiyya', artist: 'Sukhwinder Singh', album: 'Dil Se', albumArt: '', duration: '4:58', uri: 'spotify:track:mock1' },
  { id: 'mock2', name: 'London Thumakda', artist: 'Labh Janjua', album: 'Queen', albumArt: '', duration: '3:42', uri: 'spotify:track:mock2' },
  { id: 'mock3', name: 'Nagada Sang Dhol', artist: 'Shreya Ghoshal', album: 'Goliyon Ki Raasleela Ram-Leela', albumArt: '', duration: '4:48', uri: 'spotify:track:mock3' },
  { id: 'mock4', name: 'Gallan Goodiyaan', artist: 'Shankar Mahadevan', album: 'Dil Dhadakne Do', albumArt: '', duration: '4:25', uri: 'spotify:track:mock4' },
  { id: 'mock5', name: 'Tum Hi Ho', artist: 'Arijit Singh', album: 'Aashiqui 2', albumArt: '', duration: '4:22', uri: 'spotify:track:mock5' },
  { id: 'mock6', name: 'Mere Papa', artist: 'Tulsi Kumar', album: 'Single', albumArt: '', duration: '3:15', uri: 'spotify:track:mock6' },
  { id: 'mock7', name: 'Perfect', artist: 'Ed Sheeran', album: '÷ (Divide)', albumArt: '', duration: '4:23', uri: 'spotify:track:mock7' },
  { id: 'mock8', name: 'Cheap Thrills', artist: 'Sia', album: 'This Is Acting', albumArt: '', duration: '3:31', uri: 'spotify:track:mock8' },
];

export function useSpotify() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const tokenRef = useRef(null);
  const tokenExpiryRef = useRef(0);
  const debounceRef = useRef(null);

  const getToken = useCallback(async () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) return null;
    if (tokenRef.current && Date.now() < tokenExpiryRef.current) return tokenRef.current;

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
        },
        body: 'grant_type=client_credentials',
      });
      const data = await response.json();
      tokenRef.current = data.access_token;
      tokenExpiryRef.current = Date.now() + (data.expires_in - 60) * 1000;
      return data.access_token;
    } catch {
      return null;
    }
  }, []);

  const search = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      const token = await getToken();

      if (!token) {
        // Use mock results filtered by query
        const q = query.toLowerCase();
        const filtered = mockResults.filter(
          (t) => t.name.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
        );
        setResults(filtered.length > 0 ? filtered : mockResults.slice(0, 5));
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${SPOTIFY_API}/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = await response.json();
        const tracks = (data.tracks?.items || []).map((track) => ({
          id: track.id,
          name: track.name,
          artist: track.artists.map((a) => a.name).join(', '),
          album: track.album.name,
          albumArt: track.album.images?.[1]?.url || track.album.images?.[0]?.url || '',
          duration: formatDuration(track.duration_ms),
          uri: track.uri,
        }));
        setResults(tracks);
      } catch (err) {
        setError('Search failed. Using demo results.');
        const q = query.toLowerCase();
        const filtered = mockResults.filter(
          (t) => t.name.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
        );
        setResults(filtered.length > 0 ? filtered : mockResults.slice(0, 5));
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [getToken]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clearResults };
}

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
