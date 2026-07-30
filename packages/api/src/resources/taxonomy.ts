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
