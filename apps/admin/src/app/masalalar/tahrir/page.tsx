"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { adminProblemsApi } from "@binary/api";
import { withFreshToken } from "@binary/session";
import { Button, Container, Panel } from "@binary/ui";
import {
	blankStatement,
	ProblemForm,
	saveErrorMessage,
	STATEMENT_LANGS,
	statementChanged,
	statementIsEmpty,
	validate,
	type FieldErrors,
	type ProblemFormValues,
	type StatementValues,
} from "@/features/problem-admin";
import { AdminHeader } from "@/widgets/admin-header";

export default function EditProblemPage() {
	return (
		<>
			<AdminHeader />
			{/*
			 * `useSearchParams` statik eksportda Suspense chegarasini talab
			 * qiladi: sahifa build paytida query'ni bilmaydi, u faqat
			 * brauzerda ma'lum bo'ladi.
			 */}
			<Suspense
				fallback={
					<Container className="py-8">
						<div className="h-40 animate-pulse rounded-card bg-surface-muted" />
					</Container>
				}
			>
				<EditProblem />
			</Suspense>
		</>
	);
}

type Load = { phase: "loading" } | { phase: "ready" } | { phase: "error"; message: string };

function EditProblem() {
	const params = useSearchParams();
	const rawId = params.get("id");
	const id = rawId !== null && /^\d+$/.test(rawId) ? Number(rawId) : null;

	const [load, setLoad] = useState<Load>({ phase: "loading" });
	const [values, setValues] = useState<ProblemFormValues | null>(null);

	/**
	 * Barcha tillardagi shartlar.
	 *
	 * `values.statement` — shulardan FAQAT joriy tildagisi. Til
	 * almashganda tahrirlar yo'qolmasligi uchun ular shu xaritada
	 * saqlanadi, va saqlashda o'zgargan hammasi yuboriladi. Aks holda
	 * setter o'zbekchani tahrirlab, ruschaga o'tib, saqlaganda o'zbekcha
	 * tahrirlari jimgina yo'qolardi.
	 */
	const [byLang, setByLang] = useState<Record<string, StatementValues>>({});
	/** Serverdan kelgan holat — nima o'zgarganini bilish uchun. */
	const [original, setOriginal] = useState<Record<string, StatementValues>>({});

	const [errors, setErrors] = useState<FieldErrors>({});
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	const fetchAll = useCallback(async (problemId: number) => {
		setLoad({ phase: "loading" });
		try {
			// Ikkita so'rov bir-biriga bog'liq emas.
			const [problem, statements] = await withFreshToken(async (token) =>
				Promise.all([
					adminProblemsApi.get(problemId, { token }),
					adminProblemsApi.listStatements(problemId, { token }),
				]),
			);

			const map: Record<string, StatementValues> = {};
			for (const st of statements.statements) {
				map[st.lang] = {
					lang: st.lang,
					title: st.title,
					legend: st.legend,
					inputFormat: st.input_format ?? "",
					outputFormat: st.output_format ?? "",
					notes: st.notes ?? "",
				};
			}

			// Boshlang'ich til: `uz` bo'lsa o'sha, bo'lmasa birinchi mavjudi.
			const firstLang = map["uz"] ? "uz" : (Object.keys(map)[0] ?? "uz");

			setByLang(map);
			setOriginal(map);
			setValues({
				slug: problem.slug,
				subjectId: problem.subject_id,
				difficulty: problem.difficulty,
				timeLimitMs: problem.time_limit_ms,
				memoryLimitKb: problem.memory_limit_kb,
				sort: problem.sort,
				source: problem.source ?? "",
				statement: map[firstLang] ?? blankStatement(firstLang),
			});
			setLoad({ phase: "ready" });
		} catch (cause) {
			setLoad({ phase: "error", message: saveErrorMessage(cause) });
		}
	}, []);

	useEffect(() => {
		if (id === null) {
			setLoad({ phase: "error", message: "Manzilda masala id'si ko'rsatilmagan." });
			return;
		}
		void fetchAll(id);
	}, [id, fetchAll]);

	function onFormChange(next: ProblemFormValues) {
		setValues(next);
		setSaved(false);
		// Joriy tildagi tahrirni xaritaga ham yozamiz — til almashganda
		// yo'qolmasligi uchun.
		setByLang((current) => ({ ...current, [next.statement.lang]: next.statement }));
	}

	function switchLang(lang: string) {
		if (!values) return;
		setValues({ ...values, statement: byLang[lang] ?? blankStatement(lang) });
		setSaved(false);
	}

	async function save() {
		if (!values || id === null) return;

		const found = validate(values);
		setErrors(found);
		if (Object.keys(found).length > 0) {
			setSaveError(null);
			return;
		}

		setSaving(true);
		setSaveError(null);
		try {
			await withFreshToken(async (token) => {
				// Masala maydonlari — `slug` YUBORILMAYDI: u doimiy manzil va
				// forma uni tahrirlashga ruxsat bermaydi.
				await adminProblemsApi.update(
					id,
					{
						subjectId: values.subjectId,
						difficulty: values.difficulty,
						timeLimitMs: values.timeLimitMs,
						memoryLimitKb: values.memoryLimitKb,
						sort: values.sort,
						source: values.source.trim() === "" ? null : values.source.trim(),
					},
					{ token },
				);

				// Faqat O'ZGARGAN va bo'sh bo'lmagan tillar yuboriladi.
				for (const statement of Object.values(byLang)) {
					if (statementIsEmpty(statement)) continue;
					if (!statementChanged(statement, original[statement.lang])) continue;

					await adminProblemsApi.upsertStatement(
						id,
						{
							lang: statement.lang,
							title: statement.title.trim(),
							legend: statement.legend,
							inputFormat: nullIfEmpty(statement.inputFormat),
							outputFormat: nullIfEmpty(statement.outputFormat),
							notes: nullIfEmpty(statement.notes),
						},
						{ token },
					);
				}
			});

			// Saqlangandan keyin "asl holat" yangilanadi — aks holda
			// keyingi saqlashda o'zgarmagan tillar ham qayta yuborilardi.
			setOriginal({ ...byLang });
			setSaved(true);
		} catch (cause) {
			setSaveError(saveErrorMessage(cause));
		} finally {
			setSaving(false);
		}
	}

	if (load.phase === "loading") {
		return (
			<Container className="py-8">
				<div className="h-40 animate-pulse rounded-card bg-surface-muted" />
			</Container>
		);
	}

	if (load.phase === "error" || !values) {
		return (
			<Container className="py-8">
				<Panel className="p-6">
					<p className="text-fg-secondary">
						{load.phase === "error" ? load.message : "Masala yuklanmadi."}
					</p>
					<div className="mt-4 flex gap-3">
						{id !== null && (
							<Button variant="outline" onClick={() => void fetchAll(id)}>
								Qayta urinish
							</Button>
						)}
						<Link
							href="/"
							className="inline-flex items-center rounded-control border border-border-strong px-3.5 py-2 text-sm font-semibold transition-colors hover:border-border-hover"
						>
							Ro'yxatga qaytish
						</Link>
					</div>
				</Panel>
			</Container>
		);
	}

	return (
		<Container className="py-8">
			<div className="flex flex-wrap items-center gap-3">
				<h1 className="text-[22px] font-bold">Masalani tahrirlash</h1>
				<span className="font-mono text-[12.5px] text-fg-subtle">#{id}</span>

				<div className="ml-auto flex items-center gap-2">
					<span className="text-sm font-semibold text-fg-muted">Shart tili:</span>
					{STATEMENT_LANGS.map((lang) => {
						const active = values.statement.lang === lang.code;
						// Ikki marta indekslamaymiz: `noUncheckedIndexedAccess`
						// bilan ikkinchi murojaat torlashtirilmaydi va `undefined`
						// bo'lib qolaveradi.
						const stored = byLang[lang.code];
						const exists = stored !== undefined && !statementIsEmpty(stored);
						return (
							<button
								key={lang.code}
								type="button"
								onClick={() => switchLang(lang.code)}
								aria-pressed={active}
								className={`cursor-pointer rounded-pill px-3 py-1.5 text-[13px] font-semibold transition-colors ${
									active
										? "bg-fg text-fg-inverted"
										: "border border-border-default text-fg-secondary hover:border-border-hover"
								}`}
							>
								{lang.label}
								{/* Tarjimasi borligini ko'rsatuvchi nuqta — setter
								    qaysi tillar to'ldirilganini bir qarashda ko'radi. */}
								{exists && !active && <span className="ml-1.5 text-success">•</span>}
							</button>
						);
					})}
				</div>
			</div>

			<div className="mt-5">
				<ProblemForm
					values={values}
					onChange={onFormChange}
					errors={errors}
					saving={saving}
					saveError={saveError}
					submitLabel="Saqlash"
					onSubmit={() => void save()}
					// Slug — doimiy manzil, tahrirlanmaydi. Til esa yuqoridagi
					// tugmalar orqali almashadi, muharrir ichidan emas.
					slugEditable={false}
					langEditable={false}
					extraActions={
						<>
							<Link
								href={{ pathname: "/masalalar/testlar", query: { id } }}
								className="inline-flex items-center rounded-control border border-border-strong px-3.5 py-2 text-sm font-semibold transition-colors hover:border-border-hover"
							>
								Testlar va nashr
							</Link>
							<Link
								href="/"
								className="inline-flex items-center rounded-control border border-border-strong px-3.5 py-2 text-sm font-semibold transition-colors hover:border-border-hover"
							>
								Ro'yxat
							</Link>
							{saved && <span className="text-sm font-semibold text-success">Saqlandi</span>}
						</>
					}
				/>
			</div>
		</Container>
	);
}

function nullIfEmpty(value: string): string | null {
	return value.trim() === "" ? null : value.trim();
}
