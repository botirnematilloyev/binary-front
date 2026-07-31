"use client";

import { useEffect, useState } from "react";
import { taxonomyApi, type SubjectDto, type TopicDto } from "@binary/api";
import { Panel } from "@binary/ui";
import {
	DIFFICULTIES,
	suggestSlug,
	type FieldErrors,
	type ProblemSettingsValues,
} from "../model";

/**
 * Masalaning sozlamalari: slug, fan, qiyinlik, limitlar.
 *
 * Shart muharriridan AJRATILGAN. Sababi ishlash tartibida: bu qiymatlar
 * bir marta qo'yiladi va keyin deyarli tegilmaydi, shart esa uzoq
 * tahrirlanadi. Ularni bir ekranda ushlab turish shart yozayotgan
 * odamdan ekranning uchdan birini o'g'irlaydi.
 */
export function ProblemSettings({
	values,
	onChange,
	errors,
	slugEditable = true,
	titleForSlug,
}: {
	values: ProblemSettingsValues;
	onChange: (next: ProblemSettingsValues) => void;
	errors: FieldErrors;
	slugEditable?: boolean;
	/** Slug taklifini yasash uchun — yaratish rejimida sarlavhadan olinadi. */
	titleForSlug?: string;
}) {
	const [subjects, setSubjects] = useState<SubjectDto[]>([]);
	const [topics, setTopics] = useState<TopicDto[]>([]);

	useEffect(() => {
		taxonomyApi
			.listSubjects()
			.then((result) => setSubjects(result.subjects))
			.catch(() => {
				/* tanlanmasa validatsiya ushlaydi */
			});
	}, []);

	/*
	 * Mavzular TANLANGAN FANGA bog'liq, shuning uchun fan o'zgarganda
	 * qayta o'qiladi. `no-store`: bu ro'yxat `/mavzular` sahifasida
	 * hozirgina tahrirlangan bo'lishi mumkin, ochiq endpoint esa bir
	 * soatlik `Cache-Control` yuboradi.
	 */
	useEffect(() => {
		let cancelled = false;

		taxonomyApi
			.listTopics(values.subjectId, { cache: "no-store" })
			.then((result) => {
				if (!cancelled) setTopics(result.topics);
			})
			.catch(() => {
				if (!cancelled) setTopics([]);
			});

		// Fan tez-tez almashtirilsa, kechikkan javob yangisini bosib
		// ketmasligi kerak — javoblar tartibi so'rovlar tartibiga mos
		// kelishi kafolatlanmagan.
		return () => {
			cancelled = true;
		};
	}, [values.subjectId]);

	function set<K extends keyof ProblemSettingsValues>(key: K, next: ProblemSettingsValues[K]) {
		onChange({ ...values, [key]: next });
	}

	const suggestion = titleForSlug ? suggestSlug(titleForSlug) : "";

	return (
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
						disabled={!slugEditable}
						placeholder="ikki-son-ayirmasi"
						className={`${inputClass} disabled:bg-surface-muted disabled:text-fg-muted`}
					/>
					{/*
					 * Slug sarlavhadan AVTOMATIK yasalmaydi, faqat taklif.
					 * Slug — doimiy manzil, sarlavha esa tahrirlanadi; bog'lansa
					 * sarlavha tuzatilganda eski havolalar buzilardi.
					 */}
					{slugEditable && suggestion !== "" && values.slug === "" && (
						<button
							type="button"
							onClick={() => set("slug", suggestion)}
							className="mt-1.5 cursor-pointer text-sm font-semibold text-accent hover:text-accent-hover"
						>
							Sarlavhadan yasash: {suggestion}
						</button>
					)}
					{!slugEditable && (
						<p className="mt-1.5 text-sm text-fg-muted">
							O'zgartirilmaydi — masalaning doimiy manzili.
						</p>
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
						onChange={(e) =>
							// Fan almashganda mavzular TOZALANADI: ular oldingi
							// fanga tegishli va yangi fanning ro'yxatida umuman
							// ko'rinmaydi — ya'ni foydalanuvchi ularni olib
							// tashlay olmaydigan, lekin bazada turgan teg
							// bo'lib qolardi.
							onChange({
								...values,
								subjectId: Number(e.target.value),
								topicIds: [],
							})
						}
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
						onChange={(e) => set("difficulty", e.target.value as ProblemSettingsValues["difficulty"])}
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

			{/*
			 * Mavzular — ko'p tanlovli, shuning uchun `<select multiple>`
			 * emas, checkbox'lar: ko'p tanlovli select'da Ctrl bosib
			 * turish kerakligini foydalanuvchi bilmaydi va tasodifan
			 * oldingi tanlovni yo'qotadi.
			 */}
			<div className="mt-4">
				<p className="text-sm font-semibold">
					Mavzular{" "}
					<span className="font-normal text-fg-muted">— katalogdagi filtr shularga tayanadi</span>
				</p>

				{topics.length === 0 ? (
					<p className="mt-1.5 text-sm text-fg-muted">
						Bu fanda mavzu yo'q. Avval «Mavzular» bo'limida qo'shing.
					</p>
				) : (
					<div className="mt-2 flex flex-wrap gap-2">
						{topics.map((topic) => {
							const checked = values.topicIds.includes(topic.id);
							return (
								<label
									key={topic.id}
									className={`flex cursor-pointer items-center gap-2 rounded-pill border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
										checked
											? "border-fg bg-fg text-fg-inverted"
											: "border-border-default text-fg-secondary hover:border-border-hover"
									}`}
								>
									{/*
									 * Haqiqiy `<input type="checkbox">`, faqat
									 * ko'zdan yashirilgan: klaviatura, `Tab` va
									 * skrin rider shu tufayli ishlaydi. `<div>`
									 * ni `onClick` bilan bosiladigan qilish
									 * ularning hech birini bermaydi.
									 */}
									<input
										type="checkbox"
										className="sr-only"
										checked={checked}
										onChange={() =>
											set(
												"topicIds",
												// Har doim tartiblangan holda saqlanadi:
												// "o'zgardimi" tekshiruvi `JSON.stringify`
												// bilan ishlaydi, ya'ni tartib farq qilsa
												// ham "o'zgargan" deb ko'rsatardi —
												// belgini olib, qayta qo'ygandan keyin
												// "Saqlash" tugmasi yonib qolardi.
												(checked
													? values.topicIds.filter((id) => id !== topic.id)
													: [...values.topicIds, topic.id]
												).sort((a, b) => a - b),
											)
										}
									/>
									<span aria-hidden>{checked ? "✓" : "+"}</span>
									{pickTopicName(topic)}
								</label>
							);
						})}
					</div>
				)}
			</div>

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
	);
}

/** Admin paneli o'zbekcha, shuning uchun `uz` → birinchi mavjud. */
function pickTopicName(topic: TopicDto): string {
	return topic.name["uz"] ?? Object.values(topic.name)[0] ?? topic.slug;
}

const inputClass =
	"mt-1.5 w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-sm focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";
