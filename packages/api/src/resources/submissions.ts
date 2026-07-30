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
	/** Faqat egasiga qaytadi. */
	source_code: z.string().optional(),
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

export function getSubmission(id: number, options: RequestOptions & { token: string }) {
	return request(`/submissions/${id}`, submissionSchema, options);
}

export function listSubmissions(
	params: {
		page?: number | undefined;
		perPage?: number | undefined;
		problemId?: number | undefined;
	},
	options: RequestOptions & { token: string },
) {
	const search = query({
		page: params.page,
		per_page: params.perPage,
		problem_id: params.problemId,
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
