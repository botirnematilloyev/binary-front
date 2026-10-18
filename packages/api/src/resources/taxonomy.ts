import { z } from "zod";
import { query, request, type RequestOptions } from "../http";

const localizedName = z.record(z.string(), z.string());

const subjectSchema = z.object({
	id: z.number().int(),
	slug: z.string(),
	name: localizedName,
});

const topicSchema = z.object({
	id: z.number().int(),
	subject_id: z.number().int(),
	slug: z.string(),
	name: localizedName,
});

export type SubjectDto = z.infer<typeof subjectSchema>;
export type TopicDto = z.infer<typeof topicSchema>;

export function listSubjects(options?: RequestOptions) {
	return request("/subjects", z.object({ subjects: z.array(subjectSchema) }), options);
}

export function listTopics(subjectId?: number, options?: RequestOptions) {
	return request(
		`/topics${query({ subject_id: subjectId })}`,
		z.object({ topics: z.array(topicSchema) }),
		options,
	);
}

/*
 * Yo'l xaritasi — mavzular grafi.
 *
 * `listTopics` bilan ikkilanmaydi va uni almashtirmaydi ham: o'sha
 * tekis ro'yxatni qaytaradi (filtr uchun), bu esa bog'lanishlari,
 * sathlari va progressi bilan grafni. Ikkalasi bir uchdan kelsa ham,
 * savollari boshqa.
 */
const roadmapNodeSchema = z.object({
	id: z.number().int(),
	slug: z.string(),
	name: localizedName,
	/** Oldingi mavzular id'lari — chizmadagi chiziqlar shundan quriladi. */
	requires: z.array(z.number().int()),
	/** Grafdagi qator: 0 — hech nima talab qilmaydigan mavzular. */
	level: z.number().int(),
	total: z.number().int(),
	solved: z.number().int(),
});

const roadmapSchema = z.object({
	subject: subjectSchema,
	nodes: z.array(roadmapNodeSchema),
	total: z.number().int(),
	solved: z.number().int(),
	topics: z.number().int(),
	done_topics: z.number().int(),
});

export type RoadmapNodeDto = z.infer<typeof roadmapNodeSchema>;
export type RoadmapDto = z.infer<typeof roadmapSchema>;

export function getRoadmap(subject: string, options?: RequestOptions) {
	return request(`/roadmap${query({ subject })}`, roadmapSchema, options);
}
