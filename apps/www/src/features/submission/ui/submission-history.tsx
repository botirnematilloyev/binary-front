"use client";

import { useCallback, useEffect, useState, type ReactNode, type SVGProps } from "react";
import { useLocale, useNow, useTranslations } from "next-intl";
import { submissionsApi, type SubmissionDto } from "@binary/api";
import { Badge, Button, Panel, cn } from "@binary/ui";
import { formatMemory, formatMs } from "@/shared/format";
import { relativeTime, type Locale } from "@/shared/i18n/locales";
import { useSession, withFreshToken } from "@binary/session";
import { verdictTone } from "../model";

/** Masala sahifasida ko'rsatiladigan urinishlar soni. */
const PER_PAGE = 10;

type State =
	| { phase: "loading" }
	| { phase: "ready"; items: SubmissionDto[] }
	| { phase: "error" };

/**
 * Foydalanuvchining shu masalaga yuborgan yechimlari.
 *
 * Client komponent, server tomonda render QILINMAYDI. Ikki sabab: bu
 * shaxsiy ma'lumot, ya'ni SEO qiymati nol; va autentifikatsiyalangan
 * sahifani serverda render qilish uchun token serverga kerak bo'lardi,
 * bu esa cookie'ga o'tishni talab qiladi — dizayn bo'yicha bundan voz
 * kechganmiz.
 *
 * `reloadKey` yangi verdikt kelganda ortadi va ro'yxatni qayta yuklaydi.
 * Muqobil yo'l — yuborishdan keyin ro'yxatga qo'lda qo'shish — ikkita
 * haqiqat manbasini yaratardi va ular albatta bir-biridan uzoqlashardi.
 */
