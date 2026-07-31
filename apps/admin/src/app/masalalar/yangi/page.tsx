"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminProblemsApi } from "@binary/api";
import { withFreshToken } from "@binary/session";
import { Button, Container } from "@binary/ui";
import {
	emptyForm,
	ProblemSettings,
	saveErrorMessage,
	STATEMENT_LANGS,
	StatementEditor,
	validate,
	type FieldErrors,
	type ProblemFormValues,
} from "@/features/problem-admin";
import { AdminHeader } from "@/widgets/admin-header";

/**
 * Yaratish — bitta ekran, tab'siz.
 *
 * Bu yerda tab'lar keraksiz: masala yaratish uchun sozlamalar HAM, shart
 * HAM bir vaqtda kerak (backend shartsiz masalani qabul qilmaydi), ya'ni
 * ikkalasini ham to'ldirmasdan davom etib bo'lmaydi. Tab'lar faqat
 * "to'ldirilmagan joy qayerda?" degan savol tug'dirardi.
 */
export default function NewProblemPage() {
	const router = useRouter();

	const [values, setValues] = useState<ProblemFormValues>(emptyForm());
	const [errors, setErrors] = useState<FieldErrors>({});
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	async function save() {
		const found = validate(values);
		setErrors(found);
		if (Object.keys(found).length > 0) {
			setError(null);
			return;
		}

		setSaving(true);
		setError(null);
		try {
			const created = await withFreshToken((token) =>
				adminProblemsApi.create(
					{
						subjectId: values.subjectId,
						slug: values.slug,
						difficulty: values.difficulty,
						timeLimitMs: values.timeLimitMs,
						memoryLimitKb: values.memoryLimitKb,
						sort: values.sort,
						// Bo'sh satr `null` ga: backendda maydon nullable va bo'sh
						// satr "manba bor, lekin nomi yo'q" degan ma'nosiz holat.
						source: nullIfEmpty(values.source),
						// Yaratishda mavzular masala bilan BIR tranzaksiyada
						// yoziladi (backend `Create` ichida), ya'ni alohida
						// so'rov kerak emas.
						topicIds: values.topicIds,
						statement: {
							lang: values.statement.lang,
							title: values.statement.title.trim(),
							legend: values.statement.legend,
							inputFormat: nullIfEmpty(values.statement.inputFormat),
							outputFormat: nullIfEmpty(values.statement.outputFormat),
							notes: nullIfEmpty(values.statement.notes),
						},
					},
					{ token },
				),
			);

			// Ro'yxatga EMAS, masalaning o'z sahifasiga. Yaratilgan masalada
			// hali test yo'q, ya'ni ish tugamagan — keyingi qadam shu yerda.
			router.push(`/masalalar/tahrir?id=${created.id}` as never);
		} catch (cause) {
			setError(saveErrorMessage(cause));
			setSaving(false);
		}
	}

	return (
		<>
			<AdminHeader />
			<Container className="py-6">
				<div className="flex flex-wrap items-center gap-3">
					<Link href="/" className="text-sm font-semibold text-fg-muted hover:text-fg">
						← Masalalar
					</Link>
					<h1 className="text-[20px] font-bold">Yangi masala</h1>

					<select
						value={values.statement.lang}
						onChange={(e) =>
							setValues({ ...values, statement: { ...values.statement, lang: e.target.value } })
						}
						aria-label="Shart tili"
						className="rounded-pill border border-border-default bg-surface px-3 py-1.5 text-[13px] font-semibold"
					>
						{STATEMENT_LANGS.map((item) => (
							<option key={item.code} value={item.code}>
								{item.label}
							</option>
						))}
					</select>
				</div>

				<div className="mt-5">
					<StatementEditor
						value={values.statement}
						onChange={(statement) => setValues({ ...values, statement })}
						titleError={errors.title}
						legendError={errors.legend}
					/>
				</div>

				<h2 className="mt-8 text-lg font-bold">Sozlamalar</h2>
				<div className="mt-3">
					<ProblemSettings
						values={values}
						onChange={(next) => setValues({ ...values, ...next })}
						errors={errors}
						titleForSlug={values.statement.title}
					/>
				</div>

				{error && (
					<p role="alert" className="mt-5 text-sm text-danger">
						{error}
					</p>
				)}

				<div className="mt-5 flex flex-wrap items-center gap-3">
					<Button type="button" onClick={() => void save()} disabled={saving}>
						{saving ? "Yaratilyapti…" : "Yaratish va davom etish"}
					</Button>
					<p className="text-sm text-fg-muted">
						Masala <strong>qoralama</strong> bo'lib yaratiladi. Keyin testlar
						qo'shasiz va nashr qilasiz.
					</p>
				</div>
			</Container>
		</>
	);
}

function nullIfEmpty(value: string): string | null {
	return value.trim() === "" ? null : value.trim();
}
