"use client";

import { useState } from "react";

interface AvatarProps {
  username?: string | null;
  avatarUrl?: string | null;
  className?: string;
}

export function getInitial(username?: string | null): string {
  return (username?.trim()[0] ?? "?").toUpperCase();
}

/** Round avatar showing the uploaded image, falling back to the user's initial. */
export default function Avatar({
  username,
  avatarUrl,
  className = "w-8 h-8 text-xs",
}: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = !!avatarUrl && failedUrl !== avatarUrl;

  return (
    <div
      className={`${className} rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-nova to-comet flex items-center justify-center font-bold text-white`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={username ? `${username}'s avatar` : "Avatar"}
          className="w-full h-full object-cover"
          onError={() => setFailedUrl(avatarUrl)}
        />
      ) : (
        getInitial(username)
      )}
    </div>
  );
}
