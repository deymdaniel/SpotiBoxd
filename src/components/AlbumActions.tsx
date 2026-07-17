"use client";

import { useState } from "react";
import { Heart, Clock, MessageSquare, Edit3, X } from "lucide-react";
import StarRating from "./ui/StarRating";
import { toggleFavorite, toggleListenList, createOrUpdateReview } from "@/actions/reviews";
import Link from "next/link";

interface AlbumActionsProps {
  albumData: {
    lastFmId: string;
    title: string;
    artist: string;
    coverUrl: string;
  };
  isLoggedIn: boolean;
  initialFavorite: boolean;
  initialListenList: boolean;
  initialReview: {
    rating: number;
    content: string;
  } | null;
}

/**
 * AlbumActions Client Component.
 * Explaining: Handles toggling favorite and listenlist state, and displays the review form.
 * Calls Server Actions directly. On successful operations, it updates the visual buttons instantly.
 */
export default function AlbumActions({
  albumData,
  isLoggedIn,
  initialFavorite,
  initialListenList,
  initialReview,
}: AlbumActionsProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorite);
  const [isListenListed, setIsListenListed] = useState(initialListenList);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Form states
  const [rating, setRating] = useState(initialReview?.rating || 5);
  const [content, setContent] = useState(initialReview?.content || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <div className="bg-card-bg border border-card-border p-4 rounded-xl text-center">
        <p className="text-sm text-text-muted mb-3 font-light">
          Want to rate, review, or add this album to your lists?
        </p>
        <Link
          href="/login"
          className="inline-block bg-accent-green hover:bg-accent-hover text-black font-semibold text-xs px-4 py-2 rounded-full transition-colors cursor-pointer"
        >
          Sign In to SpotiBoxd
        </Link>
      </div>
    );
  }

  const handleFavoriteToggle = async () => {
    // Optimistic toggle
    setIsFavorited(!isFavorited);
    try {
      const res = await toggleFavorite(albumData);
      if (!res.success) {
        // Rollback on error
        setIsFavorited(isFavorited);
      }
    } catch {
      setIsFavorited(isFavorited);
    }
  };

  const handleListenListToggle = async () => {
    // Optimistic toggle
    setIsListenListed(!isListenListed);
    try {
      const res = await toggleListenList(albumData);
      if (!res.success) {
        // Rollback
        setIsListenListed(isListenListed);
      }
    } catch {
      setIsListenListed(isListenListed);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await createOrUpdateReview(albumData, rating, content);
      if (res.success) {
        setSuccessMsg(initialReview ? "Review updated successfully!" : "Review submitted successfully!");
        setShowReviewForm(false);
      } else {
        setError(res.error || "Failed to submit review.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteToggle}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
            isFavorited
              ? "bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20"
              : "bg-card-bg border-card-border text-white hover:border-zinc-500"
          }`}
          aria-label={isFavorited ? "Remove from Favorites" : "Mark as Favorite"}
        >
          <Heart size={16} className={isFavorited ? "fill-red-500" : ""} />
          {isFavorited ? "Favorited" : "Favorite"}
        </button>

        {/* ListenList Button */}
        <button
          onClick={handleListenListToggle}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
            isListenListed
              ? "bg-accent-orange/10 border-accent-orange text-accent-orange hover:bg-accent-orange/20"
              : "bg-card-bg border-card-border text-white hover:border-zinc-500"
          }`}
          aria-label={isListenListed ? "Remove from ListenList" : "Add to ListenList"}
        >
          <Clock size={16} className={isListenListed ? "fill-accent-orange" : ""} />
          {isListenListed ? "ListenList" : "ListenList"}
        </button>
      </div>

      {/* Review trigger */}
      {!showReviewForm ? (
        <button
          onClick={() => setShowReviewForm(true)}
          className="w-full bg-[#1e293b] hover:bg-zinc-800 border border-zinc-700 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {initialReview ? <Edit3 size={16} /> : <MessageSquare size={16} />}
          {initialReview ? "Edit Your Review" : "Write Review & Rate"}
        </button>
      ) : (
        <div className="glass-panel border border-card-border rounded-xl p-4 relative">
          <button
            onClick={() => setShowReviewForm(false)}
            className="absolute top-3 right-3 text-zinc-500 hover:text-white"
            aria-label="Close form"
          >
            <X size={16} />
          </button>

          <h4 className="text-sm font-bold text-white mb-3">
            {initialReview ? "Edit Review" : "Log Album"}
          </h4>

          {error && (
            <p className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded p-2 mb-3">
              {error}
            </p>
          )}

          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted mb-1 font-semibold">Rating</label>
              <StarRating rating={rating} onRatingChange={setRating} interactive={true} size={24} />
            </div>

            <div>
              <label htmlFor="reviewContent" className="block text-xs text-text-muted mb-1 font-semibold">
                Your Review
              </label>
              <textarea
                id="reviewContent"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts on this album..."
                rows={4}
                className="w-full bg-[#12181f] border border-card-border focus:border-accent-green text-sm text-white px-3 py-2 rounded-md outline-none transition-all font-light"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-green hover:bg-accent-hover text-black font-semibold py-2 rounded-md text-xs transition-colors cursor-pointer"
            >
              {loading ? "Saving Review..." : initialReview ? "Update Review" : "Save Review"}
            </button>
          </form>
        </div>
      )}

      {successMsg && (
        <p className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded p-2.5 text-center">
          {successMsg}
        </p>
      )}
    </div>
  );
}
