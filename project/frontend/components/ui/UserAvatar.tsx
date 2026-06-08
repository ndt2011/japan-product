"use client";

import Image from "next/image";
import { clsx } from "clsx";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
  className?: string;
}

const SIZES = { sm: "w-7 h-7 text-xs", md: "w-8 h-8 text-xs" };

export function UserAvatar({ name, avatarUrl, size = "md", className }: UserAvatarProps) {
  const initial = (name || "U").charAt(0).toUpperCase();

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={size === "sm" ? 28 : 32}
        height={size === "sm" ? 28 : 32}
        unoptimized
        className={clsx(SIZES[size], "rounded-full object-cover border border-border shrink-0", className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        SIZES[size],
        "rounded-full bg-brand text-white flex items-center justify-center font-medium shrink-0",
        className,
      )}
    >
      {initial}
    </div>
  );
}
