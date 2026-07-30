"use client";

import { useEffect, useState, type FormEvent } from "react";
import { taxonomyApi, type SubjectDto } from "@binary/api";
import { Button, Panel } from "@binary/ui";
import {
	DIFFICULTIES,
	emptyForm,
	suggestSlug,
	validate,
	type FieldErrors,
	type ProblemFormValues,
} from "../model";
import { StatementEditor } from "./statement-editor";

/**
 * Masala formasi.
 *
 * `initialValues` va `onSave` tashqaridan keladi, ya'ni bir xil forma
 * yaratish uchun ham, tahrirlash uchun ham xizmat qiladi. Tahrirlash
 * hozircha ULANMAGAN — backendda qoralamaning shartini O'QIB olish
 * endpointi yo'q (`GET /admin/problems/{id}/statements` mavjud emas, va
 * ochiq endpoint qoralama uchun 404 qaytaradi). Forma tayyor turibdi.
 */
export function ProblemForm({
	initialValues,
	submitLabel,
	onSave,
}: {
	initialValues?: ProblemFormValues;
	submitLabel: string;
	onSave: (values: ProblemFormValues) => Promise<void>;
}) {
	const [values, setValues] = useState<ProblemFormValues>(initialValues ?? emptyForm());
	const [errors, setErrors] = useState<FieldErrors>({});
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const [subjects, setSubjects] = useState<SubjectDto[]>([]);

	useEffect(() => {
		// Fanlar ro'yxati OCHIQ endpoint — token kerak emas.
		taxonomyApi
			.listSubjects()
			.then((result) => {
				setSubjects(result.subjects);
				// Birinchi fanni sukut bo'yicha tanlaymiz, lekin faqat
				// foydalanuvchi hali tanlamagan bo'lsa: aks holda tahrirlash
				// rejimida saqlangan qiymat bosib ketilardi.
				setValues((current) =>
					current.subjectId === 0 && result.subjects[0]
						? { ...current, subjectId: result.subjects[0].id }
						: current,
				);
			})
			.catch(() => {
				/* fan tanlanmasa validatsiya ushlaydi */
			});
	}, []);

	function set<K extends keyof ProblemFormValues>(key: K, next: ProblemFormValues[K]) {
		setValues((current) => ({ ...current, [key]: next }));
	}

	async function onSubmit(event: FormEvent) {
		event.preventDefault();

		const found = validate(values);
		setErrors(found);
		if (Object.keys(found).length > 0) {
			setSaveError(null);
			return;
		}

		setSaving(true);
		setSaveError(null);
		try {
			await onSave(values);
		} catch (cause) {
			// Xato matnini `onSave` emas, chaqiruvchi beradi — u qaysi
			// amal bajarilganini biladi (yaratish yoki tahrirlash).
			setSaveError(cause instanceof Error ? cause.message : "Xatolik");
			setSaving(false);
		}
	}

	return (
		<form onSubmit={onSubmit}>
			<Panel className="p-5">
				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<label htmlFor="slug" className="block text-sm font-semibold">
							Slug <span className="font-normal text-fg-muted">— doimiy URL</span>
						</label>
						<input
							id="slug"
							value={values.slug}
							onChange={(e) => set("slug", e.target.value)}
							placeholder="ikki-son-yigindisi"
							className={inputClass}
						/>
						{/*
						 * Slug sarlavhadan AVTOMATIK yasalmaydi, faqat taklif
						 * qilinadi. Sabab: slug — doimiy manzil, sarlavha esa
						 * tahrirlanadi. Avtomatik bog'lansa, sarlavha
						 * tuzatilganda eski havolalar buzilardi.
						 */}
						{values.statement.title.trim() !== "" && values.slug === "" && (
							<button
								type="button"
								onClick={() => set("slug", suggestSlug(values.statement.title))}
								className="mt-1.5 cursor-pointer text-sm font-semibold text-accent hover:text-accent-hover"
							>
								Sarlavhadan yasash: {suggestSlug(values.statement.title)}
							</button>
						)}
						{errors.slug && (
							<p role="alert" className="mt-1.5 text-sm text-danger">
								{errors.slug}
							</p>
						)}
					</div>

					<div>
						<label htmlFor="subject" className="block text-sm font-semibold">
							Fan
						</label>
						<select
							id="subject"
							value={values.subjectId}
							onChange={(e) => set("subjectId", Number(e.target.value))}
							className={inputClass}
						>
							<option value={0}>— tanlang —</option>
							{subjects.map((subject) => (
								<option key={subject.id} value={subject.id}>
									{subject.name["uz"] ?? subject.slug}
								</option>
							))}
						</select>
						{errors.subjectId && (
							<p role="alert" className="mt-1.5 text-sm text-danger">
								{errors.subjectId}
							</p>
						)}
					</div>
				</div>

				<div className="mt-4 grid gap-4 sm:grid-cols-4">
					<div>
						<label htmlFor="difficulty" className="block text-sm font-semibold">
							Qiyinlik
						</label>
						<select
							id="difficulty"
							value={values.difficulty}
							onChange={(e) => set("difficulty", e.target.value as ProblemFormValues["difficulty"])}
							className={inputClass}
						>
							{DIFFICULTIES.map((item) => (
								<option key={item.value} value={item.value}>
									{item.label}
								</option>
							))}
						</select>
					</div>

					<div>
						<label htmlFor="time" className="block text-sm font-semibold">
							Vaqt (ms)
						</label>
						<input
							id="time"
							type="number"
							min={1}
							value={values.timeLimitMs}
							onChange={(e) => set("timeLimitMs", Number(e.target.value))}
							className={inputClass}
						/>
					</div>

					<div>
						<label htmlFor="memory" className="block text-sm font-semibold">
							Xotira (KB)
						</label>
						<input
							id="memory"
							type="number"
							min={1}
							value={values.memoryLimitKb}
							onChange={(e) => set("memoryLimitKb", Number(e.target.value))}
							className={inputClass}
						/>
					</div>

					<div>
						<label htmlFor="sort" className="block text-sm font-semibold">
							Tartib
						</label>
						<input
							id="sort"
							type="number"
							value={values.sort}
							onChange={(e) => set("sort", Number(e.target.value))}
							className={inputClass}
						/>
					</div>
				</div>

				{errors.limits && (
					<p role="alert" className="mt-2 text-sm text-danger">
						{errors.limits}
					</p>
				)}

				<div className="mt-4">
					<label htmlFor="source" className="block text-sm font-semibold">
						Manba (ixtiyoriy)
					</label>
					<input
						id="source"
						value={values.source}
						onChange={(e) => set("source", e.target.value)}
						placeholder="Codeforces 4A"
						className={inputClass}
					/>
				</div>
			</Panel>

			<StatementEditor
				value={values.statement}
				onChange={(next) => set("statement", next)}
				titleError={errors.title}
				legendError={errors.legend}
			/>

			{saveError && (
				<p role="alert" className="mt-5 text-sm text-danger">
					{saveError}
				</p>
			)}

			<div className="mt-5 flex items-center gap-3">
				<Button type="submit" disabled={saving}>
					{saving ? "Saqlanyapti…" : submitLabel}
				</Button>
				<p className="text-sm text-fg-muted">
					Masala <strong>qoralama</strong> holatida yaratiladi — nashr qilish alohida amal.
				</p>
			</div>
		</form>
	);
}

const inputClass =
	"mt-1.5 w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-sm focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";
