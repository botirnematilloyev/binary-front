import { ApiError, type ActivityDto, type StatsDto } from "@binary/api";

/** Heatmap oynasi — 42.uz va RoboContest'dagi kabi olti oy. */
export const ACTIVITY_DAYS = 182;

export function initials(name: string | null, username: string): string {
	const source = name?.trim() || username;
	const parts = source.split(/\s+/).filter(Boolean);
	if (parts.length >= 2) {
		return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
	}
	return source.slice(0, 2).toUpperCase();
}

/**
 * Qabul qilingan yechimlar ulushi.
 *
 * Yechim bo'lmasa `null` qaytadi, 0 emas: "0%" degan yozuv hech narsa
 * yubormagan odamni yomon ko'rsatadi, holbuki u shunchaki boshlamagan.
 */
export function acceptanceRate(stats: StatsDto): number | null {
	if (stats.total === 0) return null;
	return Math.round((stats.accepted / stats.total) * 100);
}

export interface HeatCell {
	day: string;
	count: number;
	/** 0–4: CSS sinfini tanlash uchun. 0 — umuman faollik yo'q. */
	level: number;
}

/**
 * Javobdagi kunlarni TO'LIQ kalendarga yoyadi.
 *
 * Backend faqat yozuv bo'lgan kunlarni qaytaradi (bo'sh kunlarni ham
 * yuborish javobni bekorga besh barobar kattalashtirardi), heatmap esa
 * uzluksiz to'r bo'lishi kerak — bo'sh kataklar ham chizilishi shart.
 *
 * Hisob bugundan orqaga qarab yuriladi va natija HAFTA boshiga
 * to'g'irlanadi: aks holda ustunlar surilib, "dushanba" qatori har
 * safar boshqa joyda chiqardi.
 */
export function buildHeatmap(activity: ActivityDto, days: number, today = new Date()): HeatCell[] {
	const counts = new Map(activity.days.map((item) => [item.day, item.count]));

	// UTC bilan ishlaymiz: backend ham kunlarni UTC bo'yicha guruhlaydi.
	// Mahalliy vaqtga o'tkazsak, kun chegarasi ikki tomonda ikki xil
	// bo'lib, kataklar bir kunga surilardi.
	const end = new Date(
		Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
	);
	const start = new Date(end);
	start.setUTCDate(start.getUTCDate() - (days - 1));
	// Yakshanbaga tekislash (0 = yakshanba), shunda har ustun to'liq hafta.
	start.setUTCDate(start.getUTCDate() - start.getUTCDay());

	const cells: HeatCell[] = [];
	for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
		const day = d.toISOString().slice(0, 10);
		const count = counts.get(day) ?? 0;
		cells.push({ day, count, level: levelFor(count) });
	}
	return cells;
}

/*
 * Daraja chegaralari QAT'IY, foizli emas.
 *
 * Nisbiy shkala (eng faol kun = eng to'q rang) chiroyliroq ko'rinadi,
 * lekin u yolg'on gapiradi: kuniga bitta yechim yuborgan odamning
 * heatmap'i ham "to'la yashil" bo'lib chiqardi. Qat'iy chegara bilan
 * ikki profilni solishtirsa bo'ladi.
 */
function levelFor(count: number): number {
	if (count === 0) return 0;
	if (count < 3) return 1;
	if (count < 6) return 2;
	if (count < 10) return 3;
	return 4;
}

/** Ko'p tilli nomdan birini tanlaydi: so'ralgan → uz → birinchi. */
export function pickName(name: Record<string, string>, apiLang: string): string {
	return name[apiLang] ?? name["uz"] ?? Object.values(name)[0] ?? "";
}

export function describeError(error: unknown): string {
	// 409 — handle band yoki band nomlar ro'yxatida. Backend ikkovini
	// alohida xabar bilan qaytaradi, shuning uchun uni shundayligicha
	// ko'rsatamiz: "conflict" so'zining o'zi hech narsa bermaydi.
	if (error instanceof ApiError && error.status === 409) {
		return error.message;
	}
	if (error instanceof ApiError && error.status === 400) {
		return `Ma'lumot qabul qilinmadi: ${error.message}`;
	}
	if (error instanceof ApiError && error.status === 401) {
		return "Sessiya tugadi. Qaytadan kiring.";
	}
	return "Saqlab bo'lmadi. Qayta urinib ko'ring.";
}
