"use client";

import Link from "next/link";
import StarRating from "./ui/StarRating";
import { Trash2 } from "lucide-react";
import { deleteReview } from "@/actions/reviews";
import { useState } from "react";

interface ReviewCardProps {
  id: string;
  userId: string;
  username: string;
  rating: number;
  content: string;
  createdAt: Date;
  album: {
    title: string;
    artist: string;
    coverUrl: string;
  };
  currentUser?: {
    userId: string;
    role: string;
  } | null;
  showAlbumInfo?: boolean; // Set false on the album detail page since it is redundant
}

/**
 * ReviewCard component.
 * Explaining: Renders a user's ratings and log. Displays the reviewer's username,
 * the album art (optional), rating stars, textual review, and date.
 * If the logged-in user is the author or an ADMIN, it renders a Delete button that calls our server action.
 */
export default function ReviewCard({
  id,
  userId,
  username,
  rating,
  content,
  createdAt,
  album,
  currentUser,
  showAlbumInfo = true,
}: ReviewCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Author of the review or an administrator can delete reviews
  const canDelete = currentUser && (currentUser.userId === userId || currentUser.role === "ADMIN");

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    
    setIsDeleting(true);
    setError(null);
    try {
      const res = await deleteReview(id);
      if (!res.success) {
        setError(res.error || "Failed to delete review.");
        setIsDeleting(false);
      }
    } catch (e) {
      setError("An unexpected error occurred.");
      setIsDeleting(false);
    }
  };

  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const albumUrl = `/albums/${encodeURIComponent(album.artist)}/${encodeURIComponent(album.title)}`;

  return (
    <div className="glass-panel rounded-xl p-5 border border-card-border flex flex-col md:flex-row gap-5 transition-all hover:border-zinc-800">
      {/* Album cover shown in activity feed */}
      {showAlbumInfo && (
        <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded overflow-hidden bg-zinc-950 border border-zinc-850 self-start">
          <Link href={albumUrl}>
            <img
              src={album.coverUrl}
              alt={`Cover art for ${album.title}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          </Link>
        </div>
      )}

      {/* Review details and user ratings */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
            <div>
              {showAlbumInfo ? (
                <>
                  <h4 className="text-base font-semibold text-white">
                    <Link href={albumUrl} className="hover:text-accent-green transition-colors">
                      {album.title}
                    </Link>{" "}
                    <span className="text-sm font-normal text-text-muted">by {album.artist}</span>
                  </h4>
                  <p className="text-xs text-text-muted mt-1">
                    Reviewed by <span className="text-zinc-300 font-medium">@{username}</span>
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-zinc-300">
                  @{username}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted">{formattedDate}</span>
              <StarRating rating={rating} />
            </div>
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap mt-2 font-light">
            {content}
          </p>
        </div>

        {/* Action controls */}
        {canDelete && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-card-border/50">
            {error && <span className="text-xs text-red-500">{error}</span>}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs text-zinc-500 hover:text-red-500 flex items-center gap-1 transition-colors ml-auto disabled:opacity-50 cursor-pointer"
              aria-label="Delete review"
            >
              <Trash2 size={14} />
              {isDeleting ? "Deleting..." : "Delete Review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
