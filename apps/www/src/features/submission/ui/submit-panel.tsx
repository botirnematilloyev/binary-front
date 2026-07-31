"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { LanguageDto } from "@binary/api";
import { Button, Panel } from "@binary/ui";
import { useSession } from "@binary/session";
import { useSubmission } from "../use-submission";
import { CodeEditor } from "./code-editor";
import { RunOutputCard } from "./run-output-card";
import { SubmissionHistory } from "./submission-history";
import { VerdictCard } from "./verdict-card";

/** Backenddagi `MaxCustomInputBytes` bilan bir xil. */
const MAX_CUSTOM_INPUT = 16 * 1024;

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
}: {
	slug: string;
	problemId: number;
	languages: LanguageDto[];
}) {
	const t = useTranslations("submission");
	const { status: sessionStatus } = useSession();
	const { state, submit, run } = useSubmission(slug);

	const [language, setLanguage] = useState(languages[0]?.code ?? "");
	const [code, setCode] = useState("");
	const [useCustom, setUseCustom] = useState(false);
	const [customInput, setCustomInput] = useState("");
	const [localError, setLocalError] = useState<string | null>(null);

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
		if (useCustom && customInput.length > MAX_CUSTOM_INPUT) {
			setLocalError(t("inputTooLarge"));
			return false;
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
				<CodeEditor value={code} onChange={setCode} language={language} disabled={busy} />
			</div>

			<label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
				<input
					type="checkbox"
					checked={useCustom}
					onChange={(event) => setUseCustom(event.target.checked)}
					className="size-4 cursor-pointer"
				/>
				{t("useCustomInput")}
			</label>

			{useCustom && (
				<div>
					<label htmlFor="custom-input" className="sr-only">
						{t("customInput")}
					</label>
					<textarea
						id="custom-input"
						value={customInput}
						onChange={(event) => setCustomInput(event.target.value)}
						rows={3}
						spellCheck={false}
						autoCorrect="off"
						placeholder="5 3"
						className="w-full resize-y rounded-card border border-border-strong bg-surface p-2.5 font-mono text-[13px] leading-relaxed focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
					/>
				</div>
			)}

			{errorMessage && (
				<p role="alert" className="text-sm text-danger">
					{errorMessage}
				</p>
			)}

			<div className="flex flex-wrap items-center gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						// `undefined` va bo'sh SATR farqli: birinchisi
						// "namunalar bo'yicha", ikkinchisi "kirishsiz ishga tushir".
						if (validate()) void run(language, code, useCustom ? customInput : undefined);
					}}
					disabled={busy}
				>
					{busy && state.phase !== "submitting" ? t("running") : t("run")}
				</Button>

				<Button
					type="button"
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

			{!useCustom && <p className="text-sm text-fg-muted">{t("runHint")}</p>}

			{/*
			 * Natijani KO'RSATISH usuli so'rov turiga bog'liq: o'z kirishi
			 * bilan ishlangan run'da verdikt yo'q va chiqish ko'rsatiladi,
			 * qolganlarida verdikt. Shart bitta joyda — `state.kind` ni
			 * ikki marta tekshirish tur torlashtirishni ham buzardi.
			 */}
			{(state.phase === "watching" ||
				state.phase === "final" ||
				state.phase === "timeout") &&
				(state.kind === "runCustom" ? (
					<RunOutputCard
						submission={state.submission}
						stillRunning={state.phase === "timeout"}
					/>
				) : (
					<VerdictCard
						submission={state.submission}
						stillJudging={state.phase === "timeout"}
					/>
				))}

			{/*
			 * Tarix yopiq holatda boshlanadi. O'ng ustun tor va yopishib
			 * turadi — uzun ro'yxat panelni ekrandan baland qilib, `sticky`
			 * ni buzardi.
			 */}
			<details className="group">
				<summary className="cursor-pointer list-none text-sm font-semibold text-fg-muted hover:text-fg">
					{t("history")}
					<span
						aria-hidden
						className="ml-1.5 inline-block transition-transform group-open:rotate-90"
					>
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
