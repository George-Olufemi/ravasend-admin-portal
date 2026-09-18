export function fmtN(num: number) {
	return new Intl.NumberFormat().format(num || 0);
}
