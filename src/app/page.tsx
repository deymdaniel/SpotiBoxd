import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import ReviewCard from "@/components/ReviewCard";
import Link from "next/link";
import { Music, Activity } from "lucide-react";

/**
 * HomePage Server Component (Landing Page).
 * Explaining: Fetches all reviews in PostgreSQL ordered chronologically (newest first).
 * Renders cards for reviews using ReviewCard.
 */
export default async function HomePage() {
  const currentUser = await getSessionUser();

  // Fetch reviews from Postgres, joining user (for username) and album (for title/artist/cover)
  // ordered chronologically (newest first)
  const reviews = await db.review.findMany({
    include: {
      user: {
        select: {
          username: true,
        },
      },
      album: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex-1 flex flex-col">
      
      {/* Hero Welcome Panel */}
      <div className="text-center py-10 mb-8 border-b border-card-border/40">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Track music you listen to.
        </h1>
        <p className="mt-4 text-base text-text-muted max-w-lg mx-auto font-light">
          Write reviews, rate albums out of 5 stars, and keep a digital diary of your musical journey.
        </p>
        {!currentUser && (
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/signup"
              className="bg-accent-green hover:bg-accent-hover text-black font-semibold px-6 py-2 rounded-full transition-colors text-sm cursor-pointer"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="border border-card-border hover:border-zinc-500 text-white font-semibold px-6 py-2 rounded-full transition-colors text-sm cursor-pointer"
            >
              Log In
            </Link>
          </div>
        )}
      </div>

      {/* Main chronological review list */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="text-accent-green" size={20} />
            Reviews Feed
          </h2>
        </div>

        {reviews.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center border border-card-border">
            <Music className="mx-auto text-text-muted/40 mb-3" size={40} />
            <h3 className="text-white font-semibold text-lg">No reviews yet</h3>
            <p className="text-text-muted text-sm mt-1 max-w-sm mx-auto font-light">
              Be the first to rate and review an album! Search for an album in the navbar to log it.
            </p>
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
                currentUser={
                  currentUser
                    ? { userId: currentUser.userId, role: currentUser.role }
                    : null
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
