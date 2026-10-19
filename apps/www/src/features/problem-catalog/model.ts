import type { BadgeProps } from "@binary/ui";
import type { Difficulty, ProblemSummaryDto } from "@binary/api";

/*
 * `Record<Difficulty, T>` ATAYLAB — `Record<string, T>` yoki `switch`
 * `default` bilan emas. Backend to'rtinchi qiyinlik darajasi qo'shsa,
 * `Difficulty` union'i o'sadi va bu map KOMPILYATSIYADA xato beradi:
 * "to'rtinchi kalit yo'q". `default` shoxi bo'lsa, yangi daraja jimgina
 * kulrang badge bo'lib chiqardi.
 *
 * Matnli YORLIQ bu yerda YO'Q — u tarjima fayllarida (`difficulty.easy`).
 * Ayni shu ajratish muhim: rang — mahsulot qarori va u tilga bog'liq emas,
 * yorliq esa to'rt tilda boshqa-boshqa. Ikkisi bir joyda bo'lsa, yangi til
 * qo'shish uchun mapper'ga tegishga to'g'ri kelardi.
 *
 * Yorliqning to'liqligini `messages/*.json` nazorat qiladi: komponentda
 * `t(difficulty)` yozilgani uchun tarjima fayliga qo'shilmagan yangi
 * daraja ham tur xatosi beradi.
 */
const DIFFICULTY_TONE: Record<Difficulty, NonNullable<BadgeProps["tone"]>> = {
	easy: "success",
	medium: "warning",
	hard: "danger",
};

export interface ProblemRow {
	id: number;
	displayId: string;
	slug: string;
	title: string;
	/** Sarlavha so'ralgan tilda kelmasa, `titleLang` shu haqda xabar beradi. */
	titleLang: string;
	difficulty: Difficulty;
	difficultyTone: NonNullable<BadgeProps["tone"]>;
	/** YECHDI ustuni: masalani yechgan foydalanuvchilar soni. */
	solvers: number;
	/** Jadvaldagi MAVZU ustuni. Bo'sh bo'lishi mumkin. */
	topics: string[];
}

/**
 * DTO → view model.
 *
 * Komponent xom DTO ko'rmaydi. Sabab: `time_limit_ms: 1000` ni "1 s" ga
 * aylantirish qoidasi bitta joyda bo'lishi kerak, aks holda ro'yxatda
 * "1 s", tafsilotda "1000 ms" chiqib, ikkalasi ham to'g'ri bo'lgani
 * holda sayt beg'ubor ko'rinmaydi.
 */
export function toProblemRow(dto: ProblemSummaryDto, apiLang: string): ProblemRow {
	return {
		id: dto.id,
		displayId: formatProblemId(dto.id),
		slug: dto.slug,
		title: dto.title,
		titleLang: dto.lang,
		difficulty: dto.difficulty,
		difficultyTone: DIFFICULTY_TONE[dto.difficulty],
		solvers: dto.solvers,
		// Mavzu nomi ham ko'p tilli, va u sarlavha bilan BIR XIL qoida
		// bo'yicha tanlanadi — aks holda bir qatorda sarlavha o'zbekcha,
		// mavzu ruscha chiqishi mumkin.
		topics: dto.topics.map((topic) => pickName(topic.name, apiLang)),
	};
}

export function formatProblemId(id: number): string {
	return `M${String(id).padStart(3, "0")}`;
}

export function difficultyTone(
	difficulty: Difficulty,
): NonNullable<BadgeProps["tone"]> {
	return DIFFICULTY_TONE[difficulty];
}

/**
 * Bir sahifadagi masalalar soni.
 *
 * Bu yerda, sahifada emas: sahifalash havolalari ham, so'rov ham shu
 * bitta sondan kelib chiqadi. Ikki joyda yozilsa, biri o'zgarganda
 * "Keyingi" tugmasi bor sahifada bo'sh ro'yxat ochilardi.
 */
export const PER_PAGE = 20;