export function SubmissionHistory({
	problemId,
	reloadKey,
	onLoadCode,
}: {
	problemId: number;
	reloadKey: number;
	/**
	 * Kodni muharrirga yuklash. Panel o'zi hal qiladi — u yerda
	 * foydalanuvchi nima yozgani ma'lum, ya'ni ustidan yozishdan oldin
	 * so'rash kerakmi yoki yo'qmi ham o'sha yerda bilinadi.
	 */
	onLoadCode: (code: string, languageCode: string) => void;
}) {
	const t = useTranslations("submission");
	const tVerdict = useTranslations("verdict");
	const tStatus = useTranslations("submissionStatus");
	const locale = useLocale() as Locale;
	const { status: sessionStatus } = useSession();

	/*
	 * Nisbiy vaqt uchun tayanch nuqta.
	 *
	 * `format.relativeTime(date)` ni `now` siz chaqirish mumkin, lekin
	 * next-intl bundan ogohlantiradi va haqli: o'shanda har render'da
	 * `Date.now()` olinadi, ya'ni server render qilgan qiymat bilan
	 * brauzerdagi qiymat farq qilishi mumkin (hydration nomuvofiqligi).
	 *
	 * `updateInterval` yon foyda beradi: "2 daqiqa oldin" o'zi "3 daqiqa
	 * oldin" ga aylanadi. Bir daqiqa — ro'yxat uchun yetarli aniqlik va
	 * arzon (10 ta element qayta render bo'ladi, xolos).
	 */
	const now = useNow({ updateInterval: 60_000 });

	const [state, setState] = useState<State>({ phase: "loading" });

	/*
	 * Ochilgan yechim va yuklab olingan kodlar.
	 *
	 * Kod ro'yxatda kelmaydi (`source_code` u yerda ataylab yo'q — har
	 * qator kilobaytlab matn bo'lardi), shuning uchun u faqat qator
	 * ochilganda so'raladi va keyin eslab qolinadi: bir yechimni ikki
	 * marta ochish ikkinchi so'rov qilmaydi.
	 */
	const [openID, setOpenID] = useState<number | null>(null);
	const [codes, setCodes] = useState<Record<number, string>>({});
	const [loadingID, setLoadingID] = useState<number | null>(null);

	async function toggle(id: number) {
		if (openID === id) {
			setOpenID(null);
			return;
		}

		setOpenID(id);
		if (codes[id] !== undefined) return;

		setLoadingID(id);
		try {
			const detail = await withFreshToken((token) =>
				submissionsApi.getSubmission(id, { token }),
			);
			// `source_code` faqat EGASIGA qaytadi. Bo'sh bo'lsa — bu
			// xato emas, shunchaki ko'rsatadigan narsa yo'q.
			setCodes((current) => ({ ...current, [id]: detail.source_code ?? "" }));
		} catch {
			setCodes((current) => ({ ...current, [id]: "" }));
		} finally {
			setLoadingID(null);
		}
	}

	const load = useCallback(async () => {
		setState({ phase: "loading" });
		try {
			const result = await withFreshToken((token) =>
				submissionsApi.listSubmissions({ problemId, perPage: PER_PAGE }, { token }),
			);
			setState({ phase: "ready", items: result.submissions });
		} catch {
			setState({ phase: "error" });
		}
	}, [problemId]);

	useEffect(() => {
		if (sessionStatus !== "authenticated") return;
		void load();
	}, [load, reloadKey, sessionStatus]);

	// Anonim foydalanuvchida umuman ko'rsatilmaydi — "kiring" taklifi
	// yuqorida, yuborish panelida allaqachon bor.
	if (sessionStatus !== "authenticated") return null;

	/*
	 * Sarlavhasiz. Chaqiruvchi kontekstni o'zi beradi — hozir u
	 * `<details>` ning sarlavhasi, ya'ni bu yerda yana bir `<h2>` bir
	 * narsani ikki marta aytardi.
	 */
	return (
		<div>
			{state.phase === "loading" && (
				<Panel className="mt-3 h-24 animate-pulse bg-surface-subtle" />
			)}

			{state.phase === "error" && (
				<Panel className="mt-3 px-4 py-5">
					<p className="text-sm text-fg-muted">{t("historyError")}</p>
					<Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}>
						{t("retry")}
					</Button>
				</Panel>
			)}

			{state.phase === "ready" && state.items.length === 0 && (
				<Panel className="mt-3 px-4 py-6">
					<p className="text-sm text-fg-muted">{t("historyEmpty")}</p>
				</Panel>
			)}

			{state.phase === "ready" && state.items.length > 0 && (
				<Panel className="mt-3">
					<ul>
						{state.items.map((item) => {
							const failedLabel =
								item.failed_test !== null ? t("failedTest", { n: item.failed_test }) : null;

							return (
							<li key={item.id} className="border-b border-border-default last:border-0">
								{/*
								 * Butun qator tugma: kodni ko'rish uchun aniq
								 * "ochish" havolasini qidirish shart emas.
								 * Haqiqiy `<button>` — klaviatura va skrin
								 * rider shu tufayli ishlaydi.
								 */}
								<button
									type="button"
									onClick={() => void toggle(item.id)}
									aria-expanded={openID === item.id}
									className="grid w-full grid-cols-1 gap-2 px-4 py-2.5 text-left transition-colors hover:bg-surface-subtle sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
								>
									<span className="flex min-w-0 items-center gap-3">
										{item.verdict ? (
											<Badge
												tone={verdictTone(item.verdict)}
												size="sm"
												className="max-w-[45vw] shrink-0 overflow-hidden text-ellipsis sm:max-w-[180px]"
											>
												{tVerdict(item.verdict)}
											</Badge>
										) : (
											<Badge
												size="sm"
												className="max-w-[45vw] shrink-0 overflow-hidden text-ellipsis sm:max-w-[180px]"
											>
												{tStatus(item.status)}
											</Badge>
										)}

										<span className="min-w-[72px] max-w-[140px] truncate whitespace-nowrap text-sm text-fg-secondary">
											{item.language.name} {item.language.version}
										</span>

										{failedLabel !== null && (
											<span className="min-w-0 truncate text-sm text-fg-muted" title={failedLabel}>
												{failedLabel}
											</span>
										)}
									</span>

									<span className="flex min-w-0 items-center gap-2 font-mono text-[12px] text-fg-muted sm:justify-end sm:gap-3">
										{item.time_ms !== null && (
											<span className="whitespace-nowrap">{formatMs(item.time_ms)}</span>
										)}
										{item.memory_kb !== null && (
											<span className="whitespace-nowrap">{formatMemory(item.memory_kb)}</span>
										)}
										{/*
										 * Nisbiy vaqt `format.relativeTime` bilan EMAS:
										 * Chrome'da `uz` uchun ma'lumot yo'q va u inglizcha
										 * "yesterday" bilan `-1 d` qaytaradi.
										 * `<time>` tegi va `dateTime` atributi esa aniq
										 * vaqtni mashina o'qiy oladigan shaklda saqlaydi.
										 */}
										<time
											dateTime={new Date(item.created_at * 1000).toISOString()}
											className="whitespace-nowrap"
										>
											{relativeTime(locale, new Date(item.created_at * 1000), now)}
										</time>
										<span aria-hidden className="shrink-0 text-fg-subtle">
											{openID === item.id ? "▾" : "▸"}
										</span>
									</span>
								</button>

								{openID === item.id && (
									<div className="px-4 pb-3">
										{loadingID === item.id ? (
											<div className="h-16 animate-pulse rounded-control bg-surface-subtle" />
										) : codes[item.id] ? (
											<>
												{/*
												 * `<pre>` — muharrir emas: bu yerda kod
												 * faqat o'qiladi, ikkinchi CodeMirror
												 * nusxasi esa har qator uchun alohida
												 * bo'lardi va sahifani og'irlashtirardi.
												 */}
												<pre className="max-h-64 overflow-auto rounded-control bg-surface-subtle p-3 font-mono text-[12.5px] leading-relaxed">
													{codes[item.id]}
												</pre>
												<div className="mt-2 flex justify-end">
													<IconButton
														label={t("loadIntoEditor")}
														icon={<UploadToEditorIcon />}
														onClick={() =>
															onLoadCode(codes[item.id] ?? "", item.language.code)
														}
													/>
												</div>
											</>
										) : (
											<p className="text-sm text-fg-muted">{t("codeUnavailable")}</p>
										)}
									</div>
								)}
							</li>
							);
						})}
					</ul>
				</Panel>
			)}
		</div>
	);
}

function IconButton({
	label,
	icon,
	onClick,
}: {
	label: string;
	icon: ReactNode;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			onClick={onClick}
			className={cn(
				"inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-control border border-border-default text-fg-muted transition-colors",
				"hover:border-accent hover:bg-accent-tint hover:text-accent",
				"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
			)}
		>
			{icon}
		</button>
	);
}

function UploadToEditorIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
			className={cn("size-4", props.className)}
		>
			<path d="M12 15V4" />
			<path d="m7 9 5-5 5 5" />
			<path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
		</svg>
	);
}
