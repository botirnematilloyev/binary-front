"use client";

import { useRouter } from "next/navigation";
import { adminProblemsApi } from "@binary/api";
import { withFreshToken } from "@binary/session";
import { Container } from "@binary/ui";
import { ProblemForm, saveErrorMessage, type ProblemFormValues } from "@/features/problem-admin";
import { AdminHeader } from "@/widgets/admin-header";

export default function NewProblemPage() {
	const router = useRouter();

	async function save(values: ProblemFormValues) {
		try {
			await withFreshToken((token) =>
				adminProblemsApi.create(
					{
						subjectId: values.subjectId,
						slug: values.slug,
						difficulty: values.difficulty,
						timeLimitMs: values.timeLimitMs,
						memoryLimitKb: values.memoryLimitKb,
						sort: values.sort,
						// Bo'sh satr `null` ga aylantiriladi: backendda bu maydon
						// nullable va bo'sh satr "manba bor, lekin nomi yo'q"
						// degan ma'nosiz holatni yasardi.
						source: values.source.trim() === "" ? null : values.source.trim(),
						statement: {
							lang: values.statement.lang,
							title: values.statement.title.trim(),
							legend: values.statement.legend,
							inputFormat: emptyToNull(values.statement.inputFormat),
							outputFormat: emptyToNull(values.statement.outputFormat),
							notes: emptyToNull(values.statement.notes),
						},
					},
					{ token },
				),
			);
			router.push("/");
		} catch (cause) {
			// Xatoni forma ko'rsatadi — u qaysi maydonda ekanini bilmaydi,
			// lekin xabar foydalanuvchi tilida bo'lishi kerak.
			throw new Error(saveErrorMessage(cause));
		}
	}

	return (
		<>
			<AdminHeader />
			<Container className="py-8">
				<h1 className="text-[22px] font-bold">Yangi masala</h1>
				<div className="mt-5">
					<ProblemForm submitLabel="Yaratish" onSave={save} />
				</div>
			</Container>
		</>
	);
}

function emptyToNull(value: string): string | null {
	return value.trim() === "" ? null : value.trim();
}
