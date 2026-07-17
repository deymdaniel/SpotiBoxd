"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number; // Star rating (1 to 5)
  onRatingChange?: (rating: number) => void; // Callback for user input
  interactive?: boolean; // Set true for forms, false for displaying static reviews
  size?: number; // Size in pixels
}

/**
 * StarRating component.
 * Explaining: Renders a set of 5 stars. In interactive mode, users can hover and click to set the rating.
 * In static mode, it renders read-only star levels using our Letterboxd neon orange color theme.
 */
export default function StarRating({
  rating,
  onRatingChange,
  interactive = false,
  size = 20,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const handleClick = (val: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(val);
    }
  };

  const handleMouseEnter = (val: number) => {
    if (interactive) {
      setHoverRating(val);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null);
    }
  };

  return (
    <div className="flex items-center gap-1" role="img" aria-label={`Rating: ${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= displayRating;

        return (
          <button
            key={index}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            className={`transition-colors focus:outline-none ${
              interactive ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-default"
            }`}
            aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
          >
            <Star
              size={size}
              className={`transition-all duration-100 ${
                isFilled
                  ? "fill-accent-orange text-accent-orange drop-shadow-[0_0_4px_rgba(255,128,0,0.4)]"
                  : "text-zinc-700 fill-zinc-900"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
