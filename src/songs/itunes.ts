export interface SongHit {
  id: number;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  artworkLarge: string;
  previewUrl: string;
  genre: string;
  year: number | null;
  durationMs: number | null;
  storeUrl: string;
}

interface ItunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  primaryGenreName?: string;
  releaseDate?: string;
  trackTimeMillis?: number;
  trackViewUrl?: string;
}

export class SearchError extends Error {}

function storeCountry(): string {
  const region = navigator.language.split('-')[1];
  return region && /^[A-Z]{2}$/.test(region) ? region : 'US';
}

/** Search songs through Apple's free public iTunes Search API (no account needed). */
export async function searchSongs(term: string, signal?: AbortSignal): Promise<SongHit[]> {
  const q = term.trim();
  if (!q) return [];
  const url = `https://itunes.apple.com/search?media=music&entity=song&limit=20&country=${storeCountry()}&term=${encodeURIComponent(q)}`;
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if ((err as DOMException)?.name === 'AbortError') throw err;
    throw new SearchError('Song search needs an internet connection. You can still type chords or use a file.');
  }
  if (!res.ok) throw new SearchError('The song search service did not answer. Try again in a moment.');
  const data = (await res.json()) as { results: ItunesTrack[] };
  return data.results
    .filter((t) => t.previewUrl)
    .map((t) => ({
      id: t.trackId,
      title: t.trackName,
      artist: t.artistName,
      album: t.collectionName ?? '',
      artwork: t.artworkUrl100 ?? '',
      artworkLarge: (t.artworkUrl100 ?? '').replace('100x100bb', '600x600bb'),
      previewUrl: t.previewUrl!,
      genre: t.primaryGenreName ?? '',
      year: t.releaseDate ? new Date(t.releaseDate).getFullYear() : null,
      durationMs: t.trackTimeMillis ?? null,
      storeUrl: t.trackViewUrl ?? '',
    }));
}

export async function fetchPreview(hit: SongHit, signal?: AbortSignal): Promise<ArrayBuffer> {
  let res: Response;
  try {
    res = await fetch(hit.previewUrl, { signal });
  } catch (err) {
    if ((err as DOMException)?.name === 'AbortError') throw err;
    throw new SearchError('Could not download the song preview. Check your connection and try again.');
  }
  if (!res.ok) throw new SearchError('This song preview is not available right now. Try another version of the song.');
  return res.arrayBuffer();
}
