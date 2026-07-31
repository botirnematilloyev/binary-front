"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	ApiError,
	ApiTransportError,
	submissionsApi,
	type SubmissionDto,
} from "@binary/api";
import { SessionExpiredError, useSession, withFreshToken } from "@binary/session";

/**
 * Xato KODI qaytariladi, tarjima qilingan matn emas.
 *
 * Hook i18n'ni bilmasligi kerak: shunda uni sinash uchun tarjima
 * konteksti kerak bo'lmaydi, va bir xil kod turli joyda turlicha
 * ko'rsatilishi mumkin (masalan toast va inline matn).
 */
export type SubmitErrorCode =
	| "offline"
	| "tooLarge"
	| "tooManyPending"
	| "noSampleTests"
	| "loginRequired"
	| "genericError";

/**
 * So'rov qaysi maqsadda yuborilgani.
 *
 * Natijani KO'RSATISH shunga bog'liq: namunalar bo'yicha run va yechim
 * verdikt qaytaradi, o'z kirishi bilan run esa dasturning chiqishini.
 * Serverdan kelgan javob ikkalasida bir xil shaklda, ya'ni farqni faqat
 * so'rovni yuborgan tomon biladi — shuning uchun u holatda saqlanadi.
 */
export type SubmitKind = "submit" | "runSamples" | "runCustom";

/**
 * Holat DISKRIMINATSIYALANGAN union bilan.
 *
 * `{ loading: boolean; error: string | null; data: T | null }` shakli
 * mumkin bo'lmagan kombinatsiyalarga yo'l qoldiradi — masalan bir vaqtda
 * `error` ham, `data` ham to'ldirilgan holat. Union esa har fazada
 * QAYSI maydonlar mavjudligini tur darajasida belgilaydi.
 */
export type SubmitState =
	| { phase: "idle" }
	| { phase: "submitting"; kind: SubmitKind }
	| { phase: "watching"; kind: SubmitKind; submission: SubmissionDto }
	| { phase: "final"; kind: SubmitKind; submission: SubmissionDto }
	/** Juda uzoq davom etdi — natija yo'q emas, shunchaki hali kelmagan. */
	| { phase: "timeout"; kind: SubmitKind; submission: SubmissionDto }
	| { phase: "error"; code: SubmitErrorCode };

/*
 * Polling oralig'i o'sib boradi.
 *
 * Backend hujjatida yozilgan xavf: kontest paytida 1000 kutuvchi har
 * sekundda so'rov yuborsa, bu 1000 RPS. Baholash odatda 1–5 sekund
 * oladi, ya'ni birinchi so'rovlar tez, keyingilari sekin bo'lishi
 * mantiqiy — natija darhol kelsa foydalanuvchi kutmaydi, kelmasa esa
 * serverni bekorga urmaymiz.
 */
const POLL_DELAYS_MS = [800, 1000, 1300, 1700, 2200, 2800];
const POLL_MAX_MS = 90_000;

