"use client";

import { useRef, useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
  label?: string;
}

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = 20,
  label,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const starRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const groupLabelId = label ? `${label.toLowerCase().replace(/\s+/g, "-")}-rating-label` : undefined;

  const selectWithKeyboard = (star: number, direction: number) => {
    const nextValue = Math.min(5, Math.max(1, star + direction));

    onChange?.(nextValue);
    starRefs.current[nextValue - 1]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, star: number) => {
    if (readonly) return;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      selectWithKeyboard(star, 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      selectWithKeyboard(star, -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      onChange?.(1);
      starRefs.current[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      onChange?.(5);
      starRefs.current[4]?.focus();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span id={groupLabelId} className="text-sm text-ash font-medium min-w-[80px]">
          {label}
        </span>
      )}
      <div
        className="star-rating"
        role="radiogroup"
        aria-label={label ? undefined : "Rating"}
        aria-labelledby={groupLabelId}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} of 5 stars`}
            tabIndex={star === (value || 1) ? 0 : -1}
            ref={(element) => {
              starRefs.current[star - 1] = element;
            }}
            className={`star focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-bright focus-visible:ring-offset-2 focus-visible:ring-offset-void ${
              star <= (hover || value) ? "filled" : "empty"
            } ${readonly ? "!cursor-default" : ""}`}
            onClick={() => onChange?.(star)}
            onKeyDown={(event) => handleKeyDown(event, star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={star <= (hover || value) ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
      </div>
      {value > 0 && (
        <span className="text-sm font-mono text-ash">{value}/5</span>
      )}
    </div>
  );
}
