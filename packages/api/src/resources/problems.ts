import { z } from "zod";
import { query, request, type RequestOptions } from "../http";

/*
 * Enumlar `z.enum` bilan yopiq ro'yxat sifatida e'lon qilinadi, `z.string()`
 * emas. Backend yangi qiymat qo'shsa — masalan to'rtinchi qiyinlik darajasi —
 * bu yerda BALAND ovozda `ApiContractError` chiqadi. `z.string()` bo'lsa,
 * noma'lum qiymat UI'ga o'tib ketardi va rangsiz badge yoki bo'sh matn
 * ko'rinishida jimgina namoyon bo'lardi.
 */
export const difficultySchema = z.enum(["easy", "medium", "hard"]);
export const problemStatusSchema = z.enum(["draft", "published", "archived"]);

export type Difficulty = z.infer<typeof difficultySchema>;
export type ProblemStatus = z.infer<typeof problemStatusSchema>;

const topicSchema = z.object({
	id: z.number().int(),
	subject_id: z.number().int(),
	slug: z.string(),
	// Ko'p tilli nom: backend butun map'ni qaytaradi va tilni mijoz tanlaydi.
	name: z.record(z.string(), z.string()),
});

const problemSummarySchema = z.object({
	id: z.number().int(),
	slug: z.string(),
	title: z.string(),
	/** Sarlavha QAYSI tilda qaytganini bildiradi — so'ralgani bo'lmasligi mumkin. */
	lang: z.string(),
	subject_id: z.number().int(),
	difficulty: difficultySchema,
	status: problemStatusSchema,
	time_limit_ms: z.number().int(),
	memory_limit_kb: z.number().int(),
	attempts: z.number().int().default(0),
	accepted: z.number().int().default(0),
	/** Yechganlar — har bir foydalanuvchi bir marta, qayta yuborishlar hisoblanmaydi. */
	solvers: z.number().int().default(0),
	/** Urinib ko'rganlar — kamida bitta yechim yuborgan foydalanuvchilar. */
	attempters: z.number().int().default(0),
	published_at: z.number().int().nullable(),
	/** Jadvaldagi MAVZU ustuni uchun; tafsilotdagi bilan bir xil DTO. */
	topics: z.array(topicSchema),
});

const problemListSchema = z.object({
	problems: z.array(problemSummarySchema),
	/** Filtrga mos JAMI son — shu sahifadagi emas. Sahifalash shundan quriladi. */
	total: z.number().int(),
	page: z.number().int(),
	per_page: z.number().int(),
});

const statementSchema = z.object({
	lang: z.string(),
	title: z.string(),
	/** Markdown + LaTeX. Xom HTML backendda o'chirilgan. */
	legend: z.string(),
	input_format: z.string().nullable(),
	output_format: z.string().nullable(),
	notes: z.string().nullable(),
});

const sampleSchema = z.object({
	ordinal: z.number().int(),
	input: z.string(),
	expected_output: z.string(),
});

const problemDetailSchema = z.object({
	id: z.number().int(),
	slug: z.string(),
	subject_id: z.number().int(),
	difficulty: difficultySchema,
	status: problemStatusSchema,
	time_limit_ms: z.number().int(),
	memory_limit_kb: z.number().int(),
	source: z.string().nullable(),
	published_at: z.number().int().nullable(),
	statement: statementSchema,
	topics: z.array(topicSchema),
	/** hreflang uchun kerak: bu masala qaysi tillarda mavjud. */
	available_langs: z.array(z.string()),
	/** Namunalar `test_cases WHERE is_sample` dan keladi, shartdan nusxa emas. */
	samples: z.array(sampleSchema),
	/*
	 * Jami testlar soni — yashirinlari ham. Ularning MAZMUNI qaytmaydi,
	 * faqat soni: u tekshiruv holatini ko'rsatish uchun kerak.
	 *
	 * `total` dan farqli, bu maydon MAJBURIY EMAS. Farq oqibatda:
	 * `total` yo'q bo'lsa sahifalash jimgina yolg'on ko'rsatardi, bu
	 * yerda esa nol qiymat "testlar holatini chizmaymiz" degani —
	 * ya'ni degradatsiya xavfsiz. Shu tufayli eski backend bilan ham
	 * sahifa ishlaydi va deploy tartibiga bog'liq qolmaydi.
	 */
	test_count: z.number().int().default(0),
});

export type ProblemSummaryDto = z.infer<typeof problemSummarySchema>;
export type ProblemDetailDto = z.infer<typeof problemDetailSchema>;
export type StatementDto = z.infer<typeof statementSchema>;
export type TopicDto = z.infer<typeof topicSchema>;
export type SampleDto = z.infer<typeof sampleSchema>;

/*
 * `?: T | undefined` — `?: T` emas. `exactOptionalPropertyTypes` yoqilgan,
 * ya'ni ular ikki xil narsa: birinchisi "maydon bo'lmasligi ham, aniq
 * `undefined` bo'lishi ham mumkin", ikkinchisi faqat "bo'lmasligi mumkin".
 * Filtrlar URL'dan keladi va u yerda yo'q qiymat aynan `undefined` bo'lib
 * uzatiladi, shuning uchun bu yerda birinchi shakl to'g'ri.
 */
export interface ListProblemsParams {
	page?: number | undefined;
	perPage?: number | undefined;
	subjectId?: number | undefined;
	topicId?: number | undefined;
	difficulty?: Difficulty | undefined;
	/** Slug va barcha tillardagi sarlavhalar bo'yicha qidiruv. */
	query?: string | undefined;
	lang?: string | undefined;
}

/**
 * Ochiq katalog. `status` parametri ATAYLAB yo'q — backend ochiq ro'yxatda
 * har doim `published` ni majburlaydi va so'rovda uni ifodalash imkoniyati
 * yo'q. Shu cheklovni frontend ham takrorlaydi: mumkin bo'lmagan narsa
 * yozilmasligi kerak.
 */
export function listProblems(params: ListProblemsParams = {}, options?: RequestOptions) {
	const search = query({
		page: params.page,
		per_page: params.perPage,
		subject_id: params.subjectId,
		topic_id: params.topicId,
		difficulty: params.difficulty,
		q: params.query,
		lang: params.lang,
	});
	return request(`/problems${search}`, problemListSchema, options);
}

export function getProblem(slug: string, lang?: string, options?: RequestOptions) {
	return request(
		`/problems/${encodeURIComponent(slug)}${query({ lang })}`,
		problemDetailSchema,
		options,
	);
}
