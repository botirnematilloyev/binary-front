/**
 * Tillar reyestri — bitta haqiqat manbasi.
 *
 * Har til UCHTA xil kodda yoziladi va ular bir-biriga o'xshamaydi:
 *
 *   - `segment`  — URL'da ko'rinadigan shakl (`uz-cyrl`)
 *   - `apiLang`  — backend `?lang=` da kutadigan shakl (`uz_cyr`)
 *   - `hreflang` — BCP 47 bo'yicha to'g'ri shakl (`uz-Cyrl`)
 *
 * Backenddagi `uz_cyr` BCP 47 uchun yaroqsiz: pastki chiziq ishlatilmaydi
 * va Google `hreflang="uz_cyr"` ni e'tiborsiz qoldiradi. URL'da esa
 * pastki chiziq xunuk va odatga xilof. Shuning uchun uchta vakillik
 * kerak — lekin xarita FAQAT shu faylda. Aks holda `?lang=` da bir kod,
 * `hreflang` da boshqasi ketadi va buni Search Console'da bir oydan
 * keyin bilib olasan.
 */

export interface LocaleDefinition {
	segment: string;
	apiLang: string;
	hreflang: string;
	/** Til tanlagichda o'sha tilning O'ZIDA yoziladi, tarjima qilinmaydi. */
	label: string;
}

export const LOCALES = [
	{ segment: "uz", apiLang: "uz", hreflang: "uz", label: "O'zbekcha" },
	{
		segment: "uz-cyrl",
		apiLang: "uz_cyr",
		hreflang: "uz-Cyrl",
		label: "Ўзбекча",
	},
	{ segment: "ru", apiLang: "ru", hreflang: "ru", label: "Русский" },
	{ segment: "en", apiLang: "en", hreflang: "en", label: "English" },
] as const satisfies readonly LocaleDefinition[];

export type Locale = (typeof LOCALES)[number]["segment"];

export const LOCALE_SEGMENTS = LOCALES.map((l) => l.segment) as unknown as [
	Locale,
	...Locale[],
];

export const DEFAULT_LOCALE: Locale = "uz";

const BY_SEGMENT = new Map<string, LocaleDefinition>(
	LOCALES.map((l) => [l.segment, l]),
);

/**
 * `Locale` turi `LOCALES` dan kelib chiqadi, ya'ni bu qidiruv hech qachon
 * bo'sh qaytmaydi — lekin `noUncheckedIndexedAccess` buni bilmaydi va
 * tekshirishni talab qiladi. Tekshiruvni `!` bilan o'chirish o'rniga
 * ochiq xato tashlaymiz: bir kun `Locale` turi qo'lda kengaytirilsa,
 * jimgina `undefined` tarqalgandan ko'ra baland xato yaxshiroq.
 */
export function localeOf(segment: Locale): LocaleDefinition {
	const found = BY_SEGMENT.get(segment);
	if (!found) throw new Error(`Reyestrda yo'q til: ${segment}`);
	return found;
}

/** Backend `?lang=` uchun kod. */
export function apiLangOf(segment: Locale): string {
	return localeOf(segment).apiLang;
}

/**
 * Backend qaytargan `available_langs` (API kodlari) ni URL bo'laklariga
 * o'giradi. Reyestrda yo'q kodlar TASHLAB KETILADI — masalan backendga
 * `kk` qo'shilsa, biz uchun u sahifasi yo'q til, va unga hreflang
 * ko'rsatish Google uchun xato havola bo'lardi.
 */
export function segmentsFromApiLangs(apiLangs: readonly string[]): Locale[] {
	return LOCALES.filter((l) => apiLangs.includes(l.apiLang)).map(
		(l) => l.segment,
	);
}

/*
 * Oy va hafta kunlari nomlari — FAQAT o'zbek (lotin) uchun.
 *
 * Sabab brauzerdagi ma'lumot bo'shlig'i: Chrome'ning ICU'sida `uz`
 * uchun kalendar ma'lumoti yo'q va `Intl.DateTimeFormat("uz", {month:
 * "long"})` CLDR ildizidan `M07` ni, hafta kuni uchun esa inglizcha
 * `Wed` ni qaytaradi (2026-07-31 da tekshirilgan). `uz-Cyrl`, `ru` va
 * `en` da hammasi joyida, Node'da (ICU 78) `uz` ham to'g'ri ishlaydi —
 * ya'ni xato faqat brauzerda va aynan asosiy auditoriyaning tilida
 * ko'rinadi.
 *
 * Shuning uchun ular tarjima fayllarida emas, shu yerda: bu tarjima
 * emas, kutubxonadagi bo'shliqni yopadigan ma'lumot. Qolgan tillar
 * uchun `Intl` ishlatiladi — o'sha yerda u to'g'ri, va rus tilidagi
 * kelishik shakllarini ("июля") qo'lda yozishga urinish faqat xato
 * yig'ardi.
 *
 * Trigger: Chrome'ga `uz` CLDR ma'lumoti qo'shilsa, bu jadval o'chadi.
 */
