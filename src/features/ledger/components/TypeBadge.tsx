import React from "react";
import { Badge } from "@/components/ui/badge";
import { getTypeDetails } from "../utils";

export function TypeBadge({ type, description }: { type?: string; description?: string }) {
	const details = getTypeDetails(type, description);
	const Icon = details.icon;
	return (
		<Badge variant="outline" className={`${details.badgeClass} text-[10px] gap-1 font-bold`}>
			<Icon size={11} /> {details.label}
		</Badge>
	);
}
