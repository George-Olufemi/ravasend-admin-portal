import React from "react";

export function StatusBadge({ status }: { status: string }) {
  const norm = (status || "").toLowerCase();
  if (norm === "active" || norm === "verified" || norm === "running" || norm === "live" || norm === "completed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase">
        {status}
      </span>
    );
  }
  if (norm === "paused" || norm === "pending" || norm === "processing") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 uppercase">
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-zinc-500/15 text-zinc-400 border border-zinc-500/20 uppercase">
      {status}
    </span>
  );
}