const UZ_MONTHS_SHORT = [
	"yan",
	"fev",
	"mar",
	"apr",
	"may",
	"iyn",
	"iyl",
	"avg",
	"sen",
	"okt",
	"noy",
	"dek",
];

const UZ_MONTHS_LONG = [
	"yanvar",
	"fevral",
	"mart",
	"aprel",
	"may",
	"iyun",
	"iyul",
	"avgust",
	"sentabr",
	"oktabr",
	"noyabr",
	"dekabr",
];

/** Yakshanbadan boshlanadi — heatmap to'ri ham shu tartibda. */
const UZ_WEEKDAYS_SHORT = ["yak", "dush", "sesh", "chor", "pay", "jum", "shan"];

export function monthName(
	segment: Locale,
	date: Date,
	style: "short" | "long",
): string {
	if (segment === "uz") {
		const table = style === "short" ? UZ_MONTHS_SHORT : UZ_MONTHS_LONG;
		return table[date.getUTCMonth()] ?? "";
	}
	return new Intl.DateTimeFormat(localeOf(segment).hreflang, {
		month: style,
		timeZone: "UTC",
	}).format(date);
}

export function weekdayName(segment: Locale, date: Date): string {
	if (segment === "uz") {
		return UZ_WEEKDAYS_SHORT[date.getUTCDay()] ?? "";
	}
	return new Intl.DateTimeFormat(localeOf(segment).hreflang, {
		weekday: "short",
		timeZone: "UTC",
	}).format(date);
}

/*
 * Nisbiy vaqt — yana o'sha `uz` bo'shlig'i.
 *
 * `Intl.RelativeTimeFormat("uz")` Chrome'da inglizcha "yesterday" va
 * ildizdan olingan `-3 h`, `-5 min` qaytaradi (2026-08-01 da
 * tekshirilgan). Ya'ni tarixdagi vaqt ustuni o'zbekcha sahifada
 * `-1 d` bo'lib chiqardi.
 *
 * Birlik tanlash mantig'i ikkala shox uchun ham UMUMIY: aks holda
 * o'zbekcha "2 soat oldin" deganda ruscha "вчера" chiqib qolishi
 * mumkin edi.
 */
const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** O'zbekchada son ko'plik shaklini o'zgartirmaydi — "3 kun oldin". */
const UZ_UNITS: Record<Intl.RelativeTimeFormatUnit, string> = {
	second: "soniya",
	seconds: "soniya",
	minute: "daqiqa",
	minutes: "daqiqa",
	hour: "soat",
	hours: "soat",
	day: "kun",
	days: "kun",
	week: "hafta",
	weeks: "hafta",
	month: "oy",
	months: "oy",
	quarter: "chorak",
	quarters: "chorak",
	year: "yil",
	years: "yil",
};

function pickUnit(seconds: number): { value: number; unit: Intl.RelativeTimeFormatUnit } {
	if (seconds < MINUTE) return { value: Math.floor(seconds), unit: "second" };
	if (seconds < HOUR) return { value: Math.floor(seconds / MINUTE), unit: "minute" };
	if (seconds < DAY) return { value: Math.floor(seconds / HOUR), unit: "hour" };
	if (seconds < MONTH) return { value: Math.floor(seconds / DAY), unit: "day" };
	if (seconds < YEAR) return { value: Math.floor(seconds / MONTH), unit: "month" };
	return { value: Math.floor(seconds / YEAR), unit: "year" };
}

export function relativeTime(segment: Locale, date: Date, now: Date): string {
	const seconds = Math.max(0, (now.getTime() - date.getTime()) / 1000);
	const { value, unit } = pickUnit(seconds);

	if (segment === "uz") {
		if (unit === "second" && value < 30) return "hozirgina";
		return `${value} ${UZ_UNITS[unit]} oldin`;
	}

	return new Intl.RelativeTimeFormat(localeOf(segment).hreflang, { numeric: "auto" }).format(
		-value,
		unit,
	);
}