export function useSubmission(slug: string) {
	const { status: sessionStatus } = useSession();
	const [state, setState] = useState<SubmitState>({ phase: "idle" });

	// Har yangi so'rov oldingi pollingni bekor qiladi. Usiz eski
	// yechimning javobi kech kelib yangisining natijasini bosib ketardi.
	const generation = useRef(0);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const stop = useCallback(() => {
		generation.current++;
		if (timer.current) clearTimeout(timer.current);
		timer.current = null;
	}, []);

	// Komponent yo'q qilinganda taymer qolmasin: aks holda React
	// o'chirilgan komponentga `setState` chaqirilganini aytib ogohlantiradi,
	// va so'rovlar bekorga davom etadi.
	useEffect(() => stop, [stop]);

	const watch = useCallback(
		(id: number, kind: SubmitKind, startedAt: number, attempt: number, mine: number) => {
			const delay = POLL_DELAYS_MS[Math.min(attempt, POLL_DELAYS_MS.length - 1)] ?? 2800;

			timer.current = setTimeout(async () => {
				if (mine !== generation.current) return;

				try {
					// `withFreshToken` — tokenni so'rov OLDIDAN tekshiradi.
					// Polling uzoq davom etishi mumkin va aynan shu vaqt
					// oralig'ida access token eskirishi mumkin.
					const submission = await withFreshToken((token) =>
						submissionsApi.getSubmission(id, { token }),
					);
					if (mine !== generation.current) return;

					if (submission.is_final) {
						setState({ phase: "final", kind, submission });
						return;
					}

					if (Date.now() - startedAt > POLL_MAX_MS) {
						setState({ phase: "timeout", kind, submission });
						return;
					}

					setState({ phase: "watching", kind, submission });
					watch(id, kind, startedAt, attempt + 1, mine);
				} catch (cause) {
					if (mine !== generation.current) return;

					// Sessiya tugashi qayta urinish bilan tuzalmaydi — darhol
					// to'xtaymiz. Qolgan xatolar (tarmoq uzilishi, 502) esa
					// baholash to'xtaganini BILDIRMAYDI, shuning uchun umumiy
					// vaqt tugagunicha davom etamiz.
					if (cause instanceof SessionExpiredError) {
						setState({ phase: "error", code: "loginRequired" });
						return;
					}

					if (Date.now() - startedAt > POLL_MAX_MS) {
						setState({ phase: "error", code: "genericError" });
						return;
					}
					watch(id, kind, startedAt, attempt + 1, mine);
				}
			}, delay);
		},
		[],
	);

	/**
	 * Yuborish va sinov bir xil quvurdan o'tadi — faqat chaqiriladigan
	 * endpoint va `kind` farq qiladi. Ikkita alohida funksiya yozish
	 * polling mantiqini ikki nusxada saqlashni talab qilardi.
	 */
	const start = useCallback(
		async (kind: SubmitKind, send: (token: string) => Promise<SubmissionDto>) => {
			stop();
			const mine = generation.current;

			if (sessionStatus !== "authenticated") {
				setState({ phase: "error", code: "loginRequired" });
				return;
			}

			setState({ phase: "submitting", kind });

			try {
				const submission = await withFreshToken(send);
				if (mine !== generation.current) return;

				// Judge shunchalik tez bo'lishi mumkin (biz 20 ms ko'rdik),
				// shuning uchun birinchi javob allaqachon yakuniy bo'lishi
				// mumkin — bunda polling umuman boshlanmaydi.
				if (submission.is_final) {
					setState({ phase: "final", kind, submission });
					return;
				}

				setState({ phase: "watching", kind, submission });
				watch(submission.id, kind, Date.now(), 0, mine);
			} catch (cause) {
				if (mine !== generation.current) return;
				setState({ phase: "error", code: codeFor(cause) });
			}
		},
		[sessionStatus, stop, watch],
	);

	const submit = useCallback(
		(language: string, sourceCode: string) =>
			start("submit", (token) =>
				submissionsApi.submit(slug, { language, sourceCode }, { token }),
			),
		[slug, start],
	);

	const run = useCallback(
		(language: string, sourceCode: string, customInput?: string) =>
			start(customInput === undefined ? "runSamples" : "runCustom", (token) =>
				submissionsApi.run(slug, { language, sourceCode, customInput }, { token }),
			),
		[slug, start],
	);

	const reset = useCallback(() => {
		stop();
		setState({ phase: "idle" });
	}, [stop]);

	return { state, submit, run, reset };
}

function codeFor(cause: unknown): SubmitErrorCode {
	// `withFreshToken` ikki marta urinib ham 401 olgan — bu haqiqatan
	// sessiya tugagani.
	if (cause instanceof SessionExpiredError) return "loginRequired";
	if (cause instanceof ApiTransportError) return "offline";

	if (cause instanceof ApiError) {
		// 413 — backend `ErrSourceTooLarge` va `ErrCustomInputTooLarge`
		// uchun BIR XIL kodni qaytaradi. Kirish hajmini mijoz tomonda
		// oldindan tekshiramiz, shuning uchun bu yerga kelgan 413 amalda
		// har doim kod haqida bo'ladi.
		if (cause.status === 413) return "tooLarge";
		if (cause.status === 422) return "noSampleTests";
		if (cause.status === 429) return "tooManyPending";
		if (cause.status === 401) return "loginRequired";
	}

	return "genericError";
}
