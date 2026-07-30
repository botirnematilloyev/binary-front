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
	{ segment: "uz-cyrl", apiLang: "uz_cyr", hreflang: "uz-Cyrl", label: "Ўзбекча" },
	{ segment: "ru", apiLang: "ru", hreflang: "ru", label: "Русский" },
	{ segment: "en", apiLang: "en", hreflang: "en", label: "English" },
] as const satisfies readonly LocaleDefinition[];

export type Locale = (typeof LOCALES)[number]["segment"];

export const LOCALE_SEGMENTS = LOCALES.map((l) => l.segment) as unknown as [
	Locale,
	...Locale[],
];

export const DEFAULT_LOCALE: Locale = "uz";

const BY_SEGMENT = new Map<string, LocaleDefinition>(LOCALES.map((l) => [l.segment, l]));

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
	return LOCALES.filter((l) => apiLangs.includes(l.apiLang)).map((l) => l.segment);
}
