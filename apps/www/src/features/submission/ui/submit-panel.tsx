"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { LanguageDto } from "@binary/api";
import { Button, Panel } from "@binary/ui";
import { useSession } from "@binary/session";
import { useSubmission } from "../use-submission";
import { CodeEditor } from "./code-editor";
import { SubmissionHistory } from "./submission-history";
import { VerdictCard } from "./verdict-card";

/**
 * Yechim yozish paneli — masala sahifasining o'ng ustuni.
 *
 * Shart chapda qoladi va o'z holicha aylanadi, panel esa yopishib turadi
 * (`sticky` sahifada). Shu tufayli setter yozgan shartga qarab turib kod
 * yozish mumkin — oldin ular ustma-ust joylashgan edi va foydalanuvchi
 * shartni ko'rish uchun yuqoriga qaytishi kerak edi.
 *
 * Tillar ro'yxati SERVERDA olinadi va prop bo'lib keladi: brauzer
 * qo'shimcha so'rov yubormaydi va sahifa baribir to'liq server tomonda
 * render qilinadi (SEO uchun muhim).
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
	// ikkinchisi keyin. Mahalliy xato ustunroq — u yangiroq ma'lumot.
	const errorMessage = localError ?? (state.phase === "error" ? t(state.code) : null);

	async function onSubmit() {
		if (code.trim() === "") {
			setLocalError(t("emptyCode"));
			return;
		}
		setLocalError(null);
		await submit(language, code);
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
				<CodeEditor value={code} onChange={setCode} language={language} disabled={busy} />
			</div>

			{errorMessage && (
				<p role="alert" className="text-sm text-danger">
					{errorMessage}
				</p>
			)}

			<div className="flex items-center gap-3">
				<Button type="button" onClick={() => void onSubmit()} disabled={busy}>
					{state.phase === "submitting" ? t("submitting") : t("submit")}
				</Button>
			</div>

			{(state.phase === "watching" ||
				state.phase === "final" ||
				state.phase === "timeout") && (
				<VerdictCard submission={state.submission} stillJudging={state.phase === "timeout"} />
			)}

			{/*
			 * Tarix yopiq holatda boshlanadi. O'ng ustun tor va yopishib
			 * turadi — uzun ro'yxat panelni ekrandan baland qilib, `sticky`
			 * ni buzardi. Kerak bo'lganda ochiladi.
			 */}
			<details className="group">
				<summary className="cursor-pointer list-none text-sm font-semibold text-fg-muted hover:text-fg">
					{t("history")}
					<span aria-hidden className="ml-1.5 inline-block transition-transform group-open:rotate-90">
						›
					</span>
				</summary>
				<div className="mt-2">
					<SubmissionHistory problemId={problemId} reloadKey={historyKey} />
				</div>
			</details>
		</section>
	);
}
