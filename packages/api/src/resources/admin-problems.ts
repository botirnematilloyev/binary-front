import { z } from "zod";
import { query, request, type RequestOptions } from "../http";
import { difficultySchema, problemStatusSchema, type Difficulty } from "./problems";

/*
 * Admin endpointlari ALOHIDA faylda, `problems.ts` ichida emas.
 *
 * Sabab shakl emas, huquq: bu yerdagi har chaqiruv `RequireManager`
 * ortida va token talab qiladi. Ikkisini aralashtirsak, ochiq katalog
 * uchun yozilgan funksiya bir kun tokensiz admin so'rovini yuborib
 * qo'yishi mumkin edi. Ajratilgan fayl bu farqni ko'rinadigan qiladi.
 */

/** Admin javobi ochiq javobdan kengroq: muallif, sort, vaqt belgilari. */
const adminProblemSchema = z.object({
	id: z.number().int(),
	slug: z.string(),
	subject_id: z.number().int(),
	author_id: z.number().int(),
	difficulty: difficultySchema,
	status: problemStatusSchema,
	time_limit_ms: z.number().int(),
	memory_limit_kb: z.number().int(),
	source: z.string().nullable(),
	sort: z.number().int(),
	published_at: z.number().int().nullable(),
	created_at: z.number().int(),
	updated_at: z.number().int(),
});

/** Ro'yxatda sarlavha ham keladi (ochiq ro'yxatdagi kabi). */
const adminSummarySchema = z.object({
	id: z.number().int(),
	slug: z.string(),
	title: z.string(),
	lang: z.string(),
	subject_id: z.number().int(),
	difficulty: difficultySchema,
	status: problemStatusSchema,
	time_limit_ms: z.number().int(),
	memory_limit_kb: z.number().int(),
	published_at: z.number().int().nullable(),
});

const testCaseSchema = z.object({
	ordinal: z.number().int(),
	input: z.string(),
	expected_output: z.string(),
	is_sample: z.boolean(),
});

export type AdminProblemDto = z.infer<typeof adminProblemSchema>;
export type AdminProblemSummaryDto = z.infer<typeof adminSummarySchema>;
export type TestCaseDto = z.infer<typeof testCaseSchema>;

export interface ListAdminProblemsParams {
	page?: number | undefined;
	perPage?: number | undefined;
	subjectId?: number | undefined;
	/** Ochiq katalogdan farqli: bu yerda holat bo'yicha filtr MUMKIN. */
	status?: "draft" | "published" | "archived" | undefined;
	/** Slug va barcha tillardagi sarlavhalar bo'yicha qidiruv. */
	query?: string | undefined;
	lang?: string | undefined;
}

export function list(params: ListAdminProblemsParams, options: RequestOptions & { token: string }) {
	const search = query({
		page: params.page,
		per_page: params.perPage,
		subject_id: params.subjectId,
		status: params.status,
		q: params.query,
		lang: params.lang,
	});
	return request(
		`/admin/problems${search}`,
		z.object({
			problems: z.array(adminSummarySchema),
			total: z.number().int(),
			page: z.number().int(),
			per_page: z.number().int(),
		}),
		options,
	);
}

export function get(id: number, options: RequestOptions & { token: string }) {
	return request(`/admin/problems/${id}`, adminProblemSchema, options);
}

export interface StatementInput {
	lang: string;
	title: string;
	legend: string;
	inputFormat?: string | null;
	outputFormat?: string | null;
	notes?: string | null;
}

export interface CreateProblemInput {
	subjectId: number;
	slug: string;
	difficulty: Difficulty;
	timeLimitMs: number;
	memoryLimitKb: number;
	sort?: number;
	source?: string | null;
	/** Shart MAJBURIY: backend yarim qurilgan masalani qabul qilmaydi. */
	statement: StatementInput;
	topicIds?: number[];
}

function statementBody(input: StatementInput) {
	return {
		lang: input.lang,
		title: input.title,
		legend: input.legend,
		input_format: input.inputFormat ?? null,
		output_format: input.outputFormat ?? null,
		notes: input.notes ?? null,
	};
}

export function create(input: CreateProblemInput, options: RequestOptions & { token: string }) {
	return request("/admin/problems", adminProblemSchema, {
		...options,
		method: "POST",
		body: {
			subject_id: input.subjectId,
			slug: input.slug,
			difficulty: input.difficulty,
			time_limit_ms: input.timeLimitMs,
			memory_limit_kb: input.memoryLimitKb,
			sort: input.sort ?? 0,
			source: input.source ?? null,
			statement: statementBody(input.statement),
			topic_ids: input.topicIds ?? [],
		},
	});
}

/** PATCH semantikasi: berilmagan maydon TEGILMAYDI. */
export interface UpdateProblemInput {
	subjectId?: number;
	slug?: string;
	difficulty?: Difficulty;
	timeLimitMs?: number;
	memoryLimitKb?: number;
	sort?: number;
	source?: string | null;
}

