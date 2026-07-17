"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface ReviewResponse {
  success: boolean;
  error?: string;
}

/**
 * On-Demand Album Helper.
 * Explaining: We check if the album exists in our local PostgreSQL database by its `lastFmId`.
 * If it doesn't exist, we create it using the metadata fetched from Last.fm, which satisfies the
 * "On-Demand Albums" rule.
 */
async function getOrCreateAlbum(albumData: {
  lastFmId: string;
  title: string;
  artist: string;
  coverUrl: string;
}) {
  const existingAlbum = await db.album.findUnique({
    where: { lastFmId: albumData.lastFmId },
  });

  if (existingAlbum) {
    return existingAlbum;
  }

  // Create local album record
  return await db.album.create({
    data: {
      lastFmId: albumData.lastFmId,
      title: albumData.title,
      artist: albumData.artist,
      coverUrl: albumData.coverUrl,
    },
  });
}

/**
 * Server Action: Creates or updates a review for an album.
 * Explaining: Validates user session, ensures the album is registered, and upserts the review.
 */
export async function createOrUpdateReview(
  albumData: {
    lastFmId: string;
    title: string;
    artist: string;
    coverUrl: string;
  },
  rating: number,
  content: string
): Promise<ReviewResponse> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be logged in to write a review." };
  }

  if (rating < 1 || rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5 stars." };
  }

  if (!content || content.trim().length === 0) {
    return { success: false, error: "Review content cannot be empty." };
  }

  try {
    // 1. Get or create the local album reference
    const album = await getOrCreateAlbum(albumData);

    // 2. Check if this user has already reviewed this album
    const existingReview = await db.review.findFirst({
      where: {
        userId: user.userId,
        albumId: album.id,
      },
    });

    if (existingReview) {
      // Update review
      await db.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          content,
        },
      });
    } else {
      // Create new review
      await db.review.create({
        data: {
          userId: user.userId,
          albumId: album.id,
          rating,
          content,
        },
      });
    }

    // Revalidate paths to update pages in real-time
    revalidatePath("/");
    revalidatePath(`/albums/${encodeURIComponent(albumData.artist)}/${encodeURIComponent(albumData.title)}`);
    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Error creating/updating review:", error);
    return { success: false, error: "Failed to submit review." };
  }
}

/**
 * Server Action: Deletes a review.
 * Explaining: Only the review author or users with the ADMIN role are authorized to delete a review.
 */
export async function deleteReview(reviewId: string): Promise<ReviewResponse> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be logged in to delete a review." };
  }

  try {
    // Find the review to verify ownership
    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        album: true,
      },
    });

    if (!review) {
      return { success: false, error: "Review not found." };
    }

    // Authorization: User must be author OR an ADMIN
    if (review.userId !== user.userId && user.role !== "ADMIN") {
      return { success: false, error: "You are not authorized to delete this review." };
    }

    // Delete review
    await db.review.delete({
      where: { id: reviewId },
    });

    // Revalidate paths
    revalidatePath("/");
    revalidatePath(`/albums/${encodeURIComponent(review.album.artist)}/${encodeURIComponent(review.album.title)}`);
    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Error deleting review:", error);
    return { success: false, error: "Failed to delete review." };
  }
}

/**
 * Server Action: Toggles an album in a user's Favorites.
 */
export async function toggleFavorite(albumData: {
  lastFmId: string;
  title: string;
  artist: string;
  coverUrl: string;
}): Promise<ReviewResponse> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be logged in to manage favorites." };
  }

  try {
    // 1. Get or create album
    const album = await getOrCreateAlbum(albumData);

    // 2. Check if already favorited
    const existingFavorite = await db.favorite.findUnique({
      where: {
        userId_albumId: {
          userId: user.userId,
          albumId: album.id,
        },
      },
    });

    if (existingFavorite) {
      // Unfavorite
      await db.favorite.delete({
        where: { id: existingFavorite.id },
      });
    } else {
      // Favorite
      await db.favorite.create({
        data: {
          userId: user.userId,
          albumId: album.id,
        },
      });
    }

    revalidatePath(`/albums/${encodeURIComponent(albumData.artist)}/${encodeURIComponent(albumData.title)}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return { success: false, error: "Failed to update favorite status." };
  }
}

/**
 * Server Action: Toggles an album in a user's ListenList (watchlist).
 */
export async function toggleListenList(albumData: {
  lastFmId: string;
  title: string;
  artist: string;
  coverUrl: string;
}): Promise<ReviewResponse> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "You must be logged in to manage your listen list." };
  }

  try {
    // 1. Get or create album
    const album = await getOrCreateAlbum(albumData);

    // 2. Check if already in ListenList
    const existingItem = await db.listenList.findUnique({
      where: {
        userId_albumId: {
          userId: user.userId,
          albumId: album.id,
        },
      },
    });

    if (existingItem) {
      // Remove
      await db.listenList.delete({
        where: { id: existingItem.id },
      });
    } else {
      // Add
      await db.listenList.create({
        data: {
          userId: user.userId,
          albumId: album.id,
        },
      });
    }

    revalidatePath(`/albums/${encodeURIComponent(albumData.artist)}/${encodeURIComponent(albumData.title)}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error toggling listen list:", error);
    return { success: false, error: "Failed to update listen list." };
  }
}
