"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
	ApiError,
	adminProblemsApi,
	type ProblemStatus,
	type TestCaseDto,
} from "@binary/api";
import { withFreshToken } from "@binary/session";
import { Badge, Button, Container, Panel } from "@binary/ui";
import {
	blankStatement,
	ProblemSettings,
	saveErrorMessage,
	STATEMENT_LANGS,
	statementChanged,
	statementIsEmpty,
	StatementEditor,
	TestCasesEditor,
	validateSettings,
	validateStatementValues,
	type FieldErrors,
	type ProblemSettingsValues,
	type StatementValues,
} from "@/features/problem-admin";
import { AdminHeader } from "@/widgets/admin-header";

export default function ProblemWorkspacePage() {
	return (
		<>
			<AdminHeader />
			{/*
			 * `useSearchParams` statik eksportda Suspense chegarasini talab
			 * qiladi: sahifa build paytida query'ni bilmaydi.
			 */}
			<Suspense fallback={<Skeleton />}>
				<Workspace />
			</Suspense>
		</>
	);
}

type Tab = "statement" | "tests" | "settings";
type Load = { phase: "loading" } | { phase: "ready" } | { phase: "error"; message: string };

const STATUS_LABEL: Record<
	ProblemStatus,
	{ label: string; tone: "neutral" | "success" | "warning" }
> = {
	draft: { label: "Qoralama", tone: "neutral" },
	published: { label: "Nashrda", tone: "success" },
	archived: { label: "Arxiv", tone: "warning" },
};

/**
 * Bitta masala — bitta sahifa.
 *
 * Oldin shart, testlar va nashr uch xil marshrutda edi va setter ular
 * orasida sakrab yurardi: yaratasan → ro'yxatga tashlanasan → topasan →
 * shartni ochasan → testlarga o'tasan. Har o'tishda holat yo'qolardi va
 * saqlash tugmasi ikkita edi.
 *
 * Endi holat SHU komponentda, tab'lar esa faqat ko'rinishni almashtiradi.
 * Buning natijasi: tab almashganda tahrirlar yo'qolmaydi (holat
 * yuqorida), va bitta "Saqlash" hamma o'zgarishni yuboradi.
 */
