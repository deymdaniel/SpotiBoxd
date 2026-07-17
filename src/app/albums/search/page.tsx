import { searchAlbums } from "@/lib/lastfm";
import AlbumCard from "@/components/AlbumCard";
import { Search, Music } from "lucide-react";

export const dynamic = "force-dynamic";

interface SearchProps {
  searchParams: Promise<{ q?: string }>;
}

/**
 * SearchPage Server Component.
 * Explaining: Retrieves the search query parameters and initiates the Last.fm server-side lookup.
 * Renders the results in a grid. If no results or query, it offers search instructions.
 */
export default async function SearchPage({ searchParams }: SearchProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";

  let albums = [];
  if (query) {
    albums = await searchAlbums(query);
  } else {
    // If no search input is provided, pre-fill with defaults for aesthetics
    albums = await searchAlbums("Abbey Road");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-8 border-b border-card-border/40 pb-5">
        <Search className="text-accent-green" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-white">
            {query ? `Search Results for "${query}"` : "Explore Albums"}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {query
              ? `Found ${albums.length} matching releases.`
              : "Search for music albums using the search bar above or see trending items below."}
          </p>
        </div>
      </div>

      {/* Mobile-only Search Input (hidden on desktop because it's in the header) */}
      <form action="/albums/search" method="GET" className="mb-8 md:hidden">
        <div className="relative">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search albums..."
            required
            className="w-full bg-[#12181f] border border-card-border focus:border-accent-green text-sm text-white px-4 py-3 pl-11 rounded-lg outline-none transition-all"
          />
          <Search className="absolute left-4 top-3.5 text-zinc-500" size={16} />
        </div>
      </form>

      {albums.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center border border-card-border max-w-md mx-auto mt-8">
          <Music className="mx-auto text-text-muted/40 mb-3" size={40} />
          <h3 className="text-white font-semibold text-lg">No albums found</h3>
          <p className="text-text-muted text-sm mt-1 font-light">
            We couldn't find any results for "{query}". Try checking your spelling or search for another album.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {albums.map((album) => (
            <AlbumCard
              key={album.lastFmId}
              title={album.title}
              artist={album.artist}
              coverUrl={album.coverUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
