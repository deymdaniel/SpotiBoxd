import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Shield, Users, MessageSquare, Music } from "lucide-react";
import ReviewCard from "@/components/ReviewCard";

/**
 * AdminPage Server Component.
 * Explaining: Restricts access to users with the ADMIN role.
 * Queries PostgreSQL database metadata stats and displays all logged reviews with moderation delete actions.
 */
export default async function AdminPage() {
  const session = await getSessionUser();

  // Role verification check (for security fallback)
  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // 1. Fetch system statistics
  const totalUsers = await db.user.count();
  const totalReviews = await db.review.count();
  const totalAlbums = await db.album.count();

  // 2. Fetch all reviews written on the website
  const reviews = await db.review.findMany({
    include: {
      user: {
        select: {
          username: true,
        },
      },
      album: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex-1 space-y-8">
      
      {/* Header Title */}
      <div className="border-b border-card-border/40 pb-6">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Shield className="text-accent-orange" size={28} />
          Admin Moderation Panel
        </h1>
        <p className="text-sm text-text-muted mt-1 font-light">
          Monitor site statistics and moderate reviews written by users.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Registered Users count */}
        <div className="glass-panel border border-card-border p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-accent-orange/10 text-accent-orange rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{totalUsers}</p>
            <p className="text-xs text-text-muted font-semibold uppercase mt-0.5">Registered Users</p>
          </div>
        </div>

        {/* Reviews written count */}
        <div className="glass-panel border border-card-border p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-accent-green/10 text-accent-green rounded-lg">
            <MessageSquare size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{totalReviews}</p>
            <p className="text-xs text-text-muted font-semibold uppercase mt-0.5">Reviews Logged</p>
          </div>
        </div>

        {/* Albums tracked in DB count */}
        <div className="glass-panel border border-card-border p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-[#1e293b] text-white rounded-lg">
            <Music size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{totalAlbums}</p>
            <p className="text-xs text-text-muted font-semibold uppercase mt-0.5">Unique Albums Cached</p>
          </div>
        </div>
      </div>

      {/* Reviews Moderation List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">All Reviews</h2>
        {reviews.length === 0 ? (
          <div className="bg-card-bg/40 border border-card-border/50 rounded-xl p-8 text-center">
            <p className="text-sm text-text-muted font-light">No reviews logged on the website yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <ReviewCard
                key={review.id}
                id={review.id}
                userId={review.userId}
                username={review.user.username}
                rating={review.rating}
                content={review.content}
                createdAt={review.createdAt}
                album={{
                  title: review.album.title,
                  artist: review.album.artist,
                  coverUrl: review.album.coverUrl,
                }}
                currentUser={{
                  userId: session.userId,
                  role: session.role,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
