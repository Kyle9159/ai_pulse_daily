// components/StarRating.tsx – Interactive 5-star rating widget

"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ratePost } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  postId: string;
  initial: { average: number; count: number };
}

export function StarRatingWidget({ postId, initial }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [voted, setVoted] = useState(false);
  const [current, setCurrent] = useState(initial);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (rating: number) => ratePost(postId, rating),
    onSuccess: (data) => {
      setCurrent({ average: data.average_rating, count: data.rating_count });
      setVoted(true);
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const display = hover ?? Math.round(current.average);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1" aria-label="Rate this post">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={voted || mutation.isPending}
            onMouseEnter={() => !voted && setHover(star)}
            onMouseLeave={() => setHover(null)}
            onClick={() => !voted && mutation.mutate(star)}
            className={cn(
              "transition-all duration-100",
              "disabled:cursor-default",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
            )}
            aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors duration-100",
                star <= display
                  ? "fill-pulse-400 text-pulse-400"
                  : "text-muted fill-transparent",
              )}
            />
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {voted ? (
          <span className="text-primary font-medium">Thanks for rating!</span>
        ) : (
          <>
            <span className="text-foreground font-semibold">
              {current.average.toFixed(1)}
            </span>{" "}
            avg · {current.count} rating{current.count !== 1 ? "s" : ""}
          </>
        )}
      </p>

      {mutation.isError && (
        <p className="text-xs text-red-400">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Could not submit rating."}
        </p>
      )}
    </div>
  );
}
