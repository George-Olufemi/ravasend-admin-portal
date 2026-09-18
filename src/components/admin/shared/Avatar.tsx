import React from "react";

interface AvatarProps {
  name: string;
  size?: "sm" | "md";
}

export function Avatar({ name, size = "sm" }: AvatarProps) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sz = size === "md" ? "size-10 text-[13px]" : "size-8 text-[11px]";
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
    >
      {initials}
    </div>
  );
}
