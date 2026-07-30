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

export function formatSeconds(ms: number): string {
	// 1000 → "1 s", 1500 → "1.5 s". Butun bo'lsa kasr ko'rsatilmaydi.
	const seconds = ms / 1000;
	return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)} s`;
}

export function formatMemory(kb: number): string {
	return kb >= 1024 ? `${Math.round(kb / 1024)} MB` : `${kb} KB`;
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
