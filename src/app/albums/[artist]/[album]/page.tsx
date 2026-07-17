import { getAlbumInfo, generateLastFmId } from "@/lib/lastfm";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import AlbumActions from "@/components/AlbumActions";
import ReviewCard from "@/components/ReviewCard";
import { Music, Clock, Play } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface AlbumDetailPageProps {
  params: Promise<{
    artist: string;
    album: string;
  }>;
}

// Helper to format track durations from seconds to MM:SS
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * AlbumDetailPage Server Component.
 * Explaining: Decodes the artist and album name parameters, requests album details from Last.fm.
 * Queries our local PostgreSQL to check for existing ratings/reviews or watchlist entries for the current user.
 * Displays tracks, album summary, and user reviews.
 */
export default async function AlbumDetailPage({ params }: AlbumDetailPageProps) {
  const resolvedParams = await params;
  const artist = decodeURIComponent(resolvedParams.artist);
  const albumName = decodeURIComponent(resolvedParams.album);

  const currentUser = await getSessionUser();

  // 1. Fetch live album metadata from Last.fm API
  const albumDetail = await getAlbumInfo(artist, albumName);

  if (!albumDetail) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel border border-card-border p-12 rounded-xl max-w-md mx-auto">
          <Music className="mx-auto text-red-500 mb-4" size={40} />
          <h2 className="text-xl font-bold text-white mb-2">Album Details Unretrievable</h2>
          <p className="text-sm text-text-muted mb-6 font-light">
            We were unable to load details for "{albumName}" by "{artist}". The album might not exist or the Last.fm server is currently unresponsive.
          </p>
          <Link
            href="/"
            className="bg-accent-green hover:bg-accent-hover text-black px-6 py-2 rounded-full font-semibold text-sm transition-colors cursor-pointer"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Generate the lastFmId to query local PostgreSQL database records
  const lastFmId = generateLastFmId(albumDetail.artist, albumDetail.title);

  // Initialize interactive states
  let isFavorite = false;
  let isListenList = false;
  let userReview = null;
  let communityReviews: any[] = [];

  try {
    // 2. Locate local album cache in database
    const localAlbum = await db.album.findUnique({
      where: { lastFmId },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (localAlbum) {
      // Load community reviews
      communityReviews = localAlbum.reviews;

      if (currentUser) {
        // Check if the logged-in user favorited this album
        const fav = await db.favorite.findUnique({
          where: {
            userId_albumId: {
              userId: currentUser.userId,
              albumId: localAlbum.id,
            },
          },
        });
        isFavorite = !!fav;

        // Check if the logged-in user watchlisted this album
        const wl = await db.listenList.findUnique({
          where: {
            userId_albumId: {
              userId: currentUser.userId,
              albumId: localAlbum.id,
            },
          },
        });
        isListenList = !!wl;

        // Check if user has already reviewed the album
        const review = await db.review.findFirst({
          where: {
            userId: currentUser.userId,
            albumId: localAlbum.id,
          },
        });
        if (review) {
          userReview = {
            rating: review.rating,
            content: review.content,
          };
        }
      }
    }
  } catch (error) {
    console.error("Failed to query PostgreSQL data for album details", error);
  }

  // Clean wiki content (strip HTML tags since Last.fm api wiki might contain links)
  const cleanWiki = albumDetail.wikiSummary
    ? albumDetail.wikiSummary.replace(/<[^>]*>/g, "")
    : "";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex-1">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Cover & User Actions (Spans 4 columns on desktop) */}
        <div className="md:col-span-4 space-y-6">
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-950 border border-card-border shadow-2xl">
            <img
              src={albumDetail.coverUrl}
              alt={`Cover art for ${albumDetail.title} by ${albumDetail.artist}`}
              className="w-full h-full object-cover"
            />
          </div>

          <AlbumActions
            albumData={{
              lastFmId,
              title: albumDetail.title,
              artist: albumDetail.artist,
              coverUrl: albumDetail.coverUrl,
            }}
            isLoggedIn={!!currentUser}
            initialFavorite={isFavorite}
            initialListenList={isListenList}
            initialReview={userReview}
          />
        </div>

        {/* Right Column: Info, Tracklist, Reviews (Spans 8 columns) */}
        <div className="md:col-span-8 space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              {albumDetail.title}
            </h1>
            <p className="text-lg sm:text-xl text-text-muted mt-2 font-medium">
              by <span className="text-white">{albumDetail.artist}</span>
            </p>
          </div>

          {cleanWiki && (
            <div className="glass-panel border border-card-border/60 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">About</h3>
              <p className="text-sm text-zinc-300 leading-relaxed font-light">
                {cleanWiki}
              </p>
            </div>
          )}

          {/* Tracklist Section */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Play size={18} className="text-accent-green" />
              Tracklist
            </h2>
            {albumDetail.tracks.length === 0 ? (
              <p className="text-sm text-text-muted font-light">No tracklist details available.</p>
            ) : (
              <div className="bg-[#12181f] border border-card-border/60 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-card-border text-text-muted">
                      <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
                      <th className="py-3 px-4 font-semibold">Title</th>
                      <th className="py-3 px-4 font-semibold w-20 text-right"><Clock size={14} className="inline mr-1" />Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {albumDetail.tracks.map((track) => (
                      <tr
                        key={track.rank}
                        className="border-b border-card-border/40 hover:bg-card-bg/30 text-zinc-300 transition-colors"
                      >
                        <td className="py-3 px-4 text-center font-mono text-xs text-text-muted">{track.rank}</td>
                        <td className="py-3 px-4 font-medium text-white">{track.name}</td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-text-muted">
                          {formatDuration(track.duration)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Community Reviews Section */}
          <div className="pt-6 border-t border-card-border/40">
            <h2 className="text-lg font-bold text-white mb-4">Community Reviews</h2>
            {communityReviews.length === 0 ? (
              <div className="bg-card-bg/40 border border-card-border/50 rounded-xl p-8 text-center">
                <p className="text-sm text-text-muted font-light">
                  No reviews have been written for this album yet. Be the first to share your thoughts!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {communityReviews.map((review: any) => (
                  <ReviewCard
                    key={review.id}
                    id={review.id}
                    userId={review.userId}
                    username={review.user.username}
                    rating={review.rating}
                    content={review.content}
                    createdAt={review.createdAt}
                    album={{
                      title: albumDetail.title,
                      artist: albumDetail.artist,
                      coverUrl: albumDetail.coverUrl,
                    }}
                    currentUser={
                      currentUser
                        ? { userId: currentUser.userId, role: currentUser.role }
                        : null
                    }
                    showAlbumInfo={false} // Hide album info inside card as we are on the album page already
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
