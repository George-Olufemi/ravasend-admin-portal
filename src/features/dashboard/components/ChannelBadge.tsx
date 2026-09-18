import React from "react";

export function ChannelBadge({ ch }: { ch: string }) {
  const norm = ch || "";
  let bg = "bg-primary/10 text-primary border-primary/20";
  if (norm.includes("email") || norm.includes("mail")) bg = "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (norm.includes("push") || norm.includes("notification")) bg = "bg-purple-500/10 text-purple-400 border-purple-500/20";
  if (norm.includes("sms")) bg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${bg}`}>
      {ch}
    </span>
  );
}
