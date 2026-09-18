import React from "react";
import { Link2, Unlink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function LinkedBadge({ isLinked }: { isLinked: boolean }) {
	if (isLinked) {
		return (
			<Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
				<Link2 size={11} /> Linked to Campaign
			</Badge>
		);
	}
	return (
		<Badge variant="outline" className="bg-muted/40 text-muted-foreground border-border gap-1">
			<Unlink size={11} /> Not Linked
		</Badge>
	);
}
