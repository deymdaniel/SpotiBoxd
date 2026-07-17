import Link from "next/link";
import Image from "next/image";

interface AlbumCardProps {
  title: string;
  artist: string;
  coverUrl: string;
}

/**
 * AlbumCard component.
 * Explaining: Displays a music album cover art in a sleek card.
 * Clicking the card routes the user to the dynamic Album Detail view `/albums/[artist]/[album]`.
 * We implement smooth transition scaling and green highlights on hover.
 */
export default function AlbumCard({ title, artist, coverUrl }: AlbumCardProps) {
  const detailUrl = `/albums/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;

  return (
    <Link
      href={detailUrl}
      className="group block bg-card-bg border border-card-border hover:border-accent-green rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,224,84,0.15)] flex flex-col h-full"
    >
      {/* Cover Art Wrapper */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
        <img
          src={coverUrl}
          alt={`Cover art for ${title} by ${artist}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Album Text Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-semibold text-white line-clamp-1 group-hover:text-accent-green transition-colors duration-200">
            {title}
          </h4>
          <p className="text-sm text-text-muted mt-1 line-clamp-1">
            {artist}
          </p>
        </div>
      </div>
    </Link>
  );
}
