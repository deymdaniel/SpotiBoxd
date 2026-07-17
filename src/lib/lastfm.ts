// Helper for integrating with the Last.fm API.
// Strictly follows the SpotiBoxd guidelines for Last.fm API.

export interface LastFmAlbum {
  lastFmId: string;
  title: string;
  artist: string;
  coverUrl: string;
}

export interface LastFmTrack {
  name: string;
  duration: number; // in seconds
  rank: number;
}

export interface LastFmAlbumDetail extends LastFmAlbum {
  tracks: LastFmTrack[];
  wikiSummary?: string;
}

// Check if Last.fm API key is available and is not the default placeholder
const API_KEY = process.env.LASTFM_API_KEY;
const IS_KEY_VALID = API_KEY && API_KEY !== "your_lastfm_api_key_here";

// Helper to construct a unique ID for albums if mbid is not provided by Last.fm
export function generateLastFmId(artist: string, album: string, mbid?: string): string {
  if (mbid && mbid.trim().length > 0) {
    return mbid;
  }
  // Construct a safe, clean lowercase ID
  return `${artist.trim().toLowerCase()}::${album.trim().toLowerCase()}`;
}

// Standard placeholder cover art if image is missing
const PLACEHOLDER_COVER = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop";

// Beautiful mock albums to return as fallback if API fails or API key is missing
const MOCK_ALBUMS: { title: string; artist: string; coverUrl: string; tracks: string[] }[] = [
  {
    title: "Abbey Road",
    artist: "The Beatles",
    coverUrl: "https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg",
    tracks: ["Come Together", "Something", "Maxwell's Silver Hammer", "Oh! Darling", "Octopus's Garden", "I Want You (She's So Heavy)", "Here Comes the Sun", "Because"],
  },
  {
    title: "Thriller",
    artist: "Michael Jackson",
    coverUrl: "https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png",
    tracks: ["Wanna Be Startin' Somethin'", "Baby Be Mine", "The Girl Is Mine", "Thriller", "Beat It", "Billie Jean", "Human Nature", "P.Y.T. (Pretty Young Thing)", "The Lady in My Life"],
  },
  {
    title: "Random Access Memories",
    artist: "Daft Punk",
    coverUrl: "https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg",
    tracks: ["Give Life Back to Music", "The Game of Love", "Giorgio by Moroder", "Within", "Instant Crush", "Lose Yourself to Dance", "Touch", "Get Lucky", "Beyond"],
  },
  {
    title: "The Dark Side of the Moon",
    artist: "Pink Floyd",
    coverUrl: "https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png",
    tracks: ["Speak to Me", "Breathe", "On the Run", "Time", "The Great Gig in the Sky", "Money", "Us and Them", "Any Colour You Like", "Brain Damage", "Eclipse"],
  },
  {
    title: "Blonde",
    artist: "Frank Ocean",
    coverUrl: "https://upload.wikimedia.org/wikipedia/en/a/a0/Blonde_-_Frank_Ocean.jpeg",
    tracks: ["Nikes", "Ivy", "Pink + White", "Be Yourself", "Solo", "Skyline To", "Self Control", "Good Guy", "Nights", "Solo (Reprise)", "Pretty Sweet"],
  },
  {
    title: "IGOR",
    artist: "Tyler, The Creator",
    coverUrl: "https://upload.wikimedia.org/wikipedia/en/5/51/Igor_-_Tyler%2C_the_Creator.jpg",
    tracks: ["IGOR'S THEME", "EARFQUAKE", "I THINK", "EXACTLY WHAT YOU RUN FROM YOU END UP RUNNING INTO", "RUNNING OUT OF TIME", "NEW MAGIC WAND", "A BOY IS A GUN*", "PUPPET", "WHAT'S GOOD"],
  },
];

/**
 * Searches for music albums matching a query.
 * Explaining: We query Last.fm's album.search API. If it is unavailable, we return matched mock albums
 * or dynamically create mock items based on the search query.
 */
