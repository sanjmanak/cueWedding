import { useState } from 'react';
import { useSpotify } from '../../hooks/useSpotify';

export default function SpotifySearch({ onSelect, placeholder = 'Search for a song...' }) {
  const { results, loading, search, clearResults } = useSpotify();
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    search(val);
  };

  const handleSelect = (track) => {
    onSelect(track);
    setQuery('');
    clearResults();
  };

  return (
    <div className="relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent hover:border-stone-400"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
            Searching...
          </span>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((track) => (
            <button
              key={track.id}
              onClick={() => handleSelect(track)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-stone-50 text-left transition-colors cursor-pointer"
            >
              {track.albumArt ? (
                <img src={track.albumArt} alt="" className="w-10 h-10 rounded object-cover" />
              ) : (
                <div className="w-10 h-10 rounded bg-stone-200 flex items-center justify-center text-stone-400 text-lg">
                  ♫
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">{track.name}</p>
                <p className="text-xs text-stone-500 truncate">{track.artist}</p>
              </div>
              <span className="text-xs text-stone-400">{track.duration}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
