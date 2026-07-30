import { ApiError, ApiTransportError, type Difficulty } from "@binary/api";
import { SessionExpiredError } from "@binary/session";

/** Shart yoziladigan tillar — backenddagi `lang` kodlari. */
export const STATEMENT_LANGS = [
	{ code: "uz", label: "O'zbekcha" },
	{ code: "uz_cyr", label: "Ўзбекча" },
	{ code: "ru", label: "Русский" },
	{ code: "en", label: "English" },
] as const;

export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
	{ value: "easy", label: "Oson" },
	{ value: "medium", label: "O'rta" },
	{ value: "hard", label: "Qiyin" },
];

export interface StatementValues {
	lang: string;
	title: string;
	legend: string;
	inputFormat: string;
	outputFormat: string;
	notes: string;
}

export interface ProblemFormValues {
	slug: string;
	subjectId: number;
	difficulty: Difficulty;
	timeLimitMs: number;
	memoryLimitKb: number;
	sort: number;
	source: string;
	statement: StatementValues;
}

export function emptyForm(): ProblemFormValues {
	return {
		slug: "",
		subjectId: 0,
		difficulty: "easy",
		// Backenddagi standart qiymatlar bilan bir xil: 1 s va 64 MB.
		timeLimitMs: 1000,
		memoryLimitKb: 65536,
		sort: 0,
		source: "",
		statement: {
			lang: "uz",
			title: "",
			legend: "",
			inputFormat: "",
			outputFormat: "",
			notes: "",
		},
	};
}

/**
 * Slug qoidasi backenddagi `validateSlug` ning AYNAN nusxasi.
 *
 * Takrorlanayotgani bejiz emas: mijoz tomonidagi tekshiruv xatoni
 * darhol ko'rsatish uchun, server tomonidagisi esa yagona haqiqat.
 * Ikkinchisisiz mijoz tekshiruvini chetlab o'tish mumkin bo'lardi.
 * Agar ular bir kun ajralib qolsa, natija xavfsiz tomonga og'adi —
 * server rad etadi va foydalanuvchi 400 ko'radi.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MIN = 3;
const SLUG_MAX = 160;

export type FieldErrors = Partial<Record<"slug" | "subjectId" | "title" | "legend" | "limits", string>>;

export function validate(values: ProblemFormValues): FieldErrors {
	const errors: FieldErrors = {};

	if (values.slug.length < SLUG_MIN || values.slug.length > SLUG_MAX) {
		errors.slug = `Slug ${SLUG_MIN}–${SLUG_MAX} belgi bo'lishi kerak`;
	} else if (!SLUG_PATTERN.test(values.slug)) {
		errors.slug = "Faqat kichik lotin harflari, raqamlar va defis: ikki-son-yigindisi";
	}

	if (values.subjectId <= 0) errors.subjectId = "Fan tanlanmagan";
	if (values.statement.title.trim() === "") errors.title = "Sarlavha bo'sh bo'lmasligi kerak";
	if (values.statement.legend.trim() === "") errors.legend = "Shart bo'sh bo'lmasligi kerak";

	if (values.timeLimitMs <= 0 || values.memoryLimitKb <= 0) {
		errors.limits = "Vaqt va xotira limiti musbat bo'lishi kerak";
	}

	return errors;
}

/**
 * Slug'ni sarlavhadan taxminan yasaydi.
 *
 * ATAYLAB faqat TAKLIF: maydon tahrirlanadigan bo'lib qoladi va setter
 * uni o'zgartira oladi. Avtomatik yasab qo'yish mumkin emas edi, chunki
 * slug — doimiy URL, va sarlavha tahrirlanganda u o'zgarib ketsa eski
 * havolalar buziladi. Backend ham shu sababli slug'ni muallifdan oladi.
 *
 * O'zbek harflari (`o'`, `g'`, kirill) transliteratsiyasi to'liq emas —
 * bu shunchaki boshlang'ich nuqta, aniq natija emas.
 */
export function suggestSlug(title: string): string {
	return title
		.toLowerCase()
		.replace(/[''`]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, SLUG_MAX);
}

/** Backend xabarlari inglizcha — status kodini o'zbekchaga o'giramiz. */
export function saveErrorMessage(cause: unknown): string {
	if (cause instanceof SessionExpiredError) return "Sessiya tugadi. Qaytadan kiring.";
	if (cause instanceof ApiTransportError) {
		return "Serverga ulanib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring.";
	}

	if (cause instanceof ApiError) {
		if (cause.status === 409) return "Bu slug band. Boshqasini tanlang.";
		if (cause.status === 403) return "Ruxsat yetarli emas.";
		if (cause.status === 400) return "Ma'lumotlarda xato bor. Maydonlarni tekshiring.";
	}

	return "Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.";
}
