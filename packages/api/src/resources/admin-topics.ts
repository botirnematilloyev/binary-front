import { z } from "zod";
import { request, type RequestOptions } from "../http";

/*
 * Mavzular ustidan yozish. O'qish `taxonomy.ts` da qoladi — backendda
 * ham admin uchun alohida ro'yxat endpointi YO'Q: ommaviy `GET /topics`
 * hamma narsani qaytaradi va adminga yashiriladigan maydon yo'q.
 * Ikkinchi endpoint faqat ikkita haqiqat manbasi yasardi.
 *
 * Diqqat: o'sha ommaviy endpoint `Cache-Control: max-age=3600` yuboradi,
 * shuning uchun bu yerda yozgandan keyin ro'yxatni `cache: "no-store"`
 * bilan qayta so'rash kerak.
 */

/** Admin javobi ommaviydan kengroq: `sort` va vaqt belgilari ham bor. */
const adminTopicSchema = z.object({
	id: z.number().int(),
	subject_id: z.number().int(),
	slug: z.string(),
	name: z.record(z.string(), z.string()),
	sort: z.number().int(),
	created_at: z.number().int(),
	updated_at: z.number().int(),
});

export type AdminTopicDto = z.infer<typeof adminTopicSchema>;

export interface CreateTopicInput {
	subjectId: number;
	slug: string;
	/** Backend `uz` kalitini MAJBURIY qiladi (400 `invalid name`). */
	name: Record<string, string>;
	sort?: number;
}

export function create(input: CreateTopicInput, options: RequestOptions & { token: string }) {
	return request("/admin/topics", adminTopicSchema, {
		...options,
		method: "POST",
		body: {
			subject_id: input.subjectId,
			slug: input.slug,
			name: input.name,
			sort: input.sort ?? 0,
		},
	});
}

/** PATCH semantikasi: berilmagan maydon TEGILMAYDI. */
export interface UpdateTopicInput {
	subjectId?: number;
	slug?: string;
	name?: Record<string, string>;
	sort?: number;
}

export function update(
	id: number,
	input: UpdateTopicInput,
	options: RequestOptions & { token: string },
) {
	// Tana shartli yig'iladi: `subject_id: undefined` yozilsa, JSON'da
	// maydon umuman ko'rinmaydi va natija bir xil bo'lardi — lekin
	// aniq yozilgani niyatni ko'rsatadi va `null` bilan adashtirmaydi.
	const body: Record<string, unknown> = {};
	if (input.subjectId !== undefined) body["subject_id"] = input.subjectId;
	if (input.slug !== undefined) body["slug"] = input.slug;
	if (input.name !== undefined) body["name"] = input.name;
	if (input.sort !== undefined) body["sort"] = input.sort;

	return request(`/admin/topics/${id}`, adminTopicSchema, {
		...options,
		method: "PATCH",
		body,
	});
}

/**
 * O'chirish. Mavzu masalalarga biriktirilgan bo'lsa backend **409**
 * qaytaradi — chaqiruvchi buni ushlab, foydalanuvchiga tushuntirishi kerak.
 */
export function remove(id: number, options: RequestOptions & { token: string }) {
	return request(`/admin/topics/${id}`, z.void(), {
		...options,
		method: "DELETE",
	});
}
