"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import type { LanguageDto } from "@binary/api";
import { Button, Panel } from "@binary/ui";
import { useSession } from "@/shared/session";
import { useSubmission } from "../use-submission";
import { SubmissionHistory } from "./submission-history";
import { VerdictCard } from "./verdict-card";

/**
 * Yechim yuborish paneli — client "orol".
 *
 * Tillar ro'yxati SERVERDA olinadi va prop bo'lib keladi: shunda brauzer
 * qo'shimcha so'rov yubormaydi va sahifa baribir to'liq server tomonda
 * render qilinadi (SEO uchun muhim).
 *
 * Muharrir hozircha `<textarea>`. Bu ATAYLAB: Monaco ~2 MB bundle
 * qo'shadi, CodeMirror 6 esa ~150 KB — ikkisi ham birinchi ishlaydigan
 * yuborish oqimidan MUHIMROQ emas. Trigger: sintaksis bo'yash yoki qavs
 * juftlash so'ralganda CodeMirror 6 qo'shiladi (Monaco emas — hajmi
 * tufayli).
 */
export function SubmitPanel({
	slug,
	problemId,
	languages,
}: {
	slug: string;
	problemId: number;
	languages: LanguageDto[];
}) {
	const t = useTranslations("submission");
	const { status: sessionStatus } = useSession();
	const { state, submit } = useSubmission(slug);

	const [language, setLanguage] = useState(languages[0]?.code ?? "");
	const [code, setCode] = useState("");
	const [localError, setLocalError] = useState<string | null>(null);

	// Yakuniy verdikt kelganda tarixni qayta yuklash uchun hisoblagich.
	const [historyKey, setHistoryKey] = useState(0);
	// Bir xil yechim uchun ikki marta ortmasligi kerak: `state` obyekti
	// polling davomida bir necha marta yangilanadi.
	const lastFinalId = useRef<number | null>(null);

	useEffect(() => {
		if (state.phase !== "final") return;
		if (lastFinalId.current === state.submission.id) return;
		lastFinalId.current = state.submission.id;
		setHistoryKey((n) => n + 1);
	}, [state]);

	const busy = state.phase === "submitting" || state.phase === "watching";

	// Mahalliy validatsiya (bo'sh kod) va serverdan kelgan xato bir joyda
	// ko'rsatiladi, lekin manbalari boshqa: birinchisi yuborishdan oldin,
	// ikkinchisi keyin. Bittasini ikkinchisi bosib ketmasligi uchun
	// mahalliy xato ustunroq — u yangiroq ma'lumot.
	const errorMessage =
		localError ?? (state.phase === "error" ? t(state.code) : null);

	async function onSubmit(event: FormEvent) {
		event.preventDefault();

		if (code.trim() === "") {
			setLocalError(t("emptyCode"));
			return;
		}
		setLocalError(null);
		await submit(language, code);
	}

	/**
	 * Tab tugmasi 4 bo'shliq qo'yadi.
	 *
	 * Usiz Tab fokusni keyingi elementga o'tkazadi — kod yozayotgan odam
	 * uchun bu formadan chiqib ketish degani. `preventDefault` esa
	 * klaviatura bilan yuradigan foydalanuvchini formada QAMAB qo'ymaydi,
	 * chunki `Escape` va `Shift+Tab` ishlashda davom etadi.
	 */
	function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		if (event.key !== "Tab" || event.shiftKey) return;

		event.preventDefault();
		const target = event.currentTarget;
		const { selectionStart, selectionEnd, value } = target;
		const next = `${value.slice(0, selectionStart)}    ${value.slice(selectionEnd)}`;

		setCode(next);
		// React holatni yangilagandan keyin kursorni joyiga qo'yish kerak,
		// aks holda u matn oxiriga sakraydi.
		requestAnimationFrame(() => {
			target.selectionStart = target.selectionEnd = selectionStart + 4;
		});
	}

	if (sessionStatus === "anonymous") {
		return (
			<Panel className="mt-8 px-5 py-6">
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
		<section className="mt-9">
			<h2 className="text-lg font-bold">{t("title")}</h2>

			<form onSubmit={onSubmit} className="mt-3">
				<div className="flex items-center gap-3">
					<label htmlFor="language" className="text-sm font-semibold">
						{t("language")}
					</label>
					<select
						id="language"
						value={language}
						onChange={(event) => setLanguage(event.target.value)}
						className="rounded-control border border-border-strong bg-surface px-2.5 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
					>
						{languages.map((item) => (
							<option key={item.code} value={item.code}>
								{item.name} {item.version}
							</option>
						))}
					</select>
				</div>

				<label htmlFor="code" className="mt-4 block text-sm font-semibold">
					{t("code")}
				</label>
				<textarea
					id="code"
					value={code}
					onChange={(event) => setCode(event.target.value)}
					onKeyDown={onKeyDown}
					placeholder={t("codePlaceholder")}
					rows={14}
					spellCheck={false}
					// Brauzerlar kod uchun avtomatik tuzatishni yoqib yuboradi
					// va u qo'shtirnoqlarni "chiroyli" belgilarga almashtiradi —
					// natijada kompilyatsiya xatosi chiqadi.
					autoCorrect="off"
					autoCapitalize="off"
					className="mt-1.5 w-full resize-y rounded-card border border-border-strong bg-surface p-3 font-mono text-[13px] leading-relaxed focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
				/>

				{errorMessage && (
					<p role="alert" className="mt-2 text-sm text-danger">
						{errorMessage}
					</p>
				)}

				<div className="mt-3">
					<Button type="submit" disabled={busy}>
						{state.phase === "submitting" ? t("submitting") : t("submit")}
					</Button>
				</div>
			</form>

			{(state.phase === "watching" ||
				state.phase === "final" ||
				state.phase === "timeout") && (
				<VerdictCard submission={state.submission} stillJudging={state.phase === "timeout"} />
			)}

			<SubmissionHistory problemId={problemId} reloadKey={historyKey} />
		</section>
	);
}
