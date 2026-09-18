import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export * from "./LinkedBadge";

export function StatusBadge({ status }: { status: string }) {
	const normalized = (status || "").toLowerCase();
	if (normalized === "active" || normalized === "completed") {
		return (
			<Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 capitalize">
				{normalized}
			</Badge>
		);
	}
	if (normalized === "paused") {
		return (
			<Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 capitalize">
				Paused
			</Badge>
		);
	}
	return (
		<Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border capitalize">
			{status || "draft"}
		</Badge>
	);
}

export function PurpleBtn({
	children,
	onClick,
	disabled,
}: {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
}) {
	return (
		<Button onClick={onClick} disabled={disabled}>
			{children}
		</Button>
	);
}

export function SlidePanel({
	open,
	onClose,
	title,
	subtitle,
	children,
	footer,
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	subtitle: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
}) {
	return (
		<Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
			<SheetContent side="right" className="w-full sm:max-w-[540px] overflow-y-auto bg-background p-6 flex flex-col justify-between">
				<div>
					<SheetHeader className="mb-4">
						<SheetTitle className="text-xl font-bold text-foreground">{title}</SheetTitle>
						<p className="text-[12px] text-muted-foreground">{subtitle}</p>
					</SheetHeader>
					{children}
				</div>
				{footer && <div className="pt-6 border-t border-border mt-6">{footer}</div>}
			</SheetContent>
		</Sheet>
	);
}
