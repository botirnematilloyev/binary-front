import type { BadgeProps } from "@binary/ui";
import type { Difficulty, ProblemSummaryDto } from "@binary/api";
import { formatMemory, formatSeconds } from "@/shared/format";

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
	slug: string;
	title: string;
	/** Sarlavha so'ralgan tilda kelmasa, `titleLang` shu haqda xabar beradi. */
	titleLang: string;
	difficulty: Difficulty;
	difficultyTone: NonNullable<BadgeProps["tone"]>;
	limits: string;
}

/**
 * DTO → view model.
 *
 * Komponent xom DTO ko'rmaydi. Sabab: `time_limit_ms: 1000` ni "1 s" ga
 * aylantirish qoidasi bitta joyda bo'lishi kerak, aks holda ro'yxatda
 * "1 s", tafsilotda "1000 ms" chiqib, ikkalasi ham to'g'ri bo'lgani
 * holda sayt beg'ubor ko'rinmaydi.
 */
export function toProblemRow(dto: ProblemSummaryDto): ProblemRow {
	return {
		id: dto.id,
		slug: dto.slug,
		title: dto.title,
		titleLang: dto.lang,
		difficulty: dto.difficulty,
		difficultyTone: DIFFICULTY_TONE[dto.difficulty],
		limits: `${formatSeconds(dto.time_limit_ms)} · ${formatMemory(dto.memory_limit_kb)}`,
	};
}

export function difficultyTone(
	difficulty: Difficulty,
): NonNullable<BadgeProps["tone"]> {
	return DIFFICULTY_TONE[difficulty];
}

/** URL'dan o'qilgan joriy filtr holati. */
export interface CatalogFilters {
	subjectId?: number | undefined;
	topicId?: number | undefined;
}

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
};

/** `null` — "bu filtrni olib tashla", `undefined` — "tegma". */
export interface CatalogFilterPatch {
	subjectId?: number | null | undefined;
	topicId?: number | null | undefined;
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
 * Har maydon alohida yozilgan, umumiy sikl bilan emas: `difficulty` satr
 * bo'ladi, ya'ni `number` ustidan yurgan sikl baribir buzilardi, va aniq
 * yozilgani uchun kompilyator har bir maydonni tekshira oladi.
 */
export function filterQuery(
	current: CatalogFilters,
	patch: CatalogFilterPatch = {},
): CatalogQuery {
	const subjectId = applyPatch(current.subjectId, patch.subjectId);
	const topicId = applyPatch(current.topicId, patch.topicId);

	// Maydonlar shartli qo'shiladi, `subject_id: undefined` deb emas:
	// `exactOptionalPropertyTypes` yoqilgan, va aniq `undefined` qiymat
	// URL'da `?subject_id=undefined` bo'lib chiqib qolishi mumkin.
	const query: CatalogQuery = {};
	if (subjectId !== undefined) query.subject_id = subjectId;
	if (topicId !== undefined) query.topic_id = topicId;
	return query;
}

function applyPatch(
	current: number | undefined,
	patch: number | null | undefined,
): number | undefined {
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
