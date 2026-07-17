import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AlbumCard from "@/components/AlbumCard";
import { Heart, Clock, MessageSquare, Music } from "lucide-react";

/**
 * Dashboard Server Component.
 * Explaining: Retrieves current session. Queries PostgreSQL for user metrics
 * (reviews, favorites, listenlist counts) and displays grids of their favorite and watchlisted albums.
 */
export default async function DashboardPage() {
  const session = await getSessionUser();

  // Route protection fallback (handled by middleware but added for safety)
  if (!session) {
    redirect("/login");
  }

  // 1. Fetch metrics
  const reviewCount = await db.review.count({
    where: { userId: session.userId },
  });
  
  const favoriteCount = await db.favorite.count({
    where: { userId: session.userId },
  });

  const listenListCount = await db.listenList.count({
    where: { userId: session.userId },
  });

  // 2. Fetch User's Favorite Albums
  const favorites = await db.favorite.findMany({
    where: { userId: session.userId },
    include: { album: true },
    orderBy: { createdAt: "desc" },
  });

  // 3. Fetch User's ListenList
  const listenList = await db.listenList.findMany({
    where: { userId: session.userId },
    include: { album: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex-1 space-y-8">
      
      {/* Welcome & Profile Summary */}
      <div className="border-b border-card-border/40 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Hello, <span className="text-accent-green">@{session.username}</span>!
          </h1>
          <p className="text-sm text-text-muted mt-1 font-light">
            Welcome to your musical diary. Here is your overview.
          </p>
        </div>
      </div>

      {/* Profile Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="glass-panel border border-card-border p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-accent-green/10 text-accent-green rounded-lg">
            <MessageSquare size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{reviewCount}</p>
            <p className="text-xs text-text-muted font-semibold uppercase mt-0.5">Albums Reviewed</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel border border-card-border p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-lg">
            <Heart size={24} className="fill-red-500/20" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{favoriteCount}</p>
            <p className="text-xs text-text-muted font-semibold uppercase mt-0.5">Favorites</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel border border-card-border p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-accent-orange/10 text-accent-orange rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{listenListCount}</p>
            <p className="text-xs text-text-muted font-semibold uppercase mt-0.5">Watchlisted</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Favorites section (Spans 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Heart size={18} className="text-red-500 fill-red-500" />
            Favorite Albums
          </h2>
          {favorites.length === 0 ? (
            <div className="bg-card-bg/40 border border-card-border/50 rounded-xl p-8 text-center">
              <p className="text-sm text-text-muted font-light">
                No favorite albums selected yet. Click the heart button on any album details page.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {favorites.map((fav: any) => (
                <AlbumCard
                  key={fav.id}
                  title={fav.album.title}
                  artist={fav.album.artist}
                  coverUrl={fav.album.coverUrl}
                />
              ))}
            </div>
          )}
        </div>

        {/* Watchlist Section (Spans 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock size={18} className="text-accent-orange" />
            ListenList (Watchlist)
          </h2>
          {listenList.length === 0 ? (
            <div className="bg-card-bg/40 border border-card-border/50 rounded-xl p-8 text-center">
              <p className="text-sm text-text-muted font-light">
                Your listen list is empty. Add albums to log what you want to hear next!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {listenList.map((item: any) => (
                <div
                  key={item.id}
                  className="glass-panel border border-card-border rounded-lg p-3 flex items-center gap-3 hover:border-zinc-800 transition-colors"
                >
                  <img
                    src={item.album.coverUrl}
                    alt={item.album.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.album.title}</p>
                    <p className="text-xs text-text-muted truncate">{item.album.artist}</p>
                  </div>
                  <a
                    href={`/albums/${encodeURIComponent(item.album.artist)}/${encodeURIComponent(
                      item.album.title
                    )}`}
                    className="text-xs text-accent-green hover:underline shrink-0 px-2 font-medium"
                  >
                    View Details
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
