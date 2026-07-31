"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { submissionsApi, type LanguageDto } from "@binary/api";
import { Button, Panel } from "@binary/ui";
import { useSession, withFreshToken } from "@binary/session";
import { useSubmission } from "../use-submission";
import { CodeEditor } from "./code-editor";
import { CustomCases } from "./custom-cases";
import { SubmissionHistory } from "./submission-history";
import { TestProgress } from "./test-progress";
import { VerdictCard } from "./verdict-card";

/** Backenddagi `MaxCustomInputBytes` bilan bir xil — UMUMIY hajm. */
const MAX_CUSTOM_INPUT = 16 * 1024;

/*
 * Muharrir ostidagi uchta bo'lim.
 *
 * Ilgari ular uchta xil boshqaruv edi: "O'z kirishim bilan" belgisi,
 * verdikt kartasi (o'z-o'zidan paydo bo'ladigan) va "Yuborishlaringiz"
 * ochiluvchi bloki. Uchtasi uch xil ishlar, ekranda esa bir-birining
 * ostiga tushib, panelni cho'zib yuborardi.
 *
 * Bitta tab qatori ularni tenglashtiradi va panel balandligini
 * BARQAROR qiladi — bu `sticky` ustun uchun muhim: ichkarida nima
 * bo'lishidan qat'i nazar, panel ekrandan baland bo'lib qolmaydi.
 */
type Tab = "tests" | "result" | "history";

/**
 * Yechim yozish paneli — masala sahifasining o'ng ustuni.
 *
 * Shart chapda qoladi va o'z holicha aylanadi, panel esa yopishib turadi.
 * Shu tufayli shartga qarab turib kod yozish mumkin.
 *
 * Ikkita amal bor va ular ATAYLAB ajratilgan:
 *   — "Sinab ko'rish" natijani tarixga yozmaydi va faqat namunalarda
 *     (yoki foydalanuvchi kirishida) ishlaydi;
 *   — "Yuborish" esa yakuniy urinish, hamma testlar bo'yicha.
 */