/** URL'dan o'qilgan joriy filtr holati. */
export interface CatalogFilters {
	subjectId?: number | undefined;
	topicId?: number | undefined;
	difficulty?: Difficulty | undefined;
	query?: string | undefined;
}

/**
 * URL'dagi qiymatni `Difficulty` ga o'giradi.
 *
 * `as Difficulty` bilan majburlab bo'lmaydi: bu qiymat URL'dan keladi,
 * ya'ni `?difficulty=oson` yoki `?difficulty=<script>` bo'lishi mumkin.
 * Ro'yxatga tekshirish — bu ma'lumot haqiqatan shu turdan ekaniga
 * yagona kafolat, va u backendga so'rov ketishidan oldin bo'ladi.
 */
export function parseDifficulty(raw: string | undefined): Difficulty | undefined {
	return DIFFICULTIES.find((value) => value === raw);
}

/** Tartib mahsulot qarori: osondan qiyinga. */
export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

/*
 * Havola manzilidagi so'rov qismi.
 *
 * `interface` EMAS, `type` — bu TypeScript'ning nozik qoidasi: faqat type
 * alias'lar yashirin index signature oladi, interface'lar olmaydi. `Link`
 * ning `query` maydoni index signature'li tipni kutadi, shuning uchun
 * `interface CatalogQuery` yozilsa "assignable emas" degan xato chiqadi.
 *
 * Kalitlar backend nomlarida (`subject_id`), chunki ular URL'ga shundayligicha
 * tushadi va sahifa ularni aynan shu nom bilan o'qiydi.
 */
export type CatalogQuery = {
	subject_id?: number;
	topic_id?: number;
	difficulty?: Difficulty;
	q?: string;
	page?: number;
};

/** `null` — "bu filtrni olib tashla", `undefined` — "tegma". */
export interface CatalogFilterPatch {
	subjectId?: number | null | undefined;
	topicId?: number | null | undefined;
	difficulty?: Difficulty | null | undefined;
	query?: string | null | undefined;
}

/**
 * Joriy filtrga o'zgarish qo'shib, havola uchun so'rov yasaydi.
 *
 * Ikkita ish qiladi, va ikkalasi ham qo'lda yozilganda esdan chiqadi:
 *
 * 1. Tegilmagan filtrlarni SAQLAYDI. Mavzu bosilganda tanlangan fan
 *    yo'qolmasligi kerak; qiyinlik filtri qo'shilganda esa uni har bir
 *    havolaga qo'lda ko'chirib yurmaslik kerak.
 *
 * 2. `page` ni HECH QACHON qaytarmaydi. Eng ko'p uchraydigan filtr xatosi
 *    shu: 5-sahifada turib fan almashtiriladi, `?page=5` qoladi va yangi
 *    filtrda 5-sahifa yo'q — foydalanuvchi bo'sh ro'yxat ko'radi. Bu yerda
 *    `page` umuman ifodalanmagani uchun uni "unutish" mumkin emas.
 *
 * Har maydon alohida yozilgan, umumiy sikl bilan emas: maydonlar turli
 * turda (`number` va `Difficulty`) va URL'dagi nomlari boshqa, ya'ni
 * sikl baribir har biri uchun alohida shox talab qilardi — aniq yozilgani
 * esa kompilyatorga har bir maydonni tekshirish imkonini beradi.
 */
export function filterQuery(
	current: CatalogFilters,
	patch: CatalogFilterPatch = {},
): CatalogQuery {
	const subjectId = applyPatch(current.subjectId, patch.subjectId);
	const topicId = applyPatch(current.topicId, patch.topicId);
	const difficulty = applyPatch(current.difficulty, patch.difficulty);
	const searchText = applyPatch(current.query, patch.query);

	// Maydonlar shartli qo'shiladi, `subject_id: undefined` deb emas:
	// `exactOptionalPropertyTypes` yoqilgan, va aniq `undefined` qiymat
	// URL'da `?subject_id=undefined` bo'lib chiqib qolishi mumkin.
	const query: CatalogQuery = {};
	if (subjectId !== undefined) query.subject_id = subjectId;
	if (topicId !== undefined) query.topic_id = topicId;
	if (difficulty !== undefined) query.difficulty = difficulty;
	// Bo'sh qidiruv URL'ga tushmaydi: `?q=` faqat manzilni ifloslantiradi
	// va backend uni baribir e'tiborsiz qoldiradi.
	if (searchText) query.q = searchText;
	return query;
}

