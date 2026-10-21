import { z } from "zod";
import { query, request, type RequestOptions } from "../http";
import { roleSchema } from "./auth";
import { sessionSchema } from "./profile";
import { statsSchema, submissionSchema } from "./submissions";

/*
 * Foydalanuvchilar — FAQAT admin (role 3). Setter `/admin/problems` ga
 * kira oladi, lekin bu yerga emas: javoblarda telefon, email va
 * boshqa odamning yechim kodi bor. Backend buni `RequireUserManager`
 * bilan yopadi, bu fayl esa farqni ko'rinadigan qiladi.
 */

const localizedName = z.record(z.string(), z.string());

const locationSchema = z.object({
	id: z.number().int(),
	name: localizedName,
});

export const accountProviderSchema = z.enum(["phone", "email", "telegram", "unknown"]);
export type AccountProvider = z.infer<typeof accountProviderSchema>;

const linkedAccountSchema = z.object({
	id: z.number().int(),
	provider: accountProviderSchema,
	identifier: z.string(),
	is_verified: z.boolean(),
	/** Telegram uchun username/ism; boshqalarda odatda yo'q. */
	metadata: z.record(z.string(), z.unknown()).optional(),
	created_at: z.number().int(),
});

const userSummarySchema = z.object({
	id: z.number().int(),
	username: z.string(),
	full_name: z.string().nullable(),
	role: roleSchema,
	region: locationSchema.nullable(),
	accounts: z.array(linkedAccountSchema),
	created_at: z.number().int(),
	/** Yechilgan MASALALAR soni (run'lar hisobga kirmaydi). */
	solved: z.number().int(),
	submissions: z.number().int(),
	last_submission_at: z.number().int().nullable(),
});

const userDetailSchema = z.object({
	id: z.number().int(),
	username: z.string(),
	full_name: z.string().nullable(),
	role: roleSchema,
	region: locationSchema.nullable(),
	district: locationSchema.nullable(),
	mentor: z
		.object({
			id: z.number().int(),
			username: z.string(),
			full_name: z.string().nullable(),
		})
		.nullable(),
	accounts: z.array(linkedAccountSchema),
	/** Faqat FAOL sessiyalar (bekor qilinmagan, muddati o'tmagan). */
	sessions: z.array(sessionSchema),
	created_at: z.number().int(),
	updated_at: z.number().int(),
});

const solvedProblemSchema = z.object({
	problem_id: z.number().int(),
	/** Masala o'chirilgan bo'lsa `null`. */
	problem: z.object({ slug: z.string(), title: z.string() }).nullable(),
	first_accepted_at: z.number().int(),
	/** Shu masala bo'yicha jami yechimlar. */
	attempts: z.number().int(),
});

const adminSubmissionSchema = submissionSchema.extend({
	user_id: z.number().int(),
});

export type AdminUserSummaryDto = z.infer<typeof userSummarySchema>;
export type AdminUserDetailDto = z.infer<typeof userDetailSchema>;
export type LinkedAccountDto = z.infer<typeof linkedAccountSchema>;
export type SolvedProblemDto = z.infer<typeof solvedProblemSchema>;
export type AdminSubmissionDto = z.infer<typeof adminSubmissionSchema>;

type AdminOptions = RequestOptions & { token: string };

export interface ListUsersParams {
	page?: number | undefined;
	perPage?: number | undefined;
	/** Username, ism, telefon, email yoki telegram id bo'yicha. */
	query?: string | undefined;
}

export function list(params: ListUsersParams, options: AdminOptions) {
	const search = query({ page: params.page, per_page: params.perPage, q: params.query });
	return request(
		`/admin/users${search}`,
		z.object({
			users: z.array(userSummarySchema),
			total: z.number().int(),
			page: z.number().int(),
			per_page: z.number().int(),
		}),
		options,
	);
}

export function get(id: number, options: AdminOptions) {
	return request(`/admin/users/${id}`, userDetailSchema, options);
}

export function stats(id: number, options: AdminOptions) {
	return request(`/admin/users/${id}/stats`, statsSchema, options);
}

export function solved(id: number, params: { lang?: string | undefined }, options: AdminOptions) {
	return request(
		`/admin/users/${id}/solved${query({ lang: params.lang })}`,
		z.object({ problems: z.array(solvedProblemSchema) }),
		options,
	);
}

/** Ro'yxatda kod KELMAYDI — uni `getSubmission` beradi. */
export function submissions(
	id: number,
	params: {
		page?: number | undefined;
		perPage?: number | undefined;
		problemId?: number | undefined;
		lang?: string | undefined;
	},
	options: AdminOptions,
) {
	const search = query({
		page: params.page,
		per_page: params.perPage,
		problem_id: params.problemId,
		lang: params.lang,
	});
	return request(
		`/admin/users/${id}/submissions${search}`,
		z.object({
			submissions: z.array(submissionSchema),
			page: z.number().int(),
			per_page: z.number().int(),
		}),
		options,
	);
}

/** Istalgan foydalanuvchining yechimi, kodi bilan. */
export function getSubmission(
	id: number,
	params: { lang?: string | undefined },
	options: AdminOptions,
) {
	return request(
		`/admin/submissions/${id}${query({ lang: params.lang })}`,
		adminSubmissionSchema,
		options,
	);
}