export function update(
	id: number,
	input: UpdateProblemInput,
	options: RequestOptions & { token: string },
) {
	const body: Record<string, unknown> = {};
	if (input.subjectId !== undefined) body["subject_id"] = input.subjectId;
	if (input.slug !== undefined) body["slug"] = input.slug;
	if (input.difficulty !== undefined) body["difficulty"] = input.difficulty;
	if (input.timeLimitMs !== undefined) body["time_limit_ms"] = input.timeLimitMs;
	if (input.memoryLimitKb !== undefined) body["memory_limit_kb"] = input.memoryLimitKb;
	if (input.sort !== undefined) body["sort"] = input.sort;
	if (input.source !== undefined) body["source"] = input.source;

	return request(`/admin/problems/${id}`, adminProblemSchema, {
		...options,
		method: "PATCH",
		body,
	});
}

const statementSchema = z.object({
	lang: z.string(),
	title: z.string(),
	legend: z.string(),
	input_format: z.string().nullable(),
	output_format: z.string().nullable(),
	notes: z.string().nullable(),
});

export type AdminStatementDto = z.infer<typeof statementSchema>;

/**
 * Masalaning BARCHA tillardagi shartlari.
 *
 * Ochiq `getProblem` dan farqi ikkita: u bitta tilni tanlab beradi (til
 * tanlash qoidasi bilan), va nashr qilinmagan masala uchun 404 qaytaradi.
 * Setter esa aynan qoralamani tahrirlaydi.
 */
export function listStatements(id: number, options: RequestOptions & { token: string }) {
	return request(
		`/admin/problems/${id}/statements`,
		z.object({ statements: z.array(statementSchema) }),
		options,
	);
}

export function upsertStatement(
	id: number,
	input: StatementInput,
	options: RequestOptions & { token: string },
) {
	return request(
		`/admin/problems/${id}/statements`,
		z.object({
			lang: z.string(),
			title: z.string(),
			legend: z.string(),
			input_format: z.string().nullable(),
			output_format: z.string().nullable(),
			notes: z.string().nullable(),
		}),
		{ ...options, method: "PUT", body: statementBody(input) },
	);
}

export function listTestCases(id: number, options: RequestOptions & { token: string }) {
	return request(
		`/admin/problems/${id}/tests`,
		z.object({ test_cases: z.array(testCaseSchema) }),
		options,
	);
}

/**
 * Testlar to'plamini butunlay ALMASHTIRADI (backend `DeleteNotIn` +
 * upsert qiladi), ya'ni yuborilmagan tartib raqami o'chadi.
 *
 * Javob — `204 No Content`, shuning uchun sxema `z.void()`.
 */
export function setTestCases(
	id: number,
	cases: TestCaseDto[],
	options: RequestOptions & { token: string },
) {
	return request(`/admin/problems/${id}/tests`, z.void(), {
		...options,
		method: "PUT",
		body: { test_cases: cases },
	});
}

/**
 * Nashr — alohida amal, `update` dagi maydon emas.
 *
 * Backendda ham shunday: holat o'zgarishi qoidalarga ega
 * (shartsiz masalani nashr qilib bo'lmaydi — 422) va nojo'ya ta'siri bor
 * (`published_at` faqat BIRINCHI nashrda qo'yiladi).
 */
/*
 * Masalaga biriktirilgan mavzular.
 *
 * O'qish uchun ommaviy `getProblem` dan foydalanib bo'lmaydi: u
 * qoralama masala uchun 404 qaytaradi, setter esa aynan qoralamani
 * tahrirlaydi.
 */
export function listProblemTopics(id: number, options: RequestOptions & { token: string }) {
	return request(
		`/admin/problems/${id}/topics`,
		z.object({
			topics: z.array(
				z.object({
					id: z.number().int(),
					subject_id: z.number().int(),
					slug: z.string(),
					name: z.record(z.string(), z.string()),
				}),
			),
		}),
		options,
	);
}

/**
 * Mavzularni to'liq ALMASHTIRADI — qo'shish/olib tashlash emas.
 *
 * Backend `ReplaceTopics` farqni o'zi hisoblaydi, ya'ni tegilmagan
 * bog'lanishlar qayta yozilmaydi. Bo'sh massiv — barcha mavzularni
 * olib tashlash degani va bu to'g'ri ishlaydi (`COALESCE($2, '{}')`).
 */
export function setProblemTopics(
	id: number,
	topicIds: number[],
	options: RequestOptions & { token: string },
) {
	return request(`/admin/problems/${id}/topics`, z.void(), {
		...options,
		method: "PUT",
		body: { topic_ids: topicIds },
	});
}

export function publish(id: number, options: RequestOptions & { token: string }) {
	return request(`/admin/problems/${id}/publish`, adminProblemSchema, {
		...options,
		method: "POST",
	});
}

export function unpublish(id: number, options: RequestOptions & { token: string }) {
	return request(`/admin/problems/${id}/unpublish`, adminProblemSchema, {
		...options,
		method: "POST",
	});
}

/**
 * Masalani butunlay o'chirish.
 *
 * Backend `problem_statements`, `test_cases` va `problem_topics` ni
 * cascade bilan olib tashlaydi. Agar masalaga submission bog'langan
 * bo'lsa, baza himoya qiladi va backend **409** qaytaradi.
 */
export function remove(id: number, options: RequestOptions & { token: string }) {
	return request(`/admin/problems/${id}`, z.void(), {
		...options,
		method: "DELETE",
	});
}