export function SubmitPanel({
	slug,
	problemId,
	languages,
	samples,
	testCount,
}: {
	slug: string;
	problemId: number;
	languages: LanguageDto[];
	/**
	 * Namunali testlar — "Testlar" tab'ida ko'rsatiladi.
	 *
	 * Ular sahifada allaqachon bor (shart ostida), lekin bu yerda ham
	 * kerak: foydalanuvchi kod yozayotganda qaysi kirish bilan
	 * ishlatayotganini KO'RIB turishi kerak, tepaga aylantirmasdan.
	 */
	samples: { input: string; expected_output: string }[];
	/** Jami testlar soni — tekshiruv holatini ko'rsatish uchun. */
	testCount: number;
}) {
	const t = useTranslations("submission");
	const format = useFormatter();
	const { status: sessionStatus } = useSession();
	const { state, submit, run } = useSubmission(slug);

	const [language, setLanguage] = useState(languages[0]?.code ?? "");
	const [code, setCode] = useState("");
	const [useCustom, setUseCustom] = useState(false);
	const [tab, setTab] = useState<Tab>("tests");
	// Kamida bitta holat har doim bor — bo'sh ro'yxatni backend rad etadi
	// va foydalanuvchiga "avval holat qo'shing" deyish ortiqcha qadam.
	const [cases, setCases] = useState<string[]>([""]);
	const [activeCase, setActiveCase] = useState(0);
	const [localError, setLocalError] = useState<string | null>(null);

	/*
	 * Foydalanuvchi muharrirga tekkanmi.
	 *
	 * Oxirgi yechim tarmoqdan keladi, ya'ni u sahifa ochilgandan bir
	 * lahza KEYIN yetib boradi. Shu oraliqda odam yozishni boshlagan
	 * bo'lishi mumkin — o'shanda yozganini eski kod bilan bosib o'tish
	 * eng yomon xato bo'lardi. `state` emas, `ref`: uni o'qiydigan
	 * joyning qayta render bo'lishi shart emas.
	 */
	const touched = useRef(false);
	const [restoredAt, setRestoredAt] = useState<number | null>(null);

	// Yakuniy verdikt kelganda tarixni qayta yuklash uchun hisoblagich.
	const [historyKey, setHistoryKey] = useState(0);
	// Bir xil yechim uchun ikki marta ortmasligi kerak: `state` obyekti
	// polling davomida bir necha marta yangilanadi.
	const lastFinalId = useRef<number | null>(null);

	useEffect(() => {
		// FAQAT haqiqiy yuborish tarixni o'zgartiradi — sinovlar u yerda
		// ko'rinmaydi, ya'ni qayta yuklash ham keraksiz so'rov bo'lardi.
		if (state.phase !== "final" || state.kind !== "submit") return;
		if (lastFinalId.current === state.submission.id) return;
		lastFinalId.current = state.submission.id;
		setHistoryKey((n) => n + 1);
	}, [state]);

	/*
	 * Natija kelganda kerakli tab O'ZI ochiladi.
	 *
	 * O'z kirishi bilan ishlangan run "Testlar" da qoladi: chiqish har
	 * holatning yonida ko'rsatiladi va ularni ko'z bilan moslashtirish
	 * shart emas. Qolgan hamma narsa "Natija" ga o'tadi — aks holda
	 * foydalanuvchi tugmani bosib, hech narsa o'zgarmaganini ko'rardi.
	 */
	useEffect(() => {
		if (state.phase !== "watching" && state.phase !== "final" && state.phase !== "timeout") {
			return;
		}
		setTab(state.kind === "runCustom" ? "tests" : "result");
	}, [state]);

	/*
	 * Oxirgi yechim muharrirga tiklanadi.
	 *
	 * Sabab amaliy: odam masalaga qaytganda ko'pincha o'z kodini davom
	 * ettiradi yoki uni qayta ko'radi — bo'sh muharrir esa uni
	 * yozganini boshqa joydan qidirishga majbur qiladi.
	 *
	 * Ikkita so'rov: ro'yxat oxirgi yechimning id'sini beradi, kodning
	 * O'ZI esa faqat tafsilotda keladi (`source_code` ro'yxatda ataylab
	 * yo'q — u kilobaytlab matn va ro'yxatga kerak emas). Buni bitta
	 * so'rovga aylantirish uchun backendga yangi endpoint kerak
	 * bo'lardi; ikkita so'rov faqat sahifa ochilganda va faqat
	 * kirgan foydalanuvchi uchun ketadi.
	 *
	 * Til ham tiklanadi: Python kodini C++ muharririda ochish uni
	 * darrov "ishlamaydigan" qilib ko'rsatardi.
	 */
	useEffect(() => {
		if (sessionStatus !== "authenticated") return;

		let cancelled = false;

		void withFreshToken(async (token) => {
			const list = await submissionsApi.listSubmissions(
				{ problemId, perPage: 1 },
				{ token },
			);
			const last = list.submissions[0];
			if (last === undefined) return null;
			return submissionsApi.getSubmission(last.id, { token });
		})
			.then((detail) => {
				if (cancelled || detail === null) return;
				if (touched.current) return;
				if (!detail.source_code) return;

				setCode(detail.source_code);
				setLanguage(detail.language.code);
				setRestoredAt(detail.created_at);
			})
			.catch(() => {
				// Jim yutiladi: tiklash — qulaylik, uning ishlamasligi
				// yechim yuborishga xalaqit bermaydi.
			});

		return () => {
			cancelled = true;
		};
	}, [problemId, sessionStatus]);

	const busy = state.phase === "submitting" || state.phase === "watching";

	const errorMessage = localError ?? (state.phase === "error" ? t(state.code) : null);

	function validate(): boolean {
		if (code.trim() === "") {
			setLocalError(t("emptyCode"));
			return false;
		}
		// Kirish hajmi mijoz tomonda tekshiriladi: server ham tekshiradi,
		// lekin u kod va kirish uchun BIR XIL 413 qaytaradi va ularni
		// ajratib bo'lmaydi. Bu yerda tekshirsak xabar aniq bo'ladi.
		// Chegara UMUMIY hajmga — backenddagi qoida bilan bir xil.
		if (useCustom) {
			const total = cases.reduce((sum, item) => sum + item.length, 0);
			if (total > MAX_CUSTOM_INPUT) {
				setLocalError(t("inputTooLarge"));
				return false;
			}
		}
		setLocalError(null);
		return true;
	}

	if (sessionStatus === "anonymous") {
		return (
			<Panel className="px-5 py-6">
				<p className="text-fg-secondary">{t("loginRequired")}</p>
				<a
					href={`/kirish?next=${encodeURIComponent(`/masalalar/${slug}`)}`}
					className="mt-3 inline-flex rounded-control bg-fg px-4 py-2 text-sm font-semibold text-fg-inverted transition-colors hover:bg-accent"
				>
					{t("loginCta")}
				</a>
			</Panel>
		);
	}

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-center gap-3">
				<h2 className="text-lg font-bold">{t("title")}</h2>
				<select
					value={language}
					onChange={(event) => setLanguage(event.target.value)}
					aria-label={t("language")}
					className="ml-auto rounded-control border border-border-strong bg-surface px-2.5 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
				>
					{languages.map((item) => (
						<option key={item.code} value={item.code}>
							{item.name} {item.version}
						</option>
					))}
				</select>
			</div>

			{/* Balandlik qat'iy: panel yopishib turadi, ya'ni u ekrandan
			    balandroq bo'lsa `sticky` ishlamay qoladi. */}
			<div className="h-[420px]">
				<CodeEditor
					value={code}
					onChange={(next) => {
						touched.current = true;
						setCode(next);
					}}
					language={language}
					disabled={busy}
				/>
			</div>

			{/*
			 * Kod qayerdan kelganini aytadigan qator.
			 *
			 * Usiz foydalanuvchi bo'sh kutgan joyda kod ko'rib, uni kim
			 * yozganini o'ylab qolardi. Yozishni boshlagach yo'qoladi —
			 * o'shanda bu ma'lumot eskiradi.
			 */}
			{restoredAt !== null && !touched.current && (
				<p className="text-[12.5px] text-fg-muted">
					{t("restoredFrom", {
						date: format.dateTime(new Date(restoredAt * 1000), {
							day: "2-digit",
							month: "2-digit",
							hour: "2-digit",
							minute: "2-digit",
						}),
					})}
				</p>
			)}

			{errorMessage && (
				<p role="alert" className="text-sm text-danger">
					{errorMessage}
				</p>
			)}

			{/* ── Tab qatori: chapda bo'limlar, o'ngda amallar ── */}
			<div className="flex flex-wrap items-center gap-2 border-b border-border-default">
				<div className="flex">
					<TabButton active={tab === "tests"} onClick={() => setTab("tests")}>
						{t("tabTests")}
					</TabButton>
					<TabButton active={tab === "result"} onClick={() => setTab("result")}>
						{t("tabResult")}
					</TabButton>
					<TabButton active={tab === "history"} onClick={() => setTab("history")}>
						{t("tabHistory")}
					</TabButton>
				</div>

				<div className="ml-auto flex items-center gap-2 pb-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => {
							// `undefined` va bo'sh SATR farqli: birinchisi
							// "namunalar bo'yicha", ikkinchisi "kirishsiz ishga tushir".
							if (validate()) void run(language, code, useCustom ? cases : undefined);
						}}
						disabled={busy}
					>
						{busy && state.phase !== "submitting" ? t("running") : t("run")}
					</Button>

					<Button
						type="button"
						size="sm"
						onClick={() => {
							if (validate()) void submit(language, code);
						}}
						disabled={busy}
					>
						{state.phase === "submitting" && state.kind === "submit"
							? t("submitting")
							: t("submit")}
					</Button>
				</div>
			</div>

			{tab === "tests" && (
				<div className="flex flex-col gap-3">
					{/*
					 * Rejim tanlagichi — belgi (checkbox) emas.
					 *
					 * Belgi "yoqilgan/o'chirilgan" deb o'qiladi, bu yerda
					 * esa ikki TENG variant bor: namunalar bo'yicha yoki
					 * o'z kirishi bilan. Segment tugmalari ikkalasini ham
					 * ko'rsatadi, ya'ni foydalanuvchi ikkinchi variant
					 * borligini bilish uchun belgini bosib ko'rishi
					 * shart emas.
					 */}
					<div className="flex gap-1.5">
						<ModeButton active={!useCustom} onClick={() => setUseCustom(false)}>
							{t("modeSamples")}
						</ModeButton>
						<ModeButton active={useCustom} onClick={() => setUseCustom(true)}>
							{t("modeCustom")}
						</ModeButton>
					</div>

					{useCustom ? (
						<CustomCases
							cases={cases}
							onChange={setCases}
							active={activeCase}
							onActiveChange={setActiveCase}
							disabled={busy}
							outputs={
								state.phase === "final" && state.kind === "runCustom"
									? state.submission.run_outputs
									: undefined
							}
							failedIndex={
								state.phase === "final" &&
								state.kind === "runCustom" &&
								state.submission.failed_test !== null
									? state.submission.failed_test - 1
									: null
							}
							verdict={
								state.phase === "final" && state.kind === "runCustom"
									? state.submission.verdict
									: null
							}
						/>
					) : samples.length === 0 ? (
						<p className="text-sm text-fg-muted">{t("noSamples")}</p>
					) : (
						/*
						 * Namunalar faqat O'QISH uchun: ular masalaning bir
						 * qismi va tahrirlansa, run natijasi masalaga
						 * aloqasiz bo'lib qolardi. Tahrirlash kerak bo'lsa —
						 * "O'z kirishim" rejimi bor.
						 */
						<ul className="flex flex-col gap-2">
							{samples.map((sample, index) => (
								<li key={index} className="rounded-control border border-border-default p-3">
									<p className="text-[11px] font-bold tracking-wide text-fg-subtle">
										{t("sampleNumber", { number: index + 1 })}
									</p>
									<div className="mt-2 grid gap-2 sm:grid-cols-2">
										<pre className="overflow-x-auto rounded-control bg-surface-subtle p-2 font-mono text-[12.5px]">
											{sample.input}
										</pre>
										<pre className="overflow-x-auto rounded-control bg-surface-subtle p-2 font-mono text-[12.5px]">
											{sample.expected_output}
										</pre>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			)}

			{tab === "result" &&
				((state.phase === "watching" ||
					state.phase === "final" ||
					state.phase === "timeout") &&
				state.kind !== "runCustom" ? (
					<div className="flex flex-col gap-4">
						{/*
						 * Testlar holati verdikt kartasidan TEPADA: odam
						 * avval "qayerda to'xtadi" ni ko'radi, keyin
						 * tafsilotni. Teskarisi bo'lsa, ko'z avval raqamlarga
						 * tushib, keyin yuqoriga qaytishga majbur bo'lardi.
						 *
						 * O'z kirishi bilan ishlangan run bu yerga umuman
						 * tushmaydi: u yerda masalaning testlari ishlamaydi.
						 */}
						<TestProgress
							total={testCount}
							submission={state.submission}
							running={state.phase === "watching"}
						/>
						<VerdictCard
							submission={state.submission}
							stillJudging={state.phase === "timeout"}
						/>
					</div>
				) : (
					// Bo'sh tab ham xabar berishi kerak: "hech narsa yo'q"
					// bilan "yuklanmadi" ni foydalanuvchi farqlay olsin.
					<p className="text-sm text-fg-muted">{t("noResult")}</p>
				))}

			{tab === "history" && (
				<SubmissionHistory
					problemId={problemId}
					reloadKey={historyKey}
					onLoadCode={(next, languageCode) => {
						/*
						 * Yozib turgan kodni SO'RAMASDAN bosib o'tmaymiz.
						 * Tiklangan kod (`touched === false`) boshqa gap:
						 * uni foydalanuvchi yozmagan, ya'ni yo'qotadigan
						 * narsa yo'q.
						 */
						if (touched.current && code.trim() !== "" && !window.confirm(t("overwriteCode"))) {
							return;
						}

						touched.current = true;
						setCode(next);
						setLanguage(languageCode);
						setRestoredAt(null);
					}}
				/>
			)}

		</section>
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
			className={`-mb-px cursor-pointer border-b-2 px-3.5 py-2 text-sm font-semibold transition-colors ${
				active ? "border-fg text-fg" : "border-transparent text-fg-muted hover:text-fg"
			}`}
		>
			{children}
		</button>
	);
}

function ModeButton({
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
			className={`cursor-pointer rounded-pill px-3 py-1.5 text-[13px] font-semibold transition-colors ${
				active
					? "bg-fg text-fg-inverted"
					: "border border-border-default text-fg-secondary hover:border-border-hover"
			}`}
		>
			{children}
		</button>
	);
}
