import { useState } from 'react';
import { useMusic } from '../../hooks/useMusic';

export default function MusicSearch({ onSelect, placeholder = 'Search for a song...' }) {
  const { results, loading, search, clearResults, playPreview, stopPreview } = useMusic();
  const [query, setQuery] = useState('');
  const [playingId, setPlayingId] = useState(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    search(val);
  };

  const handleSelect = (track) => {
    stopPreview();
    setPlayingId(null);
    onSelect(track);
    setQuery('');
    clearResults();
  };

  const handlePreview = (e, track) => {
    e.stopPropagation();
    if (playingId === track.id) {
      stopPreview();
      setPlayingId(null);
    } else if (track.previewUrl) {
      playPreview(track.previewUrl);
      setPlayingId(track.id);
    }
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
        <div className="absolute z-30 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {results.map((track) => (
            <div
              key={track.id}
              onClick={() => handleSelect(track)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-stone-50 cursor-pointer transition-colors"
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
              {track.previewUrl && (
                <button
                  onClick={(e) => handlePreview(e, track)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer ${
                    playingId === track.id
                      ? 'bg-gold-100 text-gold-700'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                  title={playingId === track.id ? 'Stop preview' : 'Play 30s preview'}
                >
                  {playingId === track.id ? '⏸' : '▶'}
                </button>
              )}
              <span className="text-xs text-stone-400">{track.duration}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
