import { z } from "zod";
import { query, request, type RequestOptions } from "../http";

/*
 * `status` va `verdict` — ATAYLAB ikkita alohida maydon, backendda ham
 * shunday. `status` bu jarayon qayerda (navbatda / ishlayapti / tugadi),
 * `verdict` esa natija (accepted / wrong_answer / ...). Bittaga
 * qo'shilsa, "ishlab turgan yechimning verdikti nima?" degan savolga
 * javob bo'lmay qolardi.
 */
export const submissionStatusSchema = z.enum([
	"queued",
	"running",
	"done",
	"internal_error",
]);

export const verdictSchema = z.enum([
	"accepted",
	"wrong_answer",
	"time_limit_exceeded",
	"memory_limit_exceeded",
	"runtime_error",
	"compile_error",
	"output_limit_exceeded",
]);

export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;
export type Verdict = z.infer<typeof verdictSchema>;

const languageSchema = z.object({
	code: z.string(),
	name: z.string(),
	version: z.string(),
});

const submissionSchema = z.object({
	id: z.number().int(),
	problem_id: z.number().int(),
	language: languageSchema,
	status: submissionStatusSchema,
	/**
	 * Pollingni to'xtatish sharti. `status === "done"` ni tekshirish
	 * o'rniga shuni ishlatamiz: `internal_error` ham yakuniy holat, va
	 * `status` ro'yxati kelajakda o'sishi mumkin.
	 */
	is_final: z.boolean(),
	verdict: verdictSchema.nullable(),
	failed_test: z.number().int().nullable(),
	time_ms: z.number().int().nullable(),
	memory_kb: z.number().int().nullable(),
	compile_output: z.string().optional(),
	/**
	 * Dasturning HAR kirish uchun chiqishi — kirishlar bilan bir xil
	 * tartibda. Faqat o'z kirishi bilan ishlangan run'da keladi.
	 */
	run_outputs: z.array(z.string()).optional(),
	/** Faqat egasiga qaytadi. */
	source_code: z.string().optional(),
	/**
	 * Yechim qaysi masalaga tegishli. Faqat RO'YXATDA keladi: bitta
	 * yechim sahifasida masala nomi allaqachon kontekstda bor.
	 */
	problem: z
		.object({
			slug: z.string(),
			title: z.string(),
		})
		.optional(),
	created_at: z.number().int(),
	judged_at: z.number().int().nullable(),
});

export type SubmissionDto = z.infer<typeof submissionSchema>;
export type LanguageDto = z.infer<typeof languageSchema>;

export function listLanguages(options?: RequestOptions) {
	return request("/languages", z.object({ languages: z.array(languageSchema) }), options);
}

export function submit(
	slug: string,
	input: { language: string; sourceCode: string },
	options: RequestOptions & { token: string },
) {
	return request(`/problems/${encodeURIComponent(slug)}/submissions`, submissionSchema, {
		...options,
		method: "POST",
		body: { language: input.language, source_code: input.sourceCode },
	});
}

/**
 * Yechim yubormasdan kodni sinab ko'rish.
 *
 * Javob `submit` bilan BIR XIL shaklda — ya'ni polling kodi ham bir xil.
 * Farq natijada: kirish berilmasa namuna testlari bo'yicha verdikt
 * chiqadi, berilsa `run_outputs` — har kirish uchun chiqish.
 *
 * `customInputs` BERILMASA namunalar bo'yicha ketadi. Berilsa — har
 * kirish uchun alohida ishga tushirish, lekin BITTA sandbox ichida.
 * Ro'yxat ichidagi bo'sh satr haqiqiy kirish (kirish talab qilmaydigan
 * dastur), shuning uchun u tashlab yuborilmaydi.
 */
export function run(
	slug: string,
	input: {
		language: string;
		sourceCode: string;
		customInputs?: string[] | undefined;
	},
	options: RequestOptions & { token: string },
) {
	return request(`/problems/${encodeURIComponent(slug)}/run`, submissionSchema, {
		...options,
		method: "POST",
		body: {
			language: input.language,
			source_code: input.sourceCode,
			custom_inputs: input.customInputs ?? null,
		},
	});
}

export function getSubmission(id: number, options: RequestOptions & { token: string }) {
	return request(`/submissions/${id}`, submissionSchema, options);
}

export function listSubmissions(
	params: {
		page?: number | undefined;
		perPage?: number | undefined;
		problemId?: number | undefined;
		/** Masala nomlari qaysi tilda kerakligi. */
		lang?: string | undefined;
	},
	options: RequestOptions & { token: string },
) {
	const search = query({
		page: params.page,
		per_page: params.perPage,
		problem_id: params.problemId,
		lang: params.lang,
	});
	return request(
		`/submissions${search}`,
		z.object({
			submissions: z.array(submissionSchema),
			page: z.number().int(),
			per_page: z.number().int(),
		}),
		options,
	);
}

// ---- profil ----

const statsSchema = z.object({
	/** Yechilgan MASALALAR soni — yechimlar soni emas. */
	solved: z.number().int(),
	attempted: z.number().int(),
	total: z.number().int(),
	accepted: z.number().int(),
	/** Yechim bo'lmasa `null` — nol qiymat 1970-yilni bildirardi. */
	first_at: z.number().int().nullable(),
	last_at: z.number().int().nullable(),
	by_language: z.array(
		z.object({
			code: z.string(),
			name: z.string(),
			total: z.number().int(),
			accepted: z.number().int(),
		}),
	),
});

export type StatsDto = z.infer<typeof statsSchema>;

export function getStats(options: RequestOptions & { token: string }) {
	return request("/submissions/stats", statsSchema, options);
}

const activitySchema = z.object({
	days: z.array(
		z.object({
			/** `YYYY-MM-DD` (UTC) — kalendar kuni, vaqt belgisi emas. */
			day: z.string(),
			count: z.number().int(),
		}),
	),
});

export type ActivityDto = z.infer<typeof activitySchema>;

/**
 * Kunlik faollik. Yozuv BO'LMAGAN kunlar javobda yo'q — bo'sh
 * kataklarni mijoz o'zi to'ldiradi.
 */
export function getActivity(days: number, options: RequestOptions & { token: string }) {
	return request(`/submissions/activity${query({ days })}`, activitySchema, options);
}
