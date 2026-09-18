export function fmtTime(iso: string) {
	if (!iso) return "—";
	const d = new Date(iso);
	return d.toLocaleString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function getInitials(nameOrEmail: string) {
	if (!nameOrEmail) return "AD";
	if (nameOrEmail.includes(" ")) {
		const parts = nameOrEmail.split(" ");
		return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
	}
	return nameOrEmail.slice(0, 2).toUpperCase();
}
