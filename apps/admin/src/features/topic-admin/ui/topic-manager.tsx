"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	adminTopicsApi,
	taxonomyApi,
	type SubjectDto,
	type TopicDto,
} from "@binary/api";
import { withFreshToken } from "@binary/session";
import { Button, Panel } from "@binary/ui";
import { IconButton, PencilIcon, TrashIcon } from "@/shared/ui/icon-button";
import {
	cleanName,
	describeError,
	displayName,
	emptyDraft,
	NAME_LANGS,
	validateDraft,
	type TopicDraft,
} from "../model";

type Data = { subjects: SubjectDto[]; topics: TopicDto[] };

type State =
	| { phase: "loading" }
	| { phase: "ready"; data: Data }
	| { phase: "error" };

/** `null` — yaratish rejimi; son — o'sha id'li mavzuni tahrirlash. */
type EditingID = number | null;

export function TopicManager() {
	const [state, setState] = useState<State>({ phase: "loading" });
	const [editing, setEditing] = useState<EditingID>(null);
	const [draft, setDraft] = useState<TopicDraft | null>(null);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const formRef = useRef<HTMLDivElement>(null);

	const load = useCallback(async () => {
		setState({ phase: "loading" });
		try {
			// Ikkalasi ham ochiq endpoint, token kerak emas. `no-store`
			// SHART: `/topics` va `/subjects` bir soatlik `Cache-Control`
			// yuboradi, ya'ni yangi mavzu qo'shilgandan keyin brauzer eski
			// ro'yxatni qaytarardi va panel "saqlanmadi" bo'lib ko'rinardi.
			const [subjects, topics] = await Promise.all([
				taxonomyApi.listSubjects({ cache: "no-store" }),
				taxonomyApi.listTopics(undefined, { cache: "no-store" }),
			]);
			setState({ phase: "ready", data: { subjects: subjects.subjects, topics: topics.topics } });
		} catch {
			setState({ phase: "error" });
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const startCreate = (subjects: SubjectDto[]) => {
		setEditing(null);
		setMessage(null);
		setDraft(emptyDraft(subjects[0]?.id ?? 0));
		formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
	};

	const startEdit = (topic: TopicDto) => {
		setEditing(topic.id);
		setMessage(null);
		setDraft({
			subjectId: topic.subject_id,
			slug: topic.slug,
			name: { ...topic.name },
			requires: [],
		});
		formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });

		/*
		 * Bog'lanishlar ALOHIDA so'rov bilan keladi va forma ular
		 * kelguncha kutmaydi: nom bilan slugni tahrirlash uchun ular
		 * kerak emas.
		 *
		 * Javob kelganda draft to'liq almashtirilmaydi, faqat
		 * `requires` qo'shiladi — aks holda o'sha lahzada yozilgan
		 * harflar yo'qolardi.
		 */
		void withFreshToken((token) => adminTopicsApi.listPrerequisites(topic.id, { token }))
			.then((result) => {
				setDraft((current) =>
					current === null ? current : { ...current, requires: result.requires },
				);
			})
			.catch(() => {
				setMessage("Oldingi mavzularni yuklab bo'lmadi — ularni tahrirlamang, aks holda ro'yxat bo'shab qoladi.");
			});
	};

	const cancel = () => {
		setEditing(null);
		setDraft(null);
		setMessage(null);
	};

	const save = async () => {
		if (!draft) return;

		const problem = validateDraft(draft);
		if (problem) {
			setMessage(problem);
			return;
		}

		setSaving(true);
		setMessage(null);
		try {
			const name = cleanName(draft.name);
			const saved = await withFreshToken((token) =>
				editing === null
					? adminTopicsApi.create(
							{ subjectId: draft.subjectId, slug: draft.slug, name },
							{ token },
						)
					: adminTopicsApi.update(
							editing,
							{ subjectId: draft.subjectId, slug: draft.slug, name },
							{ token },
						),
			);

			/*
			 * Bog'lanishlar mavzu SAQLANGANDAN KEYIN yoziladi: yangi
			 * mavzuning id'si yaratilgunga qadar ma'lum emas.
			 *
			 * Ikki so'rov — ikki xil natija bo'lishi mumkin: mavzu
			 * saqlanib, bog'lanishlar rad etilishi (halqa). Shuning
			 * uchun xato xabari "saqlanmadi" emas, "mavzu saqlandi,
			 * bog'lanishlar esa yo'q" deyishi kerak — aks holda setter
			 * hammasini qaytadan kiritishga urinardi.
			 */
			try {
				await withFreshToken((token) =>
					adminTopicsApi.setPrerequisites(saved.id, draft.requires, { token }),
				);
			} catch (error) {
				await load();
				setMessage(`Mavzu saqlandi, lekin oldingi mavzular yozilmadi. ${describeError(error, "save")}`);
				setSaving(false);
				return;
			}
			setDraft(null);
			setEditing(null);
			await load();
		} catch (error) {
			setMessage(describeError(error, "save"));
		} finally {
			setSaving(false);
		}
	};

	const remove = async (topic: TopicDto) => {
		// Tasdiqlash SHART: o'chirish qaytarilmaydi va backend faqat
		// masalaga biriktirilgan mavzuni himoya qiladi — biriktirilmagan
		// mavzu bir bosishda yo'qoladi.
		if (!window.confirm(`"${displayName(topic.name)}" mavzusi o'chirilsinmi?`)) return;

		setMessage(null);
		try {
			await withFreshToken((token) => adminTopicsApi.remove(topic.id, { token }));
			if (editing === topic.id) cancel();
			await load();
		} catch (error) {
			setMessage(describeError(error, "delete"));
		}
	};

	if (state.phase === "loading") {
		return <Panel className="h-64 animate-pulse bg-surface-subtle" />;
	}

	if (state.phase === "error") {
		return (
			<Panel className="px-5 py-6">
				<p className="text-fg-secondary">Ro'yxatni yuklab bo'lmadi.</p>
				<Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}>
					Qayta urinish
				</Button>
			</Panel>
		);
	}

	const { subjects, topics } = state.data;
	const subjectName = (id: number) => {
		const subject = subjects.find((item) => item.id === id);
		return subject ? displayName(subject.name) : `#${id}`;
	};

	return (
		<section>
			<div className="flex flex-wrap items-center gap-3">
				<h1 className="text-[22px] font-bold">Mavzular</h1>
				<p className="text-sm text-fg-muted">
					Katalogdagi yon paneldagi filtr shu ro'yxatdan quriladi.
				</p>

				{draft === null && (
					<button
						type="button"
						onClick={() => startCreate(subjects)}
						className="ml-auto cursor-pointer rounded-control bg-fg px-3.5 py-1.5 text-[13px] font-semibold text-fg-inverted transition-colors hover:bg-accent"
					>
						Yangi mavzu
					</button>
				)}
			</div>

			<div ref={formRef}>
				{draft !== null && (
					<Panel className="mt-5 p-5">
						<h2 className="text-[15px] font-bold">
							{editing === null ? "Yangi mavzu" : "Mavzuni tahrirlash"}
						</h2>

						<div className="mt-4 grid gap-4 sm:grid-cols-2">
							<div>
								<label htmlFor="subject" className="block text-sm font-semibold">
									Fan
								</label>
								<select
									id="subject"
									value={draft.subjectId}
									onChange={(event) =>
										setDraft({ ...draft, subjectId: Number(event.target.value) })
									}
									className={inputClass}
								>
									{subjects.map((subject) => (
										<option key={subject.id} value={subject.id}>
											{displayName(subject.name)}
										</option>
									))}
								</select>
							</div>

							<div>
								<label htmlFor="slug" className="block text-sm font-semibold">
									Slug{" "}
									<span className="font-normal text-fg-muted">— masalan, graflar</span>
								</label>
								<input
									id="slug"
									value={draft.slug}
									onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
									className={inputClass}
									autoComplete="off"
									spellCheck={false}
								/>
							</div>
						</div>

						<div className="mt-4 grid gap-4 sm:grid-cols-2">
							{NAME_LANGS.map((lang) => (
								<div key={lang.code}>
									<label htmlFor={`name-${lang.code}`} className="block text-sm font-semibold">
										{lang.label}
										{lang.required ? (
											<span className="ml-1 text-danger">*</span>
										) : (
											<span className="ml-1 font-normal text-fg-muted">— ixtiyoriy</span>
										)}
									</label>
									<input
										id={`name-${lang.code}`}
										value={draft.name[lang.code] ?? ""}
										onChange={(event) =>
											setDraft({
												...draft,
												name: { ...draft.name, [lang.code]: event.target.value },
											})
										}
										className={inputClass}
										autoComplete="off"
									/>
								</div>
							))}
						</div>

						<fieldset className="mt-5">
							<legend className="text-sm font-semibold">
								Oldingi mavzular{" "}
								<span className="font-normal text-fg-muted">
									— yo'l xaritasida shu mavzuga qaysilaridan keyin kelinadi
								</span>
							</legend>

							{/*
							 * Faqat SHU fandagi mavzular ko'rsatiladi: yo'l
							 * xaritasi fan ichida quriladi va boshqa fandagi
							 * bog'lanish chizmada umuman chizilmaydi (server
							 * ham uni hisobga olmaydi).
							 */}
							<div className="mt-2 grid max-h-56 gap-1.5 overflow-y-auto rounded-control border border-border-default p-3 sm:grid-cols-2">
								{topics
									.filter(
										(item) => item.subject_id === draft.subjectId && item.id !== editing,
									)
									.map((item) => (
										<label key={item.id} className="flex items-center gap-2 text-sm">
											<input
												type="checkbox"
												checked={draft.requires.includes(item.id)}
												onChange={(event) =>
													setDraft({
														...draft,
														requires: event.target.checked
															? [...draft.requires, item.id]
															: draft.requires.filter((id) => id !== item.id),
													})
												}
											/>
											{displayName(item.name)}
										</label>
									))}
							</div>
						</fieldset>

						{message !== null && (
							<p role="alert" className="mt-4 text-sm text-danger">
								{message}
							</p>
						)}

						<div className="mt-5 flex gap-2">
							<Button size="sm" onClick={() => void save()} disabled={saving}>
								{saving ? "Saqlanyapti…" : "Saqlash"}
							</Button>
							<Button variant="outline" size="sm" onClick={cancel} disabled={saving}>
								Bekor qilish
							</Button>
						</div>
					</Panel>
				)}
			</div>

			{/* Forma yopiq bo'lganda xato ko'rinmay qolmasligi uchun. */}
			{draft === null && message !== null && (
				<p role="alert" className="mt-4 text-sm text-danger">
					{message}
				</p>
			)}

			{topics.length === 0 ? (
				<Panel className="mt-5 px-5 py-10 text-center">
					<p className="font-semibold">Mavzu yo'q</p>
					<p className="mt-1 text-sm text-fg-muted">
						Birinchi mavzuni qo'shsangiz, katalogdagi MAVZULAR bo'limi paydo bo'ladi.
					</p>
				</Panel>
			) : (
				<Panel className="mt-5">
					<div className="overflow-x-auto">
						<table className="w-full min-w-[720px] border-collapse text-sm">
							<thead>
								<tr className="border-b border-border-default bg-surface-subtle text-left">
									<Th className="w-12">ID</Th>
									<Th>NOMI</Th>
									<Th className="w-40">FAN</Th>
									<Th className="w-40">SLUG</Th>
									<Th className="w-24"> </Th>
								</tr>
							</thead>
							<tbody>
								{topics.map((topic) => (
									<tr
										key={topic.id}
										className="border-b border-border-default last:border-0 hover:bg-surface-subtle"
									>
										<td className="px-4 py-2.5 font-mono text-[12.5px] text-fg-subtle">
											{topic.id}
										</td>
										<td className="px-4 py-2.5 font-semibold">{displayName(topic.name)}</td>
										<td className="px-4 py-2.5 text-fg-secondary">
											{subjectName(topic.subject_id)}
										</td>
										<td className="px-4 py-2.5 font-mono text-[12px] text-fg-muted">
											{topic.slug}
										</td>
										<td className="px-4 py-2.5">
											<div className="flex justify-end gap-1">
												<IconButton
													label="Tahrirlash"
													tone="accent"
													icon={<PencilIcon />}
													onClick={() => startEdit(topic)}
												/>
												<IconButton
													label="O'chirish"
													tone="danger"
													icon={<TrashIcon />}
													onClick={() => void remove(topic)}
												/>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Panel>
			)}
		</section>
	);
}

function Th({ children, className }: { children: string; className?: string }) {
	return (
		<th
			className={`px-4 py-2.5 text-[11px] font-bold tracking-wide text-fg-subtle ${className ?? ""}`}
		>
			{children}
		</th>
	);
}

const inputClass =
	"mt-1.5 w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-sm focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";