function Workspace() {
	const params = useSearchParams();
	const rawId = params.get("id");
	const id = rawId !== null && /^\d+$/.test(rawId) ? Number(rawId) : null;

	const [load, setLoad] = useState<Load>({ phase: "loading" });
	const [tab, setTab] = useState<Tab>("statement");

	const [settings, setSettings] = useState<ProblemSettingsValues | null>(null);
	const [originalSettings, setOriginalSettings] = useState<ProblemSettingsValues | null>(null);

	const [byLang, setByLang] = useState<Record<string, StatementValues>>({});
	const [originalByLang, setOriginalByLang] = useState<Record<string, StatementValues>>({});
	const [lang, setLang] = useState("uz");

	const [tests, setTests] = useState<TestCaseDto[]>([]);
	const [originalTests, setOriginalTests] = useState<TestCaseDto[]>([]);

	const [status, setStatus] = useState<ProblemStatus>("draft");
	const [errors, setErrors] = useState<FieldErrors>({});
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const fetchAll = useCallback(async (problemId: number) => {
		setLoad({ phase: "loading" });
		try {
			// To'rtala so'rov ham parallel — mavzular alohida endpointda
			// (`problem_topics` alohida jadval), lekin bu kechikish
			// qo'shmaydi.
			const [problem, statements, testCases, topics] = await withFreshToken(async (token) =>
				Promise.all([
					adminProblemsApi.get(problemId, { token }),
					adminProblemsApi.listStatements(problemId, { token }),
					adminProblemsApi.listTestCases(problemId, { token }),
					adminProblemsApi.listProblemTopics(problemId, { token }),
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

			const next: ProblemSettingsValues = {
				slug: problem.slug,
				subjectId: problem.subject_id,
				difficulty: problem.difficulty,
				timeLimitMs: problem.time_limit_ms,
				memoryLimitKb: problem.memory_limit_kb,
				sort: problem.sort,
				source: problem.source ?? "",
				// Tartiblangan: `dirty` ni `JSON.stringify` bilan
				// solishtiramiz, ya'ni faqat TARTIB farq qilsa ham
				// "o'zgargan" deb hisoblanardi.
				topicIds: topics.topics.map((topic) => topic.id).sort((a, b) => a - b),
			};

			setSettings(next);
			setOriginalSettings(next);
			setByLang(map);
			setOriginalByLang(map);
			setLang(map["uz"] ? "uz" : (Object.keys(map)[0] ?? "uz"));
			setTests(testCases.test_cases);
			setOriginalTests(testCases.test_cases);
			setStatus(problem.status);
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

	const statement = byLang[lang] ?? blankStatement(lang);

	/** Qaysi tillar to'ldirilgan — til tugmalari shu bo'yicha ko'rsatiladi. */
	// `string[]` deb belgilanadi: `STATEMENT_LANGS` `as const` bo'lgani
	// uchun `map` tor union qaytaradi va `includes(lang)` ni rad etadi.
	const filledLangs = useMemo<string[]>(
		() =>
			STATEMENT_LANGS.filter((item) => {
				const value = byLang[item.code];
				return value !== undefined && !statementIsEmpty(value);
			}).map((item) => item.code),
		[byLang],
	);

	const shownLangs = filledLangs.includes(lang) ? filledLangs : [...filledLangs, lang];
	const missingLangs = STATEMENT_LANGS.filter((item) => !shownLangs.includes(item.code));

	const hasStatement = filledLangs.length > 0;
	const canPublish = hasStatement && tests.length > 0;

	const dirty =
		JSON.stringify(settings) !== JSON.stringify(originalSettings) ||
		JSON.stringify(tests) !== JSON.stringify(originalTests) ||
		Object.values(byLang).some(
			(value) => !statementIsEmpty(value) && statementChanged(value, originalByLang[value.lang]),
		);

	function updateStatement(next: StatementValues) {
		setByLang((current) => ({ ...current, [next.lang]: next }));
		setNotice(null);
	}

	async function save() {
		if (!settings || id === null) return;

		// Sozlamalar har doim tekshiriladi; shart esa faqat yozilgan
		// tillar uchun — bo'sh til shunchaki yuborilmaydi.
		const found: FieldErrors = { ...validateSettings(settings) };
		if (!statementIsEmpty(statement)) {
			Object.assign(found, validateStatementValues(statement));
		}
		setErrors(found);
		if (Object.keys(found).length > 0) {
			setError(null);
			// Xato qaysi tabda ekanini ko'rsatamiz — aks holda foydalanuvchi
			// "saqlanmadi" deb qoladi va sababini topa olmaydi.
			setTab(found.title || found.legend ? "statement" : "settings");
			return;
		}

		setBusy(true);
		setError(null);
		setNotice(null);
		try {
			await withFreshToken(async (token) => {
				// Mavzular ALOHIDA endpointda saqlanadi (`problem_topics`
				// backendda ham alohida jadval), shuning uchun ular qolgan
				// sozlamalardan ajratib solishtiriladi: faqat limit
				// o'zgarganda mavzularni qayta yozish — va aksincha —
				// keraksiz so'rov bo'lardi.
				if (!sameIds(settings.topicIds, originalSettings?.topicIds)) {
					await adminProblemsApi.setProblemTopics(id, settings.topicIds, { token });
				}

				if (settingsChangedApartFromTopics(settings, originalSettings)) {
					// `slug` yuborilmaydi — u doimiy manzil.
					await adminProblemsApi.update(
						id,
						{
							subjectId: settings.subjectId,
							difficulty: settings.difficulty,
							timeLimitMs: settings.timeLimitMs,
							memoryLimitKb: settings.memoryLimitKb,
							sort: settings.sort,
							source: settings.source.trim() === "" ? null : settings.source.trim(),
						},
						{ token },
					);
				}

				// Faqat O'ZGARGAN va bo'sh bo'lmagan tillar. Hammasini
				// yuborish `updated_at` ni bekorga yangilardi.
				for (const value of Object.values(byLang)) {
					if (statementIsEmpty(value)) continue;
					if (!statementChanged(value, originalByLang[value.lang])) continue;

					await adminProblemsApi.upsertStatement(
						id,
						{
							lang: value.lang,
							title: value.title.trim(),
							legend: value.legend,
							inputFormat: nullIfEmpty(value.inputFormat),
							outputFormat: nullIfEmpty(value.outputFormat),
							notes: nullIfEmpty(value.notes),
						},
						{ token },
					);
				}

				if (JSON.stringify(tests) !== JSON.stringify(originalTests)) {
					await adminProblemsApi.setTestCases(id, tests, { token });
				}
			});

			// "Asl holat" yangilanadi — aks holda keyingi saqlashda
			// o'zgarmagan narsalar qayta yuborilardi.
			setOriginalSettings(settings);
			setOriginalByLang({ ...byLang });
			setOriginalTests(tests);
			setNotice("Saqlandi");
		} catch (cause) {
			setError(saveErrorMessage(cause));
		} finally {
			setBusy(false);
		}
	}

	async function changeStatus(action: "publish" | "unpublish") {
		if (id === null) return;
		setBusy(true);
		setError(null);
		setNotice(null);
		try {
			const updated = await withFreshToken((token) =>
				action === "publish"
					? adminProblemsApi.publish(id, { token })
					: adminProblemsApi.unpublish(id, { token }),
			);
			setStatus(updated.status);
			setNotice(action === "publish" ? "Nashr qilindi" : "Arxivga olindi");
		} catch (cause) {
			setError(publishErrorMessage(cause));
		} finally {
			setBusy(false);
		}
	}

	if (load.phase === "loading") return <Skeleton />;

	if (load.phase === "error" || !settings) {
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
						<Link href="/" className={linkButtonClass}>
							Ro'yxatga qaytish
						</Link>
					</div>
				</Panel>
			</Container>
		);
	}

	const title = byLang[lang]?.title || byLang["uz"]?.title || settings.slug;

	return (
		<Container className="py-6">
			{/* ── Sarlavha: masala kimligi va holati ── */}
			<div className="flex flex-wrap items-center gap-3">
				<Link href="/" className="text-sm font-semibold text-fg-muted hover:text-fg">
					← Masalalar
				</Link>
				<h1 className="text-[20px] font-bold">{title}</h1>
				<span className="font-mono text-[12.5px] text-fg-subtle">{settings.slug}</span>
				<Badge tone={STATUS_LABEL[status].tone} size="sm">
					{STATUS_LABEL[status].label}
				</Badge>
			</div>

			{/* ── Tayyorlik va amallar ── */}
			<Panel className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
				{/*
				 * Nima yetishmayotgani NASHRDAN OLDIN ko'rinadi. Oldin buni
				 * bilishning yagona yo'li "Nashr qilish" ni bosib 422 olish
				 * edi.
				 */}
				<Check ok={hasStatement} label="Shart" />
				<Check ok={tests.length > 0} label={`Testlar (${tests.length})`} />

				<div className="ml-auto flex flex-wrap items-center gap-3">
					{notice && <span className="text-sm font-semibold text-success">{notice}</span>}
					{error && (
						<span role="alert" className="text-sm text-danger">
							{error}
						</span>
					)}

					<Button type="button" onClick={() => void save()} disabled={busy || !dirty}>
						{busy ? "Bajarilyapti…" : dirty ? "Saqlash" : "Saqlangan"}
					</Button>

					{status === "published" ? (
						<Button
							type="button"
							variant="outline"
							onClick={() => void changeStatus("unpublish")}
							disabled={busy}
						>
							Arxivga olish
						</Button>
					) : (
						<Button
							type="button"
							variant="accent"
							onClick={() => void changeStatus("publish")}
							// Mijoz tomonidagi cheklov — server baribir tekshiradi,
							// lekin ishlamasligi aniq tugmani bosdirish yomon UX.
							disabled={busy || !canPublish || dirty}
							title={
								dirty
									? "Avval o'zgarishlarni saqlang"
									: !canPublish
										? "Shart va kamida bitta test kerak"
										: undefined
							}
						>
							Nashr qilish
						</Button>
					)}
				</div>
			</Panel>

			{/* ── Tab'lar ── */}
			<div className="mt-5 flex gap-1 border-b border-border-default">
				<TabButton active={tab === "statement"} onClick={() => setTab("statement")}>
					Shart
				</TabButton>
				<TabButton active={tab === "tests"} onClick={() => setTab("tests")}>
					Testlar
				</TabButton>
				<TabButton active={tab === "settings"} onClick={() => setTab("settings")}>
					Sozlamalar
				</TabButton>
			</div>

			<div className="mt-5">
				{tab === "statement" && (
					<div>
						{/* Faqat to'ldirilgan tillar ko'rinadi — bo'sh uchta tugma
						    ekranni bekorga band qilmasin. */}
						<div className="flex flex-wrap items-center gap-2">
							{shownLangs.map((code) => {
								const item = STATEMENT_LANGS.find((l) => l.code === code);
								return (
									<button
										key={code}
										type="button"
										onClick={() => setLang(code)}
										aria-pressed={code === lang}
										className={`cursor-pointer rounded-pill px-3 py-1.5 text-[13px] font-semibold transition-colors ${
											code === lang
												? "bg-fg text-fg-inverted"
												: "border border-border-default text-fg-secondary hover:border-border-hover"
										}`}
									>
										{item?.label ?? code}
									</button>
								);
							})}

							{missingLangs.length > 0 && (
								<select
									value=""
									onChange={(e) => {
										if (e.target.value) setLang(e.target.value);
									}}
									aria-label="Til qo'shish"
									className="cursor-pointer rounded-pill border border-border-default bg-surface px-3 py-1.5 text-[13px] font-semibold text-fg-muted"
								>
									<option value="">+ Til qo'shish</option>
									{missingLangs.map((item) => (
										<option key={item.code} value={item.code}>
											{item.label}
										</option>
									))}
								</select>
							)}
						</div>

						<div className="mt-4">
							<StatementEditor
								value={statement}
								onChange={updateStatement}
								titleError={errors.title}
								legendError={errors.legend}
							/>
						</div>
					</div>
				)}

				{tab === "tests" && (
					<TestCasesEditor
						rows={tests}
						onChange={(next) => {
							setTests(next);
							setNotice(null);
						}}
						disabled={busy}
					/>
				)}

				{tab === "settings" && (
					<ProblemSettings
						values={settings}
						onChange={(next) => {
							setSettings(next);
							setNotice(null);
						}}
						errors={errors}
						slugEditable={false}
					/>
				)}
			</div>
		</Container>
	);
}

function Check({ ok, label }: { ok: boolean; label: string }) {
	return (
		<span className={`flex items-center gap-1.5 text-sm font-semibold ${ok ? "text-fg" : "text-fg-muted"}`}>
			<span aria-hidden className={ok ? "text-success" : "text-fg-subtle"}>
				{ok ? "✓" : "○"}
			</span>
			{label}
		</span>
	);
}

function TabButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={`-mb-px cursor-pointer border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
				active
					? "border-fg text-fg"
					: "border-transparent text-fg-muted hover:text-fg"
			}`}
		>
			{children}
		</button>
	);
}

function Skeleton() {
	return (
		<Container className="py-8">
			<div className="h-40 animate-pulse rounded-card bg-surface-muted" />
		</Container>
	);
}

/**
 * Mavzularsiz solishtirish.
 *
 * `topicIds` boshqa endpoint bilan ketadi, ya'ni uni umumiy
 * solishtiruvga qo'shsak, faqat teg o'zgarganda ham butun masala
 * `PATCH` qilinardi va `updated_at` bekorga yangilanardi.
 */
function settingsChangedApartFromTopics(
	next: ProblemSettingsValues,
	previous: ProblemSettingsValues | null,
): boolean {
	if (previous === null) return true;
	const strip = ({ topicIds: _ignored, ...rest }: ProblemSettingsValues) => rest;
	return JSON.stringify(strip(next)) !== JSON.stringify(strip(previous));
}

/** Tartibga bog'liq bo'lmagan tenglik: [1,2] va [2,1] bir xil. */
function sameIds(next: number[], previous: number[] | undefined): boolean {
	if (previous === undefined) return false;
	if (next.length !== previous.length) return false;
	const sorted = [...previous].sort((a, b) => a - b);
	return [...next].sort((a, b) => a - b).every((id, index) => id === sorted[index]);
}

const linkButtonClass =
	"inline-flex items-center rounded-control border border-border-strong px-3.5 py-2 text-sm font-semibold transition-colors hover:border-border-hover";

function nullIfEmpty(value: string): string | null {
	return value.trim() === "" ? null : value.trim();
}

/**
 * Backend nashrni ikki sababdan rad etadi va IKKALASI ham 422 (shart yo'q
 * yoki test yo'q). Endi bu deyarli chiqmaydi — tayyorlik ko'rsatkichi
 * tugmani oldindan o'chirib qo'yadi — lekin server yagona haqiqat va
 * poyga holati mumkin (boshqa setter shartni o'chirib yuborishi).
 */
function publishErrorMessage(cause: unknown): string {
	if (cause instanceof ApiError && cause.status === 422) {
		return "Nashr qilib bo'lmadi: shart yoki test yetishmayapti.";
	}
	return saveErrorMessage(cause);
}
