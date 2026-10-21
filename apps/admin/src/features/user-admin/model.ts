import type { AccountProvider, Role, Verdict } from "@binary/api";

/*
 * Ko'rsatish qoidalari bir joyda: ro'yxat ham, tafsilot sahifasi ham
 * bir xil yorliq va ranglarni ishlatadi.
 */

export const ROLE: Record<Role, { label: string; tone: "neutral" | "accent" | "warning" }> = {
	user: { label: "Foydalanuvchi", tone: "neutral" },
	setter: { label: "Setter", tone: "accent" },
	admin: { label: "Admin", tone: "warning" },
};

export const PROVIDER: Record<AccountProvider, string> = {
	phone: "Telefon",
	email: "Email",
	telegram: "Telegram",
	unknown: "Noma'lum",
};

export const VERDICT: Record<
	Verdict,
	{ label: string; short: string; tone: "success" | "danger" | "warning" }
> = {
	accepted: { label: "Qabul qilindi", short: "AC", tone: "success" },
	wrong_answer: { label: "Noto'g'ri javob", short: "WA", tone: "danger" },
	time_limit_exceeded: { label: "Vaqt limiti", short: "TLE", tone: "warning" },
	memory_limit_exceeded: { label: "Xotira limiti", short: "MLE", tone: "warning" },
	runtime_error: { label: "Ishlash xatosi", short: "RE", tone: "danger" },
	compile_error: { label: "Kompilyatsiya xatosi", short: "CE", tone: "warning" },
	output_limit_exceeded: { label: "Chiqish limiti", short: "OLE", tone: "warning" },
};

/** Ism bo'lmasa username — ro'yxatda bo'sh katak qolmasin. */
export function displayName(user: { full_name: string | null; username: string }): string {
	return user.full_name?.trim() || `@${user.username}`;
}

/** Joylashuv nomi: o'zbekcha, bo'lmasa birinchi mavjud tarjima. */
export function locationName(location: { name: Record<string, string> } | null): string | null {
	if (!location) return null;
	return location.name["uz"] ?? Object.values(location.name)[0] ?? null;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * `21.10.2026 14:05` — brauzer vaqt mintaqasida.
 *
 * `Intl` ishlatilmadi: `uz` lokali brauzerlarda bir xil emas (ba'zisida
 * oy nomi ruscha, ba'zisida inglizcha), raqamli shakl esa hamma joyda
 * bir xil o'qiladi.
 */
export function formatDateTime(unix: number): string {
	const d = new Date(unix * 1000);
	const date = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
	return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(unix: number): string {
	return formatDateTime(unix).slice(0, 10);
}

/** "3 soat oldin" — oxirgi faollik uchun; aniq sana `title` da. */
export function formatAgo(unix: number, now = Date.now() / 1000): string {
	const diff = Math.max(0, Math.round(now - unix));
	if (diff < 60) return "hozirgina";
	if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
	if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
	if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} kun oldin`;
	return formatDate(unix);
}
