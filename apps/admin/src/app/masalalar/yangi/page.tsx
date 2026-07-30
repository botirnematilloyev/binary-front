"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminProblemsApi } from "@binary/api";
import { withFreshToken } from "@binary/session";
import { Container } from "@binary/ui";
import {
	emptyForm,
	ProblemForm,
	saveErrorMessage,
	validate,
	type FieldErrors,
	type ProblemFormValues,
} from "@/features/problem-admin";
import { AdminHeader } from "@/widgets/admin-header";

export default function NewProblemPage() {
	const router = useRouter();

	const [values, setValues] = useState<ProblemFormValues>(emptyForm());
	const [errors, setErrors] = useState<FieldErrors>({});
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	async function save() {
		const found = validate(values);
		setErrors(found);
		if (Object.keys(found).length > 0) {
			setSaveError(null);
			return;
		}

		setSaving(true);
		setSaveError(null);
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
						source: emptyToNull(values.source),
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
			setSaveError(saveErrorMessage(cause));
			setSaving(false);
		}
	}

	return (
		<>
			<AdminHeader />
			<Container className="py-8">
				<h1 className="text-[22px] font-bold">Yangi masala</h1>
				<div className="mt-5">
					<ProblemForm
						values={values}
						onChange={setValues}
						errors={errors}
						saving={saving}
						saveError={saveError}
						submitLabel="Yaratish"
						onSubmit={() => void save()}
						extraActions={
							<p className="text-sm text-fg-muted">
								Masala <strong>qoralama</strong> holatida yaratiladi — nashr qilish
								alohida amal.
							</p>
						}
					/>
				</div>
			</Container>
		</>
	);
}

function emptyToNull(value: string): string | null {
	return value.trim() === "" ? null : value.trim();
}
