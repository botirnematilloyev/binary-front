import { z } from "zod";
import { query, request, type RequestOptions } from "../http";

const leaderboardEntrySchema = z.object({
	rank: z.number().int(),
	user_id: z.number().int(),
	username: z.string(),
	full_name: z.string().nullable(),
	solved: z.number().int(),
	rating: z.number().int(),
	/**
	 * Contest rating change emas. Hozircha oxirgi 7 kunda practice
	 * reytingga qo'shilgan ball, shuning uchun manfiy bo'lmaydi.
	 */
	change: z.number().int(),
});

const leaderboardSchema = z.object({
	users: z.array(leaderboardEntrySchema),
	page: z.number().int(),
	per_page: z.number().int(),
});

export type LeaderboardEntryDto = z.infer<typeof leaderboardEntrySchema>;
export type LeaderboardDto = z.infer<typeof leaderboardSchema>;

export function getLeaderboard(
	params: { page?: number | undefined; perPage?: number | undefined } = {},
	options?: RequestOptions,
) {
	return request(
		`/leaderboard${query({ page: params.page, per_page: params.perPage })}`,
		leaderboardSchema,
		options,
	);
}
