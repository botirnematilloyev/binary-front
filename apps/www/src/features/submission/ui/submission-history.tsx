"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { submissionsApi, type SubmissionDto } from "@binary/api";
import { Badge, Button, Panel } from "@binary/ui";
import { formatMemory, formatMs } from "@/shared/format";
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
}: {
	problemId: number;
	reloadKey: number;
}) {
	const t = useTranslations("submission");
	const tVerdict = useTranslations("verdict");
	const tStatus = useTranslations("submissionStatus");
	const format = useFormatter();
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
						{state.items.map((item) => (
							<li
								key={item.id}
								className="flex flex-wrap items-center gap-3 border-b border-border-default px-4 py-2.5 last:border-0"
							>
								{item.verdict ? (
									<Badge tone={verdictTone(item.verdict)} size="sm">
										{tVerdict(item.verdict)}
									</Badge>
								) : (
									<Badge size="sm">{tStatus(item.status)}</Badge>
								)}

								<span className="text-sm text-fg-secondary">
									{item.language.name} {item.language.version}
								</span>

								{item.failed_test !== null && (
									<span className="text-sm text-fg-muted">
										{t("failedTest", { n: item.failed_test })}
									</span>
								)}

								<span className="ml-auto flex items-center gap-3 font-mono text-[12px] text-fg-muted">
									{item.time_ms !== null && <span>{formatMs(item.time_ms)}</span>}
									{item.memory_kb !== null && <span>{formatMemory(item.memory_kb)}</span>}
									{/*
									 * Nisbiy vaqt (`2 daqiqa oldin`) — `useFormatter`
									 * orqali, ya'ni til bilan birga o'zgaradi.
									 * `<time>` tegi va `dateTime` atributi esa aniq
									 * vaqtni mashina o'qiy oladigan shaklda saqlaydi.
									 */}
									<time
										dateTime={new Date(item.created_at * 1000).toISOString()}
										className="whitespace-nowrap"
									>
										{format.relativeTime(new Date(item.created_at * 1000), now)}
									</time>
								</span>
							</li>
						))}
					</ul>
				</Panel>
			)}
		</div>
	);
}
