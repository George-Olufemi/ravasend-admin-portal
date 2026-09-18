import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { ReferralNode } from "../types";
import { countDownline, fmtCompact } from "../utils";
import { Avatar, StatusBadge } from "@/components/admin/shared";

export function ReferralNodeRow({ node, depth = 0 }: { node: ReferralNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.referrals.length > 0;
  const totalDownline = countDownline(node);

  return (
    <div>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
          depth === 0
            ? "bg-primary/8 border border-primary/20 mb-1"
            : "hover:bg-white/[0.025] border border-transparent hover:border-border"
        }`}
        style={{ marginLeft: depth * 24 }}
        onClick={() => hasChildren && setExpanded((e) => !e)}
      >
        {hasChildren ? (
          <div className="size-5 rounded-md border border-border flex items-center justify-center text-muted-foreground shrink-0">
            <ChevronRight size={11} className={`transition-transform duration-150 ${expanded ? "rotate-90" : ""}`} />
          </div>
        ) : (
          <div className="size-5 shrink-0" />
        )}
        <Avatar name={node.user.name} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold text-foreground ${depth === 0 ? "text-[13px]" : "text-[12px]"}`}>{node.user.name}</p>
            <code className="text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">{node.code}</code>
            <StatusBadge status={node.user.status} />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {node.user.email} · Joined {node.user.joined}
          </p>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <div className="text-right">
            <p className="text-[12px] font-mono font-bold text-foreground">{fmtCompact(node.user.volume)}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">volume</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-mono font-bold text-foreground">{node.user.txns}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">txns</p>
          </div>
          {hasChildren && (
            <div className="text-right min-w-[36px]">
              <p className="text-[12px] font-mono font-bold text-primary">{totalDownline}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">downline</p>
            </div>
          )}
        </div>
      </div>
      {expanded && node.referrals.map((child) => <ReferralNodeRow key={child.code} node={child} depth={depth + 1} />)}
    </div>
  );
}
