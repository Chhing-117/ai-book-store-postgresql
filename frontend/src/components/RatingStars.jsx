import { Star } from "lucide-react";

export default function RatingStars({ rating = 0, reviews, compact = false }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1.5" aria-label={`${rating} out of 5 stars`}>
      <div className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            size={compact ? 12 : 15}
            className={index < rounded ? "fill-current" : "text-stone-200"}
          />
        ))}
      </div>
      {!compact && <span className="text-sm font-medium text-stone-700">{rating.toFixed(1)}</span>}
      {reviews !== undefined && (
        <span className="text-xs text-stone-400">({reviews.toLocaleString()})</span>
      )}
    </div>
  );
}