/**
 * Sahifalash havolasi — `filterQuery` dan ALOHIDA funksiya.
 *
 * `filterQuery` `page` ni ataylab qaytarmaydi, va bu qoida shu yerda ham
 * buzilmasin: sahifa raqamini qo'shish uchun *boshqa* funksiya chaqirish
 * kerak. Agar `filterQuery` ga ixtiyoriy `page` argumenti qo'shilganda,
 * uni tasodifan uzatib yuborish yana mumkin bo'lardi.
 *
 * Birinchi sahifa uchun `?page=1` YOZILMAYDI: bo'lim uchun bitta kanonik
 * manzil bo'lishi kerak, aks holda `/masalalar` va `/masalalar?page=1`
 * bir xil kontentli ikki manzilga aylanadi.
 */
/**
 * Jami sondan sahifalar sonini hisoblaydi.
 *
 * `Math.max(1, …)`: natija bo'sh bo'lganda ham bitta sahifa bor —
 * foydalanuvchi "0 / 0" emas, "1" ni ko'rishi kerak.
 */
export function pageCount(total: number, perPage: number): number {
	return Math.max(1, Math.ceil(total / perPage));
}

/**
 * Sahifalash uchun ko'rsatiladigan raqamlar: `1 … 4 5 6 … 42`.
 *
 * Hamma raqamni chizish mumkin emas — 42 ta sahifada bu 42 ta havola
 * degani. Har doim birinchi va oxirgi, hamda joriy sahifaning ikki
 * qo'shnisi ko'rinadi; oradagi uzilish `gap` bilan belgilanadi.
 *
 * `Set` ishlatilgan, chunki chekkalarda raqamlar ustma-ust tushadi
 * (1-sahifada `current - 1` = 0, `1` va `count` bir xil bo'lishi
 * mumkin) — takrorlanishni qo'lda tekshirish shartsiz.
 */
export type PageItem = number | "gap";

export function pageItems(current: number, count: number): PageItem[] {
	const wanted = new Set([1, count, current - 1, current, current + 1]);
	const visible = [...wanted].filter((page) => page >= 1 && page <= count).sort((a, b) => a - b);

	const items: PageItem[] = [];
	let previous = 0;
	for (const page of visible) {
		if (previous !== 0 && page - previous > 1) items.push("gap");
		items.push(page);
		previous = page;
	}
	return items;
}

export function pageQuery(current: CatalogFilters, page: number): CatalogQuery {
	const query = filterQuery(current);
	if (page > 1) query.page = page;
	return query;
}

// Generik: `subject_id` son, `difficulty` esa satr birlashmasi.
// `null` — "olib tashla" degan sentinel, shuning uchun u qiymat turining
// o'zida bo'lishi mumkin emas (filtr qiymatlarimizda `null` yo'q).
function applyPatch<T>(
	current: T | undefined,
	patch: T | null | undefined,
): T | undefined {
	if (patch === undefined) return current;
	return patch === null ? undefined : patch;
}

/**
 * Ko'p tilli nomdan mavjud bo'lganini tanlaydi: so'ralgan → uz → birinchi.
 *
 * Bu backendning statement fallback qoidasi bilan AYNAN bir xil bo'lishi
 * kerak, aks holda fan nomi bir tilda, masala sarlavhasi boshqa tilda
 * chiqadi.
 */
export function pickName(name: Record<string, string>, apiLang: string): string {
	return name[apiLang] ?? name["uz"] ?? Object.values(name)[0] ?? "";
}