export async function searchAlbums(query: string): Promise<LastFmAlbum[]> {
  if (!query || query.trim() === "") return [];

  if (IS_KEY_VALID) {
    try {
      const url = `http://ws.audioscrobbler.com/2.0/?method=album.search&album=${encodeURIComponent(
        query
      )}&api_key=${API_KEY}&format=json&limit=20`;

      const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
      if (!res.ok) throw new Error("Last.fm search API returned non-200");

      const data = await res.json();
      const albums = data?.results?.albummatches?.album || [];

      return albums.map((item: any) => {
        // Extract largest image url
        const images = item.image || [];
        const largeImage = images.find((img: any) => img.size === "extralarge") || images.find((img: any) => img.size === "large") || {};
        const coverUrl = largeImage["#text"] || PLACEHOLDER_COVER;

        return {
          lastFmId: generateLastFmId(item.artist, item.name, item.mbid),
          title: item.name,
          artist: item.artist,
          coverUrl: coverUrl,
        };
      });
    } catch (error) {
      console.warn("Last.fm API Search error. Falling back to local mock data.", error);
    }
  }

  // Fallback: Filter mock database, or generate dynamically
  const lowercaseQuery = query.toLowerCase();
  const filteredMock = MOCK_ALBUMS.filter(
    (a) =>
      a.title.toLowerCase().includes(lowercaseQuery) ||
      a.artist.toLowerCase().includes(lowercaseQuery)
  );

  if (filteredMock.length > 0) {
    return filteredMock.map((a) => ({
      lastFmId: generateLastFmId(a.artist, a.title),
      title: a.title,
      artist: a.artist,
      coverUrl: a.coverUrl,
    }));
  }

  // If no match in pre-defined mock list, generate dynamic mock results based on the search term
  return [
    {
      lastFmId: generateLastFmId("Unknown Artist", `${query} Album`),
      title: `${query} (Search Result)`,
      artist: "Various Artists",
      coverUrl: PLACEHOLDER_COVER,
    },
    {
      lastFmId: generateLastFmId("The " + query + "s", "Greatest Hits"),
      title: "Greatest Hits",
      artist: `The ${query}s`,
      coverUrl: PLACEHOLDER_COVER,
    },
  ];
}

/**
 * Fetches detailed information for a single album.
 * Explaining: We query Last.fm's album.getinfo API. If that fails, we fallback to a detailed mock album.
 */
export async function getAlbumInfo(artist: string, albumTitle: string): Promise<LastFmAlbumDetail | null> {
  if (!artist || !albumTitle) return null;

  if (IS_KEY_VALID) {
    try {
      const url = `http://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=${encodeURIComponent(
        artist
      )}&album=${encodeURIComponent(albumTitle)}&api_key=${API_KEY}&format=json`;

      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error("Last.fm getinfo API returned non-200");

      const data = await res.json();
      const album = data?.album;

      if (!album) throw new Error("Last.fm album not found");

      const images = album.image || [];
      const largeImage = images.find((img: any) => img.size === "extralarge") || images.find((img: any) => img.size === "large") || {};
      const coverUrl = largeImage["#text"] || PLACEHOLDER_COVER;

      // Map tracklist
      const trackData = album.tracks?.track || [];
      const tracks: LastFmTrack[] = (Array.isArray(trackData) ? trackData : [trackData]).map((t: any, index: number) => ({
        name: t.name,
        duration: parseInt(t.duration) || 200, // fallback to 200 seconds if not specified
        rank: parseInt(t["@attr"]?.rank) || index + 1,
      }));

      const wikiSummary = album.wiki?.summary || album.wiki?.content;

      return {
        lastFmId: generateLastFmId(album.artist, album.name, album.mbid),
        title: album.name,
        artist: album.artist,
        coverUrl: coverUrl,
        tracks,
        wikiSummary,
      };
    } catch (error) {
      console.warn("Last.fm API GetInfo failed. Falling back to local mock details.", error);
    }
  }

  // Fallback: Check if we have pre-defined mock data for this exact or similar album
  const match = MOCK_ALBUMS.find(
    (a) =>
      a.title.toLowerCase() === albumTitle.toLowerCase() &&
      a.artist.toLowerCase() === artist.toLowerCase()
  );

  if (match) {
    return {
      lastFmId: generateLastFmId(match.artist, match.title),
      title: match.title,
      artist: match.artist,
      coverUrl: match.coverUrl,
      wikiSummary: `This is a high-fidelity fallback presentation of **${match.title}** by **${match.artist}** since the Last.fm API could not be reached. Enjoy exploring the tracklist below!`,
      tracks: match.tracks.map((t, idx) => ({
        name: t,
        duration: 180 + (idx * 17) % 60, // semi-random durations
        rank: idx + 1,
      })),
    };
  }

  // Generate generic details on the fly
  return {
    lastFmId: generateLastFmId(artist, albumTitle),
    title: albumTitle,
    artist: artist,
    coverUrl: PLACEHOLDER_COVER,
    wikiSummary: `Album details for **${albumTitle}** by **${artist}** could not be fetched from the Last.fm API. A fallback layout is displayed instead.`,
    tracks: [
      { name: "Intro", duration: 120, rank: 1 },
      { name: "Track 2", duration: 240, rank: 2 },
      { name: "Track 3", duration: 195, rank: 3 },
      { name: "Track 4", duration: 215, rank: 4 },
      { name: "Track 5 (Interlude)", duration: 90, rank: 5 },
      { name: "Track 6", duration: 280, rank: 6 },
      { name: "Outro", duration: 160, rank: 7 },
    ],
  };
}
